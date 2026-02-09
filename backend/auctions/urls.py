from django.urls import path
from .views import (
    AuctionList,
    AuctionDetail,
    PlaceBid,
    UserDashboard,
    RegisterUserView,
    CustomLoginView,
    WatchListToggle,
    WatchlistList,
    NotificationList,
    MarkNotificationRead,
    DeleteNotification,
    ClearAllNotifications,
    CreateStripeCheckoutSession,
)

urlpatterns = [
    path("auctions/", AuctionList.as_view(), name="auction-list"),
    path("auctions/<int:pk>/", AuctionDetail.as_view(), name="auction-detail"),
    path("auctions/<int:pk>/bid/", PlaceBid.as_view(), name="place-bid"),
    path("dashboard/", UserDashboard.as_view(), name="user-dashboard"),
    path("login/", CustomLoginView.as_view(), name="login"),
    path("register/", RegisterUserView.as_view(), name="register"),
    path(
        "auctions/<int:pk>/watchlist/",
        WatchListToggle.as_view(),
        name="watchlist-toggle",
    ),
    path("watchlist/", WatchlistList.as_view(), name="watchlist-list"),
    path("notifications/", NotificationList.as_view(), name="notifications"),
    path(
        "notifications/<int:pk>/read/",
        MarkNotificationRead.as_view(),
        name="notification-read",
    ),
    path("notifications/<int:pk>/delete/", DeleteNotification.as_view()),
    path("notifications/clear-all/", ClearAllNotifications.as_view()),
    path("create-payment-intent/", CreateStripeCheckoutSession.as_view()),
]
