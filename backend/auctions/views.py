import stripe
from django.conf import settings
from rest_framework import generics, permissions, status, filters
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.authentication import TokenAuthentication
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.authtoken.models import Token
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from .models import AuctionItem, Bid, WatchList, Notification
from .serializers import (
    AuctionItemSerializer,
    BidSerializer,
    BidWithItemSerializer,
    RegisterUserSerializer,
    NotificationSerializer,
)
from django.contrib.auth.models import User

stripe.api_key = settings.STRIPE_SECRET_KEY


class AuctionList(generics.ListCreateAPIView):
    queryset = AuctionItem.objects.all()
    serializer_class = AuctionItemSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    filter_backends = [filters.SearchFilter]
    search_fields = ["title", "description"]

    def get_queryset(self):
        queryset = AuctionItem.objects.all()
        category = self.request.query_params.get("category")
        if category and category != "all":
            queryset = queryset.filter(category=category)
        return queryset

    def perform_create(self, serializer):
        serializer.save(seller=self.request.user)


class IsOwnerOrReadOnly(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True

        return obj.seller == request.user


class AuctionDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset = AuctionItem.objects.all()
    serializer_class = AuctionItemSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsOwnerOrReadOnly]


class PlaceBid(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            auction = AuctionItem.objects.get(pk=pk)
        except AuctionItem.DoesNotExist:
            return Response(
                {"error": "Auction not found"}, status=status.HTTP_404_NOT_FOUND
            )

        if auction.seller == request.user:
            return Response(
                {"error": "You cannot bid on your own auction."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        amount = request.data.get("amount")
        if not amount:
            return Response(
                {"error": "Amount is required"}, status=status.HTTP_400_BAD_REQUEST
            )

        previous_highest_bid = auction.bids.order_by("-amount").first()
        previous_highest_bidder = (
            previous_highest_bid.bidder if previous_highest_bid else None
        )

        if previous_highest_bid and previous_highest_bidder == request.user:
            return Response(
                {"error": "You are already the highest bidder"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        amount = float(amount)
        current_price = (
            previous_highest_bid.amount if previous_highest_bid else auction.base_price
        )

        if amount <= current_price:
            return Response(
                {
                    "error": f"Bid must be higher than the current price (₹{current_price})"
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        bid = Bid.objects.create(auction=auction, bidder=request.user, amount=amount)

        channel_layer = get_channel_layer()

        if auction.seller and auction.seller != request.user:
            async_to_sync(channel_layer.group_send)(
                f"user_{auction.seller.id}",
                {
                    "type": "send_notification",
                    "message": f"New bid of ₹{amount} on '{auction.title}'",
                    "auction_id": auction.id,
                    "new_price": amount,
                    "link": f"/auction/{auction.id}",
                },
            )

        if previous_highest_bidder and previous_highest_bidder != request.user:
            async_to_sync(channel_layer.group_send)(
                f"user_{previous_highest_bidder.id}",
                {
                    "type": "send_notification",
                    "message": f"⚠️ You have been outbid on '{auction.title}'!",
                    "auction_id": auction.id,
                    "new_price": amount,
                    "link": f"/auction/{auction.id}",
                },
            )

        async_to_sync(channel_layer.group_send)(
            f"auction_{auction.id}",
            {
                "type": "auction_update",
                "message": f"New bid: ₹{amount}",
                "current_price": amount,
                "highest_bidder": request.user.id,
            },
        )

        return Response(BidSerializer(bid).data, status=status.HTTP_201_CREATED)


class UserDashboard(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        all_bids = Bid.objects.filter(bidder=request.user).order_by("-created_at")

        highest_bids = {}
        for bid in all_bids:
            if bid.auction.id not in highest_bids:
                highest_bids[bid.auction.id] = bid

        final_bids = list(highest_bids.values())

        my_listings = AuctionItem.objects.filter(seller=request.user).order_by(
            "-created_at"
        )

        return Response(
            {
                "bids": BidWithItemSerializer(
                    final_bids, many=True, context={"request": request}
                ).data,
                "listings": AuctionItemSerializer(
                    my_listings, many=True, context={"request": request}
                ).data,
            }
        )


class RegisterUserView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = [permissions.AllowAny]
    serializer_class = RegisterUserSerializer


class CustomLoginView(ObtainAuthToken):
    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(
            data=request.data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)

        user = serializer.validated_data["user"]
        token, created = Token.objects.get_or_create(user=user)

        return Response(
            {"token": token.key, "user_id": user.pk, "username": user.username}
        )


class WatchListToggle(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            auction = AuctionItem.objects.get(pk=pk)
        except AuctionItem.DoesNotExist:
            return Response({"error": "Not found"}, status=404)

        watchlist_item, created = WatchList.objects.get_or_create(
            user=request.user, auction=auction
        )

        if not created:
            watchlist_item.delete()
            return Response({"watched": False, "message": "Removed from watchlist"})

        return Response({"watched": True, "message": "Added to watchlist"})


class WatchlistList(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        watched_items = AuctionItem.objects.filter(watched_by__user=request.user)

        serializer = AuctionItemSerializer(
            watched_items, many=True, context={"request": request}
        )
        return Response(serializer.data)


class NotificationList(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        notifs = Notification.objects.filter(recipient=request.user).order_by(
            "is_read", "-created_at"
        )[:20]
        serializer = NotificationSerializer(notifs, many=True)
        return Response(serializer.data)


class MarkNotificationRead(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            notif = Notification.objects.get(pk=pk, recipient=request.user)
            notif.is_read = True
            notif.save()
            return Response({"status": "marked read"})
        except Notification.DoesNotExist:
            return Response({"error": "Not found"}, status=404)


class DeleteNotification(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, pk):
        try:
            notif = Notification.objects.get(pk=pk, recipient=request.user)
            notif.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Notification.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)


class ClearAllNotifications(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request):
        Notification.objects.filter(recipient=request.user).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class CreateStripeCheckoutSession(APIView):
    def post(self, request):
        try:
            auction_id = request.data.get("auction_id")
            auction = AuctionItem.objects.get(id=auction_id)

            amount = int(float(auction.current_price) * 100)

            intent = stripe.PaymentIntent.create(
                amount=amount, currency="inr", metadata={"auction_id": auction.id}
            )

            return Response({"clientSecret": intent.client_secret})
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
