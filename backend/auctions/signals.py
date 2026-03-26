from django.db.models.signals import post_save
from django.dispatch import receiver
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from .models import Bid, Notification


@receiver(post_save, sender=Bid)
def bid_notification(sender, instance, created, **kwargs):
    if created:
        channel_layer = get_channel_layer()
        group_name = f"auction_{instance.auction.id}"
        async_to_sync(channel_layer.group_send)(
            group_name,
            {
                "type": "auction_update",
                "message": {
                    "current_price": float(instance.amount),
                    "bidder": instance.bidder.username,
                },
            },
        )


@receiver(post_save, sender=Bid)
def create_user_notifications(sender, instance, created, **kwargs):
    if created:
        bid = instance
        auction = bid.auction
        bidder = bid.bidder

        if auction.seller != bidder:
            Notification.objects.create(
                recipient=auction.seller,
                message=f"New bid of ₹{bid.amount} on '{auction.title}'",
                link=f"/auction/{auction.id}",
            )

        previous_bid = (
            Bid.objects.filter(auction=auction)
            .exclude(id=bid.id)
            .order_by("-amount")
            .first()
        )

        if previous_bid and previous_bid.bidder != bidder:
            Notification.objects.create(
                recipient=previous_bid.bidder,
                message=f"⚠️You've been outbid on '{auction.title}'!",
                link=f"/auction/{auction.id}",
            )


@receiver(post_save, sender=Notification)
def push_notification_socket(sender, instance, created, **kwargs):
    if created:
        channel_layer = get_channel_layer()
        group_name = f"user_{instance.recipient.id}"

        async_to_sync(channel_layer.group_send)(
            group_name,
            {
                "type": "send_notification",
                "message": instance.message,
                "link": instance.link,
            },
        )
