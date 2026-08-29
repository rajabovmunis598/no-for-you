from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers

from .models import (
    Author, Bookmark, Book, BookFile, BookGame, Call, Category, Chat, ChatMember,
    BookComment, BookReview, Favorite, GameParticipant, Group, GroupMember, GroupMessage, Message,
    Notification, Profile, QuizAnswer, QuizQuestion, ReadingHistory, ReadingProgress,
)


class UserSerializer(serializers.ModelSerializer):
    phone = serializers.CharField(source='profile.phone', allow_blank=True, required=False)
    bio = serializers.CharField(source='profile.bio', allow_blank=True, required=False)
    avatar = serializers.FileField(source='profile.avatar', required=False, write_only=True)
    avatar_url = serializers.SerializerMethodField()
    is_verified = serializers.BooleanField(source='profile.is_verified', read_only=True)
    books_read = serializers.SerializerMethodField()
    favorite_count = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'date_joined', 'phone', 'bio', 'avatar', 'avatar_url', 'is_verified', 'books_read', 'favorite_count']
        read_only_fields = ['id', 'date_joined', 'avatar_url', 'is_verified', 'books_read', 'favorite_count']

    def get_avatar_url(self, obj):
        avatar = getattr(getattr(obj, 'profile', None), 'avatar', None)
        if not avatar:
            return None
        request = self.context.get('request')
        return request.build_absolute_uri(avatar.url) if request else avatar.url

    def get_books_read(self, obj):
        return obj.reading_progress.filter(progress_percent=100).count()

    def get_favorite_count(self, obj):
        return obj.favorites.count()

    def validate_email(self, value):
        queryset = User.objects.filter(email__iexact=value.strip())
        if self.instance:
            queryset = queryset.exclude(pk=self.instance.pk)
        if queryset.exists():
            raise serializers.ValidationError('This email is already in use.')
        return value.strip().lower()

    def validate_username(self, value):
        value = value.strip()
        queryset = User.objects.filter(username__iexact=value)
        if self.instance:
            queryset = queryset.exclude(pk=self.instance.pk)
        if queryset.exists():
            raise serializers.ValidationError('This username is already in use.')
        return value

    def validate_phone(self, value):
        phone = value.strip() or None
        queryset = Profile.objects.filter(phone=phone) if phone else Profile.objects.none()
        if self.instance:
            queryset = queryset.exclude(user=self.instance)
        if queryset.exists():
            raise serializers.ValidationError('This phone number is already in use.')
        return phone

    def update(self, instance, validated_data):
        profile_data = validated_data.pop('profile', {})
        for field, value in validated_data.items():
            setattr(instance, field, value)
        instance.save()
        profile, _ = Profile.objects.get_or_create(user=instance)
        for field, value in profile_data.items():
            setattr(profile, field, value)
        profile.save()
        return instance


class RegistrationSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True, min_length=8, required=False)
    first_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    last_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    phone = serializers.CharField(max_length=32)

    def validate(self, attrs):
        if attrs.get('confirm_password') and attrs['password'] != attrs['confirm_password']:
            raise serializers.ValidationError({'confirm_password': 'Passwords do not match.'})
        attrs['username'] = attrs['username'].strip()
        attrs['email'] = attrs['email'].strip().lower()
        if not attrs['username']:
            raise serializers.ValidationError({'username': 'Username is required.'})
        if User.objects.filter(username__iexact=attrs['username']).exists():
            raise serializers.ValidationError({'username': 'This username is already in use.'})
        if User.objects.filter(email__iexact=attrs['email']).exists():
            raise serializers.ValidationError({'email': 'This email is already in use.'})
        attrs['phone'] = attrs['phone'].strip()
        if not attrs['phone']:
            raise serializers.ValidationError({'phone': 'Phone number is required.'})
        if Profile.objects.filter(phone=attrs['phone']).exists():
            raise serializers.ValidationError({'phone': 'This phone number is already in use.'})
        password_user = User(
            username=attrs['username'],
            email=attrs['email'],
            first_name=attrs.get('first_name', ''),
            last_name=attrs.get('last_name', ''),
        )
        try:
            validate_password(attrs['password'], user=password_user)
        except DjangoValidationError as exc:
            raise serializers.ValidationError({'password': list(exc.messages)}) from exc
        attrs.pop('confirm_password', None)
        return attrs

    def create(self, validated_data):
        phone = validated_data.pop('phone')
        user = User.objects.create_user(**validated_data)
        Profile.objects.create(user=user, phone=phone)
        return user


