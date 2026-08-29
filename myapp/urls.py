from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import (
    AuthorViewSet, BookViewSet, CallViewSet, CategoryViewSet, ChatViewSet, FavoriteViewSet,
    GameViewSet, GroupViewSet, NotificationViewSet, ReadingViewSet, UserViewSet, csrf_status, forgot_password,
    follow_user, login_view, logout_view, profile, profile_dashboard, register, reset_password, search, verify_email, verify_reset_code,
)

router = DefaultRouter()
router.register('books', BookViewSet, basename='book')
router.register('authors', AuthorViewSet, basename='author')
router.register('categories', CategoryViewSet, basename='category')
router.register('favorites', FavoriteViewSet, basename='favorite')
router.register('reading', ReadingViewSet, basename='reading')
router.register('chats', ChatViewSet, basename='chat')
router.register('groups', GroupViewSet, basename='group')
router.register('games', GameViewSet, basename='game')
router.register('notifications', NotificationViewSet, basename='notification')
router.register('calls', CallViewSet, basename='call')
router.register('users', UserViewSet, basename='user')

urlpatterns = [
    path('auth/status/', csrf_status), path('auth/register/', register), path('auth/verify-email/', verify_email),
    path('auth/login/', login_view), path('auth/logout/', logout_view), path('auth/forgot-password/', forgot_password),
    path('auth/verify-reset-code/', verify_reset_code), path('auth/reset-password/', reset_password), path('auth/profile/', profile),
    path('users/profile/', profile), path('users/<int:user_id>/follow/', follow_user), path('profile/dashboard/', profile_dashboard), path('search/', search),
] + router.urls
