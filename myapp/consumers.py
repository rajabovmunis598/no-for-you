from channels.generic.websocket import AsyncJsonWebsocketConsumer


class ArchiveConsumer(AsyncJsonWebsocketConsumer):
    """Small authenticated signaling channel used by chat, calls, games and alerts."""

    async def connect(self):
        user = self.scope.get('user')
        if not user or not user.is_authenticated:
            await self.close(code=4401)
            return
        self.room = self.scope['url_route']['kwargs'].get('room') or f'user-{user.id}'
        self.group_name = f"archive-{self.scope['url_route']['kwargs'].get('kind', 'notifications')}-{self.room}"
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()
        await self.send_json({'type': 'connected', 'room': self.room})

    async def disconnect(self, close_code):
        if getattr(self, 'group_name', None):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive_json(self, content, **kwargs):
        event_type = content.get('type', 'message')
        if event_type not in {'message', 'typing', 'signal', 'notification', 'game'}:
            await self.send_json({'type': 'error', 'detail': 'Unsupported event type.'})
            return
        await self.channel_layer.group_send(self.group_name, {'type': 'archive.event', 'payload': {**content, 'sender_id': self.scope['user'].id}})

    async def archive_event(self, event):
        await self.send_json(event['payload'])
