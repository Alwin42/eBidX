import stripe
import requests
from django.conf import settings
from django.utils import timezone
from django.db import transaction
from rest_framework import generics, permissions, status, filters
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.authentication import TokenAuthentication
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.authtoken.models import Token
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from .models import AuctionItem, Bid, WatchList, Notification
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from .serializers import (
    AuctionItemSerializer,
    BidSerializer,
    BidWithItemSerializer,
    RegisterUserSerializer,
    NotificationSerializer,
)
from django.contrib.auth.models import User
from django.db.models import Count

stripe.api_key = settings.STRIPE_SECRET_KEY


def get_bid_increment(current_price):
    if current_price < 100:
        return 10.0
    elif current_price < 1000:
        return 50.0
    elif current_price < 10000:
        return 100.0
    elif current_price < 50000:
        return 500.0
    elif current_price < 100000:
        return 1000.0
    elif current_price < 500000:
        return 5000.0
    elif current_price < 1000000:
        return 10000.0
    elif current_price < 5000000:
        return 50000.0
    return 100000.0


def notify_user_dashboard(user_id, event_type, auction_id, new_price=None):
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        f"user_{user_id}",
        {
            "type": "dashboard_update",
            "event": event_type,
            "auction_id": auction_id,
            "new_price": new_price,
        },
    )


def verify_recaptcha(token):
    if not token:
        return False
    secret_key = getattr(settings, "RECAPTCHA_SECRET_KEY", "")
    verify_url = "https://www.google.com/recaptcha/api/siteverify"
    payload = {"secret": secret_key, "response": token}
    try:
        response = requests.post(verify_url, data=payload)
        result = response.json()
        return result.get("success", False)
    except requests.RequestException:
        return False


class AuctionList(generics.ListCreateAPIView):
    serializer_class = AuctionItemSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filter_backends = [filters.SearchFilter]
    search_fields = ["title", "description"]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        now = timezone.now()
        queryset = AuctionItem.objects.filter(end_date__gt=now)
        category = self.request.query_params.get("category")
        if category and category != "all":
            queryset = queryset.filter(category=category)
        return queryset

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED,
            headers=headers,
        )

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

    def get_object(self):
        obj = super().get_object()
        if obj.end_date <= timezone.now():
            is_involved = (
                obj.seller == self.request.user
                or obj.bids.filter(bidder=self.request.user).exists()
            )
            if not is_involved and not self.request.method in permissions.SAFE_METHODS:
                raise permissions.PermissionDenied("This auction has ended.")
        return obj

    def perform_destroy(self, instance):
        instance.delete()