class PublicUserSerializer(serializers.ModelSerializer):
    avatar_url = serializers.SerializerMethodField()
    is_online = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'avatar_url', 'is_online']

    def get_avatar_url(self, obj):
        avatar = getattr(getattr(obj, 'profile', None), 'avatar', None)
        if not avatar:
            return None
        request = self.context.get('request')
        return request.build_absolute_uri(avatar.url) if request else avatar.url

    def get_is_online(self, obj):
        return obj.chat_memberships.filter(is_online=True).exists()


class AuthorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Author
        fields = '__all__'


class CategorySerializer(serializers.ModelSerializer):
    book_count = serializers.IntegerField(source='books.count', read_only=True)

    class Meta:
        model = Category
        fields = ['id', 'name', 'description', 'book_count']


class BookFileSerializer(serializers.ModelSerializer):
    class Meta:
        model = BookFile
        fields = '__all__'
        read_only_fields = ['book']


class BookSerializer(serializers.ModelSerializer):
    cover_url = serializers.SerializerMethodField()
    author_name = serializers.CharField(source='author_record.name', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    files = BookFileSerializer(many=True, read_only=True)
    is_favorite = serializers.SerializerMethodField()
    created_by = PublicUserSerializer(read_only=True)

    class Meta:
        model = Book
        fields = ['id', 'title', 'author', 'author_record', 'author_name', 'description', 'genre', 'category', 'category_name', 'publication_year', 'published_year', 'language', 'pages', 'isbn', 'publisher', 'rating', 'cover', 'cover_url', 'book_file', 'audio_book', 'files', 'is_available', 'created_at', 'is_favorite', 'created_by']
        read_only_fields = ['id', 'cover_url', 'created_at', 'is_favorite', 'created_by']

    def get_cover_url(self, obj):
        if not obj.cover:
            return None
        request = self.context.get('request')
        return request.build_absolute_uri(obj.cover.url) if request else obj.cover.url

    def validate(self, attrs):
        if self.instance is None:
            if not attrs.get('isbn'):
                attrs['isbn'] = None
            missing = [field for field in ('cover', 'book_file') if not attrs.get(field)]
            if missing:
                raise serializers.ValidationError({field: 'This field is required when submitting a new book.' for field in missing})
        return attrs

    def validate_book_file(self, value):
        filename = value.name.lower()
        if not filename.endswith(('.pdf', '.epub')):
            raise serializers.ValidationError('Book file must be a PDF or EPUB file.')
        return value

    def validate_isbn(self, value):
        return value.strip() or None

    def get_is_favorite(self, obj):
        user = self.context.get('request').user if self.context.get('request') else None
        return bool(user and user.is_authenticated and obj.favorited_by.filter(user=user).exists())


class BookReviewSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = BookReview
        fields = ['id', 'book', 'user', 'rating', 'text', 'created_at', 'updated_at']
        read_only_fields = ['id', 'book', 'user', 'created_at', 'updated_at']


class BookCommentSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = BookComment
        fields = ['id', 'book', 'user', 'text', 'created_at', 'updated_at']
        read_only_fields = ['id', 'book', 'user', 'created_at', 'updated_at']


class FavoriteSerializer(serializers.ModelSerializer):
    book = BookSerializer(read_only=True)
    book_id = serializers.PrimaryKeyRelatedField(source='book', queryset=Book.objects.all(), write_only=True)

    class Meta:
        model = Favorite
        fields = ['id', 'book', 'book_id', 'created_at']
        read_only_fields = ['id', 'created_at']


class ReadingProgressSerializer(serializers.ModelSerializer):
    book = BookSerializer(read_only=True)
    book_id = serializers.PrimaryKeyRelatedField(source='book', queryset=Book.objects.all(), write_only=True)

    class Meta:
        model = ReadingProgress
        fields = ['id', 'book', 'book_id', 'current_page', 'progress_percent', 'last_read_at']
        read_only_fields = ['id', 'last_read_at']

    def validate(self, attrs):
        book = attrs.get('book') or getattr(self.instance, 'book', None)
        current_page = attrs.get('current_page', getattr(self.instance, 'current_page', 0))
        if book and book.pages and current_page > book.pages:
            raise serializers.ValidationError({'current_page': 'Current page exceeds the number of pages in this book.'})
        return attrs


class ReadingHistorySerializer(serializers.ModelSerializer):
    book = BookSerializer(read_only=True)

    class Meta:
        model = ReadingHistory
        fields = ['id', 'book', 'progress_percent', 'last_read_at']


class BookmarkSerializer(serializers.ModelSerializer):
    class Meta:
        model = Bookmark
        fields = ['id', 'book', 'page_number', 'note', 'created_at']
        read_only_fields = ['id', 'created_at']


class ChatMemberSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    class Meta:
        model = ChatMember
        fields = ['id', 'user', 'joined_at', 'is_online']


class MessageSerializer(serializers.ModelSerializer):
    sender = UserSerializer(read_only=True)
    class Meta:
        model = Message
        fields = ['id', 'chat', 'sender', 'text', 'file', 'voice', 'reply_to', 'is_read', 'is_deleted', 'edited_at', 'created_at']
        read_only_fields = ['id', 'chat', 'sender', 'is_read', 'is_deleted', 'edited_at', 'created_at']

    def validate(self, attrs):
        if not attrs.get('text', '').strip() and not attrs.get('file') and not attrs.get('voice'):
            raise serializers.ValidationError('A message must contain text, a file, or a voice recording.')
        return attrs


class ChatSerializer(serializers.ModelSerializer):
    members = ChatMemberSerializer(many=True, read_only=True)
    last_message = serializers.SerializerMethodField()
    class Meta:
        model = Chat
        fields = ['id', 'type', 'members', 'last_message', 'created_at']
        read_only_fields = ['id', 'created_at']
    def get_last_message(self, obj):
        message = obj.messages.order_by('-created_at').first()
        return MessageSerializer(message, context=self.context).data if message else None


class GroupMemberSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    class Meta:
        model = GroupMember
        fields = ['id', 'user', 'role', 'joined_at']
        read_only_fields = ['id', 'user', 'joined_at']


class GroupMessageSerializer(serializers.ModelSerializer):
    sender = UserSerializer(read_only=True)
    class Meta:
        model = GroupMessage
        fields = '__all__'
        read_only_fields = ['sender', 'group']

    def validate(self, attrs):
        if not attrs.get('text', '').strip() and not attrs.get('file') and not attrs.get('voice'):
            raise serializers.ValidationError('A message must contain text, a file, or a voice recording.')
        return attrs


class GroupSerializer(serializers.ModelSerializer):
    owner = UserSerializer(read_only=True)
    members = GroupMemberSerializer(many=True, read_only=True)
    member_count = serializers.IntegerField(source='members.count', read_only=True)
    class Meta:
        model = Group
        fields = ['id', 'name', 'description', 'avatar', 'owner', 'members', 'member_count', 'created_at']
        read_only_fields = ['id', 'owner', 'created_at']


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'notification_type', 'title', 'text', 'data', 'is_read', 'created_at']
        read_only_fields = ['id', 'created_at']


