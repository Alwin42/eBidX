import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async


class AuctionConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.auction_id = self.scope["url_route"]["kwargs"]["pk"]
        self.room_group_name = f"auction_{self.auction_id}"

        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def auction_update(self, event):
        await self.send(
            text_data=json.dumps(
                {
                    "message": event["message"],
                    "current_price": event.get("current_price"),
                    "highest_bidder": event.get("highest_bidder"),
                }
            )
        )


class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope.get("user")

        if not self.user or self.user.is_anonymous:
            await self.close()
        else:
            self.group_name = f"user_{self.user.id}"
            await self.channel_layer.group_add(self.group_name, self.channel_name)
            await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, "group_name"):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def send_notification(self, event):
        await self.send(
            text_data=json.dumps(
                {
                    "type": "notification",
                    "message": event["message"],
                    "auction_id": event.get("auction_id"),
                    "new_price": event.get("new_price"),
                    "link": event.get("link", ""),
                }
            )
        )
