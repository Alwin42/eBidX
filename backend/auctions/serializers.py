from django.contrib.auth.models import User
from rest_framework import serializers
from .models import AuctionItem, Bid, AuctionImage, WatchList, Notification


class AuctionImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = AuctionImage
        fields = ["id", "image"]


class AuctionItemSerializer(serializers.ModelSerializer):
    seller = serializers.StringRelatedField()
    current_price = serializers.SerializerMethodField()
    is_owner = serializers.SerializerMethodField()
    highest_bidder = serializers.SerializerMethodField()
    is_watched = serializers.SerializerMethodField()

    images = AuctionImageSerializer(many=True, read_only=True)

    uploaded_images = serializers.ListField(
        child=serializers.ImageField(
            max_length=1000000, allow_empty_file=False, use_url=False
        ),
        write_only=True,
        required=False,
    )

    class Meta:
        model = AuctionItem
        fields = [
            "id",
            "title",
            "description",
            "base_price",
            "current_price",
            "image",
            "category",
            "seller",
            "condition",
            "is_active",
            "created_at",
            "end_date",
            "is_owner",
            "images",
            "uploaded_images",
            "highest_bidder",
            "is_watched",
            "is_paid",
        ]
        read_only_fields = [
            "id",
            "seller",
            "current_price",
            "highest_bidder",
            "is_active",
            "created_at",
            "is_owner",
            "images",
        ]

    def get_current_price(self, obj):
        highest_bid = obj.bids.order_by("-amount").first()
        return highest_bid.amount if highest_bid else obj.base_price

    def get_is_owner(self, obj):
        request = self.context.get("request")
        return request and request.user.is_authenticated and obj.seller == request.user

    def get_highest_bidder(self, obj):
        highest_bid = obj.bids.order_by("-amount").first()
        return highest_bid.bidder.id if highest_bid else None

    def get_is_watched(self, obj):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return WatchList.objects.filter(user=request.user, auction=obj).exists()
        return False

    def create(self, validated_data):
        uploaded_images = validated_data.pop("uploaded_images", [])

        auction = AuctionItem.objects.create(**validated_data)

        for index, img in enumerate(uploaded_images):
            auction_image = AuctionImage.objects.create(auction=auction, image=img)

            if index == 0:
                auction.image = auction_image.image
                auction.save(update_fields=["image"])

        return auction


class BidSerializer(serializers.ModelSerializer):
    bidder = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = Bid
        fields = ["id", "bidder", "amount", "created_at"]


class BidWithItemSerializer(serializers.ModelSerializer):
    auction_item = AuctionItemSerializer(source="auction", read_only=True)

    class Meta:
        model = Bid
        fields = ["id", "amount", "created_at", "auction_item"]


class RegisterUserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    password_confirm = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ["username", "email", "password", "password_confirm"]

    def validate(self, data):
        if data["password"] != data["password_confirm"]:
            raise serializers.ValidationError({"password": "Passwords do not match!"})
        return data

    def create(self, validated_data):
        validated_data.pop("password_confirm", None)
        return User.objects.create_user(**validated_data)


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ["id", "message", "link", "is_read", "created_at"]
        read_only_fields = ["id", "message", "link", "created_at"]
