from django.urls import re_path
from .consumers import ArchiveConsumer

websocket_urlpatterns = [
    re_path(r'^ws/chat/(?P<room>[^/]+)/$', ArchiveConsumer.as_asgi(), {'kind': 'chat'}),
    re_path(r'^ws/group/(?P<room>[^/]+)/$', ArchiveConsumer.as_asgi(), {'kind': 'group'}),
    re_path(r'^ws/notifications/$', ArchiveConsumer.as_asgi(), {'kind': 'notifications'}),
    re_path(r'^ws/call/(?P<room>[^/]+)/$', ArchiveConsumer.as_asgi(), {'kind': 'call'}),
    re_path(r'^ws/game/(?P<room>[^/]+)/$', ArchiveConsumer.as_asgi(), {'kind': 'game'}),
]