class PlaceBid(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @transaction.atomic
    def post(self, request, pk):
        try:
            auction = AuctionItem.objects.select_for_update().get(pk=pk)
        except AuctionItem.DoesNotExist:
            return Response(
                {"error": "Auction not found"}, status=status.HTTP_404_NOT_FOUND
            )

        if auction.end_date <= timezone.now():
            return Response(
                {"error": "This auction has already ended."},
                status=status.HTTP_400_BAD_REQUEST,
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

        amount = float(amount)
        previous_highest_bid = auction.bids.order_by("-amount").first()
        previous_highest_bidder = (
            previous_highest_bid.bidder if previous_highest_bid else None
        )

        if previous_highest_bid and previous_highest_bidder == request.user:
            return Response(
                {"error": "You are already the highest bidder"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        current_price = float(
            previous_highest_bid.amount if previous_highest_bid else auction.base_price
        )

        required_increment = get_bid_increment(current_price)
        min_allowed_bid = current_price + required_increment

        if amount < min_allowed_bid:
            return Response(
                {
                    "error": f"Bid must be at least ₹{min_allowed_bid} (Minimum increment is ₹{required_increment})"
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        bid = Bid.objects.create(auction=auction, bidder=request.user, amount=amount)

        if previous_highest_bidder and previous_highest_bidder != request.user:
            notify_user_dashboard(
                previous_highest_bidder.id, "outbid", auction.id, amount
            )

        notify_user_dashboard(request.user.id, "new_bid", auction.id, amount)

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

    def post(self, request, *args, **kwargs):
        recaptcha_token = request.data.get("recaptcha_token")
        if not verify_recaptcha(recaptcha_token):
            return Response(
                {"error": "Security check failed. Please verify you are not a robot."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return super().post(request, *args, **kwargs)


class CustomLoginView(ObtainAuthToken):
    def post(self, request, *args, **kwargs):
        recaptcha_token = request.data.get("recaptcha_token")
        if not verify_recaptcha(recaptcha_token):
            return Response(
                {"error": "Security check failed. Please verify you are not a robot."},
                status=status.HTTP_400_BAD_REQUEST,
            )

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

        if auction.end_date <= timezone.now():
            return Response({"error": "Cannot follow an ended auction."}, status=400)

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
            if not auction_id:
                return Response(
                    {"error": "auction_id is required"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            auction = AuctionItem.objects.get(id=auction_id)
            highest_bid = auction.bids.order_by("-amount").first()
            final_price = highest_bid.amount if highest_bid else auction.base_price
            amount = int(float(final_price) * 100)

            intent = stripe.PaymentIntent.create(
                amount=amount,
                currency="inr",
                metadata={
                    "auction_id": auction.id,
                    "buyer_id": request.user.id
                    if request.user.is_authenticated
                    else "anonymous",
                },
            )
            return Response(
                {"clientSecret": intent.client_secret}, status=status.HTTP_200_OK
            )

        except AuctionItem.DoesNotExist:
            return Response(
                {"error": "Auction not found"}, status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class EndAuctionEarly(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @transaction.atomic
    def post(self, request, pk):
        try:
            auction = AuctionItem.objects.select_for_update().get(pk=pk)
        except AuctionItem.DoesNotExist:
            return Response(
                {"error": "Auction not found"}, status=status.HTTP_404_NOT_FOUND
            )

        if auction.seller != request.user:
            return Response(
                {"error": "Only the seller can end this auction."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if auction.end_date <= timezone.now():
            return Response(
                {"error": "Auction has already ended."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        highest_bid = auction.bids.order_by("-amount").first()
        if not highest_bid:
            return Response(
                {
                    "error": "Cannot end early without any bids. You can delete the auction instead."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        auction.end_date = timezone.now()
        auction.save()

        msg = f"🎉 The seller accepted your bid early! You won '{auction.title}'!"
        link = f"/auction/{auction.id}"
        Notification.objects.create(
            recipient=highest_bid.bidder, message=msg, link=link
        )

        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f"user_{highest_bid.bidder.id}",
            {
                "type": "send_notification",
                "message": msg,
                "auction_id": auction.id,
                "new_price": float(highest_bid.amount),
                "link": link,
            },
        )

        async_to_sync(channel_layer.group_send)(
            f"auction_{auction.id}",
            {
                "type": "auction_update",
                "message": "Auction ended early by seller!",
                "current_price": float(highest_bid.amount),
                "highest_bidder": highest_bid.bidder.id,
            },
        )

        notify_user_dashboard(highest_bid.bidder.id, "item_sold", auction.id)
        return Response(
            {"message": "Auction ended successfully.", "end_date": auction.end_date}
        )


class MarkAuctionPaid(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            auction = AuctionItem.objects.get(pk=pk)
            highest_bid = auction.bids.order_by("-amount").first()

            if highest_bid and highest_bid.bidder == request.user:
                auction.is_paid = True
                auction.save()

                Notification.objects.create(
                    recipient=auction.seller,
                    message=f"💰 Payment received! The buyer has paid for '{auction.title}'.",
                    link=f"/auction/{auction.id}",
                )

                notify_user_dashboard(auction.seller.id, "payment_received", auction.id)
                notify_user_dashboard(request.user.id, "payment_sent", auction.id)
                return Response({"status": "success"})
            return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)
        except AuctionItem.DoesNotExist:
            return Response({"error": "Not found"}, status=status.HTTP_404_NOT_FOUND)


class AuctionHomeSections(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        now = timezone.now()
        active_auctions = AuctionItem.objects.filter(end_date__gt=now)
        trending = active_auctions.annotate(bid_count=Count("bids")).order_by(
            "-bid_count"
        )[:10]
        electronics = active_auctions.filter(category__icontains="electronic").order_by(
            "-created_at"
        )[:10]
        fashion = active_auctions.filter(category__icontains="fashion").order_by(
            "-created_at"
        )[:10]
        vehicles = active_auctions.filter(category__icontains="vehicle").order_by(
            "-created_at"
        )[:10]
        toys = active_auctions.filter(category__icontains="toys").order_by()[:10]

        return Response(
            {
                "trending": AuctionItemSerializer(
                    trending, many=True, context={"request": request}
                ).data,
                "electronics": AuctionItemSerializer(
                    electronics, many=True, context={"request": request}
                ).data,
                "fashion": AuctionItemSerializer(
                    fashion, many=True, context={"request": request}
                ).data,
                "vehicles": AuctionItemSerializer(
                    vehicles, many=True, context={"request": request}
                ).data,
                "toys": AuctionItemSerializer(
                    toys, many=True, context={"request": request}
                ).data,
            }
        )
