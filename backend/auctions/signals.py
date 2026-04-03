from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from .models import Bid, Notification, AuctionItem


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


@receiver(post_save, sender=Bid)
def bid_notification(sender, instance, created, **kwargs):
    if created:
        channel_layer = get_channel_layer()
        group_name = f"auction_{instance.auction.id}"
        async_to_sync(channel_layer.group_send)(
            group_name,
            {
                "type": "auction_update",
                "message": "New bid placed!",
                "current_price": float(instance.amount),  # Moved out of 'message' dict
                "highest_bidder": instance.bidder.id,  # CRITICAL: Must be ID, not username
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
            notify_user_dashboard(
                previous_bid.bidder.id, "outbid", auction.id, float(bid.amount)
            )

        notify_user_dashboard(bidder.id, "new_bid", auction.id, float(bid.amount))


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


@receiver(post_delete, sender=AuctionItem)
def auction_deleted_notification(sender, instance, **kwargs):
    bidders = instance.bids.values_list("bidder_id", flat=True).distinct()
    for bidder_id in bidders:
        notify_user_dashboard(bidder_id, "auction_deleted", instance.id)