class CallSerializer(serializers.ModelSerializer):
    caller = PublicUserSerializer(read_only=True)
    receiver = PublicUserSerializer(read_only=True)
    receiver_id = serializers.PrimaryKeyRelatedField(
        source='receiver', queryset=User.objects.filter(is_active=True), write_only=True,
    )
    class Meta:
        model = Call
        fields = ['id', 'caller', 'receiver', 'receiver_id', 'call_type', 'status', 'started_at', 'ended_at', 'created_at']
        read_only_fields = ['id', 'caller', 'receiver', 'status', 'started_at', 'ended_at', 'created_at']

    def validate_receiver_id(self, value):
        request = self.context.get('request')
        if request and value == request.user:
            raise serializers.ValidationError('You cannot call yourself.')
        return value


class QuizQuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuizQuestion
        fields = ['id', 'question', 'option_a', 'option_b', 'option_c', 'option_d', 'difficulty', 'order']


class GameParticipantSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    class Meta:
        model = GameParticipant
        fields = '__all__'
        read_only_fields = ['user']


class BookGameSerializer(serializers.ModelSerializer):
    book = BookSerializer(read_only=True)
    participants = GameParticipantSerializer(many=True, read_only=True)
    class Meta:
        model = BookGame
        fields = ['id', 'group', 'book', 'started_by', 'status', 'started_at', 'finished_at', 'created_at', 'participants']
        read_only_fields = ['started_by', 'started_at', 'finished_at', 'created_at']
