from django.db import models
from django.contrib.auth.models import User


class AuctionItem(models.Model):
    CATEGORY_CHOICES = [
        ("electronics", "Electronics"),
        ("fashion", "Fashion"),
        ("home", "Home & Garden"),
        ("vehicles", "Vehicles"),
        ("toys", "Toys & Collectibles"),
        ("other", "Other"),
    ]

    CONDITION_CHOICES = [
        ("new", "New"),
        ("used", "Used"),
        ("refurbished", "Refurbished"),
    ]

    title = models.CharField(max_length=200)
    description = models.TextField()
    base_price = models.DecimalField(max_digits=10, decimal_places=2)
    image = models.ImageField(upload_to="auction_images/", blank=True, null=True)

    category = models.CharField(
        max_length=20, choices=CATEGORY_CHOICES, default="other"
    )

    condition = models.CharField(
        max_length=20, choices=CONDITION_CHOICES, default="used"
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    end_date = models.DateTimeField()
    seller = models.ForeignKey(User, on_delete=models.CASCADE, related_name="items")
    is_paid = models.BooleanField(default=False)

    @property
    def current_price(self):
        highest_bid = self.bids.order_by("-amount").first()
        return highest_bid.amount if highest_bid else self.base_price

    def __str__(self):
        return self.title


class Bid(models.Model):
    auction = models.ForeignKey(
        AuctionItem, related_name="bids", on_delete=models.CASCADE
    )
    bidder = models.ForeignKey(User, related_name="bids", on_delete=models.CASCADE)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.bidder.username} - {self.amount}"


class AuctionImage(models.Model):
    auction = models.ForeignKey(
        AuctionItem, related_name="images", on_delete=models.CASCADE
    )
    image = models.ImageField(upload_to="auction_images/")

    def __str__(self):
        return f"Image for {self.auction.title}"


class WatchList(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="watchlist")
    auction = models.ForeignKey(
        AuctionItem, on_delete=models.CASCADE, related_name="watched_by"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "auction")


class Notification(models.Model):
    recipient = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="notifications"
    )
    message = models.CharField(max_length=255)
    link = models.CharField(max_length=255, blank=True, null=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Notification for {self.recipient.username}: {self.message}"

class SupportTicket(models.Model):
    STATUS_CHOICES = [
        ('open', 'Open'),
        ('in_progress', 'In Progress'),
        ('closed', 'Closed'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="support_tickets")
    subject = models.CharField(max_length=200)
    description = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='open')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.subject} - {self.user.username} ({self.status})"


class TicketResponse(models.Model):
    ticket = models.ForeignKey(SupportTicket, on_delete=models.CASCADE, related_name="responses")
    sender = models.ForeignKey(User, on_delete=models.CASCADE) # Can be the user or an Admin
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Response to {self.ticket.id} by {self.sender.username}"