from django.contrib import admin

from .models import (
    Author, Bookmark, Book, BookFile, BookGame, Call, Category, Chat, ChatMember,
    Favorite, GameParticipant, Group, GroupMember, GroupMessage, Message, Notification,
    PasswordResetCode, Profile, QuizAnswer, QuizQuestion, ReadingHistory, ReadingProgress,
)


@admin.register(Book)
class BookAdmin(admin.ModelAdmin):
    list_display = ('title', 'author', 'genre', 'published_year', 'rating', 'is_available')
    list_filter = ('genre', 'is_available', 'published_year', 'language')
    search_fields = ('title', 'author', 'isbn', 'description')


@admin.register(Category, Author, Profile, Favorite, ReadingProgress, ReadingHistory, Bookmark, Chat, ChatMember, Message, Call, Notification, Group, GroupMember, GroupMessage, BookFile, BookGame, GameParticipant, QuizQuestion, QuizAnswer, PasswordResetCode)
class ArchiveAdmin(admin.ModelAdmin):
    list_per_page = 30
