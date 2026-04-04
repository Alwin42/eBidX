import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer

logger = logging.getLogger(__name__)

class AuctionConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        try:
            self.auction_id = self.scope["url_route"]["kwargs"]["pk"]
            self.room_group_name = f"auction_{self.auction_id}"
            
            # Join room group
            await self.channel_layer.group_add(
                self.room_group_name, 
                self.channel_name
            )
            await self.accept()
        except KeyError:
            # Handle cases where the URL routing didn't pass a 'pk'
            logger.error("WebSocket connection missing auction 'pk' in URL.")
            await self.close()

    async def disconnect(self, close_code):
        # FIX: Defensive programming. Ensure the group_name exists before discarding.
        # If the socket drops before connect() finishes, this prevents a 500 error.
        if hasattr(self, "room_group_name"):
            await self.channel_layer.group_discard(
                self.room_group_name, 
                self.channel_name
            )

    async def auction_update(self, event):
        # FIX: Used .get() for "message" just in case the event dictionary is missing it
        await self.send(
            text_data=json.dumps({
                "message": event.get("message", ""),
                "current_price": event.get("current_price"),
                "highest_bidder": event.get("highest_bidder"),
            })
        )


class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope.get("user")
        
        # Check authentication
        if not self.user or self.user.is_anonymous:
            await self.close(code=4003) # Standard WebSocket forbidden code
            return # CRITICAL FIX: You must 'return' here to stop execution!

        self.group_name = f"user_{self.user.id}"
        
        await self.channel_layer.group_add(
            self.group_name, 
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, "group_name"):
            await self.channel_layer.group_discard(
                self.group_name, 
                self.channel_name
            )

    async def send_notification(self, event):
        await self.send(
            text_data=json.dumps({
                "type": "notification",
                "message": event.get("message", ""),
                "auction_id": event.get("auction_id"),
                "new_price": event.get("new_price"),
                "link": event.get("link", ""),
            })
        )

    async def dashboard_update(self, event):
        await self.send(
            text_data=json.dumps({
                "type": "dashboard_update",
                "event": event.get("event"),
                "auction_id": event.get("auction_id"),
                "new_price": event.get("new_price"),
            })
        )