from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncJsonWebsocketConsumer


@database_sync_to_async
def user_can_access_room(user_id, kind, room):
    from .models import BookGame, Call, ChatMember, Group, GroupMember

    try:
        room_id = int(room)
    except (TypeError, ValueError):
        return False
    if kind == 'notifications':
        return room_id == user_id
    if kind == 'chat':
        return ChatMember.objects.filter(chat_id=room_id, user_id=user_id).exists()
    if kind == 'group':
        return Group.objects.filter(pk=room_id, owner_id=user_id).exists() or GroupMember.objects.filter(group_id=room_id, user_id=user_id).exists()
    if kind == 'call':
        return Call.objects.filter(pk=room_id).filter(caller_id=user_id).exists() or Call.objects.filter(pk=room_id, receiver_id=user_id).exists()
    if kind == 'game':
        return BookGame.objects.filter(pk=room_id).filter(group__members__user_id=user_id).exists() or BookGame.objects.filter(pk=room_id, group__owner_id=user_id).exists()
    return False


class ArchiveConsumer(AsyncJsonWebsocketConsumer):
    """Small authenticated signaling channel used by chat, calls, games and alerts."""

    async def connect(self):
        user = self.scope.get('user')
        if not user or not user.is_authenticated:
            await self.close(code=4401)
            return
        kind = self.scope['url_route']['kwargs'].get('kind', 'notifications')
        self.room = self.scope['url_route']['kwargs'].get('room') or str(user.id)
        if not await user_can_access_room(user.id, kind, self.room):
            await self.close(code=4403)
            return
        self.group_name = f"archive-{kind}-{self.room}"
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
