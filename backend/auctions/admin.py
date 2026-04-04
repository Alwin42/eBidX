from django.contrib import admin
from .models import AuctionItem, Bid, AuctionImage, WatchList, Notification, SupportTicket, TicketResponse
# This allows you to upload multiple images directly from the AuctionItem admin page!
class AuctionImageInline(admin.TabularInline):
    model = AuctionImage
    extra = 1  # Shows one empty image upload row by default

@admin.register(AuctionItem)
class AuctionItemAdmin(admin.ModelAdmin):
    # 'current_price' works here because it's a @property on your model
    list_display = ('title', 'seller', 'base_price', 'current_price', 'category', 'condition', 'is_active', 'is_paid', 'end_date')
    list_filter = ('category', 'condition', 'is_active', 'is_paid')
    search_fields = ('title', 'description', 'seller__username')
    inlines = [AuctionImageInline]

@admin.register(Bid)
class BidAdmin(admin.ModelAdmin):
    list_display = ('auction', 'bidder', 'amount', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('auction__title', 'bidder__username')

@admin.register(AuctionImage)
class AuctionImageAdmin(admin.ModelAdmin):
    list_display = ('auction', 'image')
    search_fields = ('auction__title',)

@admin.register(WatchList)
class WatchListAdmin(admin.ModelAdmin):
    list_display = ('user', 'auction', 'created_at')
    search_fields = ('user__username', 'auction__title')

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('recipient', 'message', 'is_read', 'created_at')
    list_filter = ('is_read', 'created_at')
    search_fields = ('recipient__username', 'message')

class TicketResponseInline(admin.TabularInline):
    model = TicketResponse
    extra = 1
    readonly_fields = ('created_at',)

@admin.register(SupportTicket)
class SupportTicketAdmin(admin.ModelAdmin):
    list_display = ('subject', 'user', 'status', 'created_at', 'updated_at')
    list_filter = ('status', 'created_at')
    search_fields = ('subject', 'description', 'user__username', 'user__email')
    inlines = [TicketResponseInline]

    # Automatically set the sender as the Admin when replying from the admin panel
    def save_formset(self, request, form, formset, change):
        instances = formset.save(commit=False)
        for instance in instances:
            if isinstance(instance, TicketResponse) and not hasattr(instance, 'sender_id'):
                instance.sender = request.user
            instance.save()
        formset.save_m2m()