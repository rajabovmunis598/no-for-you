from datetime import timedelta
import secrets
import random

try:
    import fitz
except ImportError:  # Optional locally; production installs PyMuPDF from requirements.
    fitz = None
from django.conf import settings
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError as DjangoValidationError
from django.core.mail import send_mail
from django.db import IntegrityError, transaction
from django.db.models import Q
from django.middleware.csrf import get_token
from django.shortcuts import get_object_or_404
from django.http import HttpResponse, JsonResponse
from django.utils import timezone
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action, api_view, parser_classes, permission_classes
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import AllowAny, IsAdminUser, IsAuthenticated
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework_simplejwt.tokens import RefreshToken

from .models import (
    Author, Bookmark, Book, BookComment, BookGame, BookReview, Call, Category, Chat, ChatMember, EmailVerificationCode,
    Favorite, GameParticipant, Group, GroupMember, GroupMessage, Message, Notification,
    PasswordResetCode, Profile, QuizAnswer, QuizQuestion, ReadingHistory, ReadingProgress,
    UserFollow,
)
from .serializers import (
    AuthorSerializer, BookmarkSerializer, BookCommentSerializer, BookGameSerializer, BookReviewSerializer, BookSerializer, CallSerializer,
    CategorySerializer, ChatSerializer, FavoriteSerializer, GroupMemberSerializer, GroupMessageSerializer,
    GroupSerializer, MessageSerializer, NotificationSerializer, ReadingHistorySerializer,
    PublicUserSerializer, ReadingProgressSerializer, RegistrationSerializer, UserSerializer,
)
from .ai_quiz import AIQuizUnavailable, generate_quiz_copy


def tokens_for(user):
    refresh = RefreshToken.for_user(user)
    return {'access': str(refresh.access_token), 'refresh': str(refresh)}


def send_code(user, model, subject, body):
    code = f'{secrets.randbelow(1_000_000):06d}'
    model.objects.filter(user=user).delete()
    model.objects.create(user=user, code=code, expires_at=timezone.now() + timedelta(minutes=10))
    send_mail(subject, body.format(code=code), None, [user.email], fail_silently=False)


def csrf_failure(request, reason=''):
    """Return JSON for API CSRF failures so clients never try to parse HTML."""
    return JsonResponse({'detail': 'CSRF verification failed. Refresh the page and try again.'}, status=403)


class BookViewSet(viewsets.ModelViewSet):
    serializer_class = BookSerializer
    search_fields = ['title', 'author', 'author_record__name', 'description', 'genre', 'isbn', 'publication_year', 'published_year']
    ordering_fields = ['title', 'author', 'published_year', 'publication_year', 'rating', 'created_at']

    def get_permissions(self):
        public_actions = ('list', 'retrieve', 'similar', 'page_image')
        public_read = self.action in ('reviews', 'comments') and self.request.method == 'GET'
        return [AllowAny()] if self.action in public_actions or public_read else [IsAuthenticated()]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def _assert_owner(self, book):
        if not self.request.user.is_staff and book.created_by_id != self.request.user.id:
            raise PermissionDenied('You can edit or delete only the books you submitted.')

    def perform_update(self, serializer):
        self._assert_owner(self.get_object())
        serializer.save()

    def perform_destroy(self, instance):
        self._assert_owner(instance)
        instance.delete()

    def get_queryset(self):
        qs = Book.objects.select_related('author_record', 'category', 'created_by', 'created_by__profile').all()
        params = self.request.query_params
        for field in ('genre', 'author', 'published_year', 'publication_year', 'language'):
            if params.get(field):
                qs = qs.filter(**{field: params[field]})
        if params.get('category'):
            qs = qs.filter(Q(category__name__iexact=params['category']) | Q(genre__iexact=params['category']))
        if params.get('is_available') in ('true', 'false'):
            qs = qs.filter(is_available=params['is_available'] == 'true')
        return qs

    @action(detail=True, methods=['get'])
    def similar(self, request, pk=None):
        book = self.get_object()
        related = Q(genre__iexact=book.genre)
        if book.category_id:
            related |= Q(category_id=book.category_id)
        qs = Book.objects.exclude(pk=book.pk).filter(related).order_by('-rating', '-created_at')[:8]
        return Response(BookSerializer(qs, many=True, context={'request': request}).data)

    @action(detail=True, methods=['get'], url_path='page')
    def page_image(self, request, pk=None):
        """Render one PDF page on the server; browsers receive only a PNG."""
        book = self.get_object()
        extra = book.files.order_by('id').first()
        source = book.book_file or (extra.file if extra else None)
        if not source:
            return Response({'detail': 'PDF file is missing.'}, status=status.HTTP_404_NOT_FOUND)
        if not source.name.lower().endswith('.pdf'):
            return Response({'detail': 'Page preview is available only for PDF files.'}, status=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE)
        if fitz is None:
            return Response({'detail': 'Server PDF rendering is not installed.'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        try:
            page_number = max(1, int(request.query_params.get('page', '1')))
            scale = min(2.0, max(0.7, float(request.query_params.get('scale', '1.25'))))
        except (TypeError, ValueError):
            return Response({'detail': 'Invalid page or scale.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            source.open('rb')
            with fitz.open(stream=source.read(), filetype='pdf') as document:
                if page_number > document.page_count:
                    return Response({'detail': 'Page is out of range.'}, status=status.HTTP_404_NOT_FOUND)
                pixmap = document.load_page(page_number - 1).get_pixmap(matrix=fitz.Matrix(scale, scale), alpha=False)
                payload = pixmap.tobytes('png')
                total_pages = document.page_count
        except Exception:
            return Response({'detail': 'Could not render this PDF.'}, status=status.HTTP_422_UNPROCESSABLE_ENTITY)
        finally:
            source.close()
        response = HttpResponse(payload, content_type='image/png')
        response['X-PDF-Page-Count'] = str(total_pages)
        response['Cache-Control'] = 'public, max-age=3600'
        return response

    @action(detail=True, methods=['post', 'delete'], permission_classes=[IsAuthenticated])
    def favorite(self, request, pk=None):
        book = self.get_object()
        if request.method == 'DELETE':
            Favorite.objects.filter(user=request.user, book=book).delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        favorite, created = Favorite.objects.get_or_create(user=request.user, book=book)
        return Response(FavoriteSerializer(favorite, context={'request': request}).data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)

    @action(detail=True, methods=['get', 'post'], permission_classes=[IsAuthenticated])
    def reviews(self, request, pk=None):
        book = self.get_object()
        if request.method == 'GET':
            return Response(BookReviewSerializer(book.reviews.select_related('user', 'user__profile'), many=True, context={'request': request}).data)
        serializer = BookReviewSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        review, _ = BookReview.objects.update_or_create(book=book, user=request.user, defaults=serializer.validated_data)
        return Response(BookReviewSerializer(review, context={'request': request}).data)

    @action(detail=True, methods=['get', 'post'], permission_classes=[IsAuthenticated])
    def comments(self, request, pk=None):
        book = self.get_object()
        if request.method == 'GET':
            return Response(BookCommentSerializer(book.comments.select_related('user', 'user__profile'), many=True, context={'request': request}).data)
        serializer = BookCommentSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        comment = serializer.save(book=book, user=request.user)
        return Response(BookCommentSerializer(comment, context={'request': request}).data, status=status.HTTP_201_CREATED)


class AuthorViewSet(viewsets.ModelViewSet):
    queryset = Author.objects.all()
    serializer_class = AuthorSerializer
    def get_permissions(self): return [AllowAny()] if self.action in ('list', 'retrieve') else [IsAdminUser()]


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    def get_permissions(self): return [AllowAny()] if self.action in ('list', 'retrieve', 'books') else [IsAdminUser()]
    @action(detail=True, methods=['get'])
    def books(self, request, pk=None):
        category = self.get_object()
        return Response(BookSerializer(category.books.all(), many=True, context={'request': request}).data)


class FavoriteViewSet(mixins.ListModelMixin, mixins.CreateModelMixin, mixins.DestroyModelMixin, viewsets.GenericViewSet):
    serializer_class = FavoriteSerializer
    permission_classes = [IsAuthenticated]
    def get_queryset(self): return Favorite.objects.filter(user=self.request.user).select_related('book')
    def perform_create(self, serializer): serializer.save(user=self.request.user)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        favorite, created = Favorite.objects.get_or_create(user=request.user, book=serializer.validated_data['book'])
        payload = self.get_serializer(favorite).data
        return Response(payload, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)


class ReadingViewSet(viewsets.GenericViewSet):
    serializer_class = ReadingProgressSerializer
    permission_classes = [IsAuthenticated]
    @action(detail=False, methods=['get', 'post', 'patch'], url_path='progress')
    def progress(self, request):
        if request.method == 'GET':
            return Response(ReadingProgressSerializer(ReadingProgress.objects.filter(user=request.user).select_related('book'), many=True, context={'request': request}).data)
        book_id = request.data.get('book') or request.data.get('book_id')
        book = get_object_or_404(Book, pk=book_id)
        progress, _ = ReadingProgress.objects.get_or_create(user=request.user, book=book)
        payload = {
            field: request.data[field]
            for field in ('current_page', 'progress_percent')
            if field in request.data
        }
        serializer = ReadingProgressSerializer(progress, data=payload, partial=True, context={'request': request})
        serializer.is_valid(raise_exception=True)
        progress = serializer.save()
        ReadingHistory.objects.update_or_create(user=request.user, book=book, defaults={'progress_percent': progress.progress_percent, 'last_read_at': timezone.now()})
        return Response(ReadingProgressSerializer(progress, context={'request': request}).data)

    @action(detail=False, methods=['get'])
    def history(self, request):
        qs = ReadingHistory.objects.filter(user=request.user).select_related('book').order_by('-last_read_at')
        return Response(ReadingHistorySerializer(qs, many=True, context={'request': request}).data)

    @action(detail=False, methods=['get', 'post', 'delete'], url_path='bookmarks')
    def bookmarks(self, request):
        if request.method == 'GET':
            return Response(BookmarkSerializer(Bookmark.objects.filter(user=request.user), many=True).data)
        if request.method == 'DELETE':
            bookmark_id = request.data.get('id')
            if not bookmark_id:
                raise ValidationError({'id': 'Bookmark id is required.'})
            Bookmark.objects.filter(user=request.user, pk=bookmark_id).delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        serializer = BookmarkSerializer(data=request.data); serializer.is_valid(raise_exception=True); serializer.save(user=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class ChatViewSet(viewsets.ModelViewSet):
    serializer_class = ChatSerializer
    permission_classes = [IsAuthenticated]
    def get_queryset(self): return Chat.objects.filter(members__user=self.request.user).distinct()
    def perform_create(self, serializer):
        member_ids = self.request.data.get('member_ids', [])
        if not isinstance(member_ids, list):
            raise ValidationError({'member_ids': 'Expected a list of user ids.'})
        member_ids = {str(user_id) for user_id in member_ids if str(user_id) != str(self.request.user.id)}
        members = list(User.objects.filter(pk__in=member_ids, is_active=True))
        if len(members) != len(member_ids):
            raise ValidationError({'member_ids': 'One or more users do not exist.'})
        if self.request.data.get('type', Chat.ChatType.PRIVATE) == Chat.ChatType.PRIVATE and len(members) > 1:
            raise ValidationError({'member_ids': 'A private chat can contain only two users.'})
        with transaction.atomic():
            chat = serializer.save()
            ChatMember.objects.create(chat=chat, user=self.request.user)
            ChatMember.objects.bulk_create([ChatMember(chat=chat, user=user) for user in members])

    @action(detail=True, methods=['get', 'post'], url_path='messages')
    def messages(self, request, pk=None):
        chat = self.get_object()
        if request.method == 'GET':
            return Response(MessageSerializer(chat.messages.filter(is_deleted=False), many=True, context={'request': request}).data)
        serializer = MessageSerializer(data=request.data); serializer.is_valid(raise_exception=True); serializer.save(chat=chat, sender=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class UserViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = PublicUserSerializer
    permission_classes = [IsAuthenticated]
    search_fields = ['username', 'first_name', 'last_name']

    def get_queryset(self):
        return User.objects.exclude(pk=self.request.user.pk).filter(is_active=True).select_related('profile').order_by('first_name', 'username')

    @action(detail=True, methods=['post'])
    def chat(self, request, pk=None):
        target = self.get_object()
        candidates = Chat.objects.filter(type=Chat.ChatType.PRIVATE, members__user=request.user).filter(members__user=target).distinct()
        chat = next((item for item in candidates if item.members.count() == 2), None)
        if not chat:
            chat = Chat.objects.create(type=Chat.ChatType.PRIVATE)
            ChatMember.objects.bulk_create([ChatMember(chat=chat, user=request.user), ChatMember(chat=chat, user=target)])
        return Response(ChatSerializer(chat, context={'request': request}).data)


class GroupViewSet(viewsets.ModelViewSet):
    serializer_class = GroupSerializer
    permission_classes = [IsAuthenticated]
    def get_queryset(self): return Group.objects.filter(Q(owner=self.request.user) | Q(members__user=self.request.user)).distinct()
    def perform_create(self, serializer):
        group = serializer.save(owner=self.request.user)
        GroupMember.objects.get_or_create(group=group, user=self.request.user, defaults={'role': GroupMember.Role.ADMIN})

    def is_admin(self, group): return group.owner_id == self.request.user.id or group.members.filter(user=self.request.user, role=GroupMember.Role.ADMIN).exists()

    def perform_update(self, serializer):
        if not self.is_admin(self.get_object()):
            raise PermissionDenied('Group admin permission required.')
        serializer.save()

    def perform_destroy(self, instance):
        if not self.is_admin(instance):
            raise PermissionDenied('Group admin permission required.')
        instance.delete()

    @action(detail=True, methods=['get', 'post', 'delete'], url_path='members')
    def members(self, request, pk=None):
        group = self.get_object()
        if request.method == 'GET': return Response(GroupMemberSerializer(group.members.all(), many=True, context={'request': request}).data)
        if not self.is_admin(group): return Response({'detail': 'Group admin permission required.'}, status=status.HTTP_403_FORBIDDEN)
        user_id = request.data.get('user_id')
        user = get_object_or_404(User, pk=user_id, is_active=True)
        if request.method == 'DELETE':
            if user.id == group.owner_id:
                return Response({'detail': 'The group owner cannot be removed.'}, status=status.HTTP_400_BAD_REQUEST)
            GroupMember.objects.filter(group=group, user=user).delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        member, _ = GroupMember.objects.get_or_create(group=group, user=user)
        return Response(GroupMemberSerializer(member, context={'request': request}).data)

    @action(detail=True, methods=['get', 'post'], url_path='messages')
    def messages(self, request, pk=None):
        group = self.get_object()
        if group.owner_id != request.user.id and not group.members.filter(user=request.user).exists(): return Response({'detail': 'Join the group first.'}, status=status.HTTP_403_FORBIDDEN)
        if request.method == 'GET': return Response(GroupMessageSerializer(group.messages.all(), many=True, context={'request': request}).data)
        serializer = GroupMessageSerializer(data=request.data); serializer.is_valid(raise_exception=True); serializer.save(group=group, sender=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    def get_queryset(self): return Notification.objects.filter(user=self.request.user).order_by('-created_at')
    def perform_create(self, serializer): serializer.save(user=self.request.user)
    @action(detail=False, methods=['post'])
    def read_all(self, request): Notification.objects.filter(user=request.user, is_read=False).update(is_read=True); return Response({'detail': 'Notifications marked as read.'})


class CallViewSet(viewsets.ModelViewSet):
    serializer_class = CallSerializer
    permission_classes = [IsAuthenticated]
    def get_queryset(self): return Call.objects.filter(Q(caller=self.request.user) | Q(receiver=self.request.user))
    def perform_create(self, serializer): serializer.save(caller=self.request.user)
    @action(detail=True, methods=['post'])
    def accept(self, request, pk=None):
        call = self.get_object()
        if call.receiver_id != request.user.id:
            raise PermissionDenied('Only the receiver can accept this call.')
        if call.status != Call.Status.RINGING:
            raise ValidationError({'detail': 'Only a ringing call can be accepted.'})
        call.status = Call.Status.ACCEPTED; call.started_at = timezone.now(); call.save(update_fields=['status', 'started_at']); return Response(CallSerializer(call, context={'request': request}).data)
    @action(detail=True, methods=['post'])
    def end(self, request, pk=None):
        call = self.get_object()
        if call.status not in (Call.Status.RINGING, Call.Status.ACCEPTED):
            raise ValidationError({'detail': 'This call has already ended.'})
        call.status = Call.Status.ENDED; call.ended_at = timezone.now(); call.save(update_fields=['status', 'ended_at']); return Response(CallSerializer(call, context={'request': request}).data)


class GameViewSet(viewsets.ModelViewSet):
    serializer_class = BookGameSerializer
    permission_classes = [IsAuthenticated]
    def get_queryset(self): return BookGame.objects.filter(group__members__user=self.request.user).distinct()
    def create(self, request, *args, **kwargs):
        group = get_object_or_404(Group, pk=request.data.get('group'))
        if not (group.owner_id == request.user.id or group.members.filter(user=request.user, role=GroupMember.Role.ADMIN).exists()): return Response({'detail': 'Group admin permission required.'}, status=status.HTTP_403_FORBIDDEN)
        book = get_object_or_404(Book, pk=request.data.get('book'))
        game = BookGame.objects.create(group=group, book=book, started_by=request.user)
        return Response(self.get_serializer(game, context={'request': request}).data, status=status.HTTP_201_CREATED)
    @action(detail=True, methods=['post'])
    def start(self, request, pk=None):
        game = self.get_object()
        if game.started_by_id != request.user.id and game.group.owner_id != request.user.id and not game.group.members.filter(user=request.user, role=GroupMember.Role.ADMIN).exists():
            raise PermissionDenied('Group admin permission required.')
        if game.status != BookGame.Status.WAITING:
            raise ValidationError({'detail': 'Only a waiting game can be started.'})
        game.status = BookGame.Status.ACTIVE; game.started_at = timezone.now(); game.save(update_fields=['status', 'started_at'])
        GameParticipant.objects.get_or_create(game=game, user=request.user)
        return Response(self.get_serializer(game, context={'request': request}).data)
    @action(detail=True, methods=['get'])
    def questions(self, request, pk=None):
        game = self.get_object(); return Response([{'id': q.id, 'question': q.question, 'options': {'A': q.option_a, 'B': q.option_b, 'C': q.option_c, 'D': q.option_d}, 'difficulty': q.difficulty, 'order': q.order} for q in game.questions.all().order_by('order')])
    @action(detail=True, methods=['post'])
    def answer(self, request, pk=None):
        game = self.get_object()
        if game.status != BookGame.Status.ACTIVE:
            raise ValidationError({'detail': 'The game is not active.'})
        selected = str(request.data.get('selected_option', '')).upper()
        if selected not in {'A', 'B', 'C', 'D'}:
            raise ValidationError({'selected_option': 'Select A, B, C, or D.'})
        participant, _ = GameParticipant.objects.get_or_create(game=game, user=request.user); question = get_object_or_404(QuizQuestion, game=game, pk=request.data.get('question_id')); answer, _ = QuizAnswer.objects.update_or_create(question=question, participant=participant, defaults={'selected_option': selected, 'is_correct': selected == question.correct_option}); participant.correct_answers = participant.answers.filter(is_correct=True).count(); participant.score = participant.correct_answers; participant.save(update_fields=['correct_answers', 'score']); return Response({'correct': answer.is_correct, 'score': participant.score})
    @action(detail=True, methods=['get'])
    def result(self, request, pk=None):
        game = self.get_object(); return Response(GameParticipantSerializer(game.participants.order_by('-score', 'time_seconds'), many=True, context={'request': request}).data)

    @action(detail=False, methods=['get'])
    def quick(self, request):
        books = list(
            Book.objects.exclude(cover='').exclude(cover__isnull=True).values(
                'id', 'title', 'author', 'genre', 'publication_year', 'published_year', 'cover',
            )
        )
        unique_books = []
        seen_titles = set()
        for book in books:
            title_key = book['title'].strip().casefold()
            if title_key and title_key not in seen_titles:
                seen_titles.add(title_key)
                unique_books.append(book)
        if len(unique_books) < 4:
            return Response({'detail': 'At least four books with covers are required for the quiz.'}, status=status.HTTP_400_BAD_REQUEST)

        targets = random.sample(unique_books, min(7, len(unique_books)))
        language = request.query_params.get('language', 'tj').lower()
        if language not in ('tj', 'ru', 'en'):
            language = 'tj'
        ai_copy = {}
        source = 'fallback'
        if settings.GEMINI_API_KEY:
            try:
                ai_copy = generate_quiz_copy(targets, language)
                source = 'ai'
            except AIQuizUnavailable:
                # A deterministic round keeps the game usable during quota/network errors.
                ai_copy = {}

        fallback_prompts = {
            'tj': 'Ин муқова ба кадом китоб тааллуқ дорад?',
            'ru': 'Какой книге принадлежит эта обложка?',
            'en': 'Which book does this cover belong to?',
        }
        fallback_explanations = {
            'tj': 'Ҷавоби дуруст: {title}.',
            'ru': 'Правильный ответ: {title}.',
            'en': 'The correct answer is {title}.',
        }
        questions = []
        for index, target in enumerate(targets, start=1):
            distractors = random.sample([book for book in unique_books if book['id'] != target['id']], 3)
            options = [target['title'], *[book['title'] for book in distractors]]
            random.shuffle(options)
            cover_url = request.build_absolute_uri(settings.MEDIA_URL + target['cover'])
            generated = ai_copy.get(target['id'], {})
            questions.append({
                'id': index,
                'book_id': target['id'],
                'prompt': generated.get('prompt', fallback_prompts[language]),
                'cover_url': cover_url,
                'options': options,
                'answer': target['title'],
                'emoji': generated.get('emoji', '📚'),
                'explanation': generated.get(
                    'explanation',
                    fallback_explanations[language].format(title=target['title']),
                ),
            })
        return Response({
            'questions': questions,
            'total': len(questions),
            'source': source,
            'ai_enabled': bool(settings.GEMINI_API_KEY),
        })


@api_view(['GET'])
@permission_classes([AllowAny])
def csrf_status(request): get_token(request); return Response({'authenticated': request.user.is_authenticated})


@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    serializer = RegistrationSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    try:
        with transaction.atomic():
            user = serializer.save()
    except IntegrityError as exc:
        raise ValidationError({'detail': 'Username, email, or phone is already in use.'}) from exc
    if not settings.REQUIRE_EMAIL_VERIFICATION:
        profile, _ = Profile.objects.get_or_create(user=user)
        profile.is_verified = True
        profile.save(update_fields=['is_verified'])
        login(request, user)
        return Response({
            'verification_required': False,
            **UserSerializer(user, context={'request': request}).data,
            **tokens_for(user),
        }, status=status.HTTP_201_CREATED)
    try:
        send_code(user, EmailVerificationCode, 'Digital Archive - email verification', 'Your verification code is: {code}\nThis code expires in 10 minutes.')
    except Exception:
        user.delete()
        return Response({'detail': 'Email could not be sent. Please try again later.'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
    return Response({'verification_required': True, 'email': user.email}, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([AllowAny])
def verify_email(request):
    email = str(request.data.get('email') or '').strip()
    code = str(request.data.get('code') or '').strip()
    user = User.objects.filter(email__iexact=email).first(); verification = EmailVerificationCode.objects.filter(user=user, code=code).first() if user else None
    if not verification or not verification.is_valid: return Response({'detail': 'Invalid or expired verification code.'}, status=status.HTTP_400_BAD_REQUEST)
    profile, _ = Profile.objects.get_or_create(user=user); profile.is_verified = True; profile.save(); EmailVerificationCode.objects.filter(user=user).delete(); login(request, user)
    return Response({**UserSerializer(user, context={'request': request}).data, **tokens_for(user)})


@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    identity = str(request.data.get('username') or request.data.get('email') or '').strip(); user = authenticate(request, username=identity, password=request.data.get('password', ''))
    if not user and '@' in identity:
        found = User.objects.filter(email__iexact=identity).first(); user = authenticate(request, username=found.username, password=request.data.get('password', '')) if found else None
    if not user: return Response({'detail': 'Login or password is incorrect.'}, status=status.HTTP_400_BAD_REQUEST)
    profile, _ = Profile.objects.get_or_create(user=user)
    has_pending_verification = EmailVerificationCode.objects.filter(user=user).exists()
    if settings.REQUIRE_EMAIL_VERIFICATION and has_pending_verification and not profile.is_verified:
        return Response({'detail': 'Verify your email before signing in.', 'verification_required': True, 'email': user.email}, status=status.HTTP_403_FORBIDDEN)
    if not settings.REQUIRE_EMAIL_VERIFICATION and not profile.is_verified:
        profile.is_verified = True
        profile.save(update_fields=['is_verified'])
    login(request, user); return Response({**UserSerializer(user, context={'request': request}).data, **tokens_for(user)})


@api_view(['POST'])
@permission_classes([AllowAny])
def forgot_password(request):
    user = User.objects.filter(email__iexact=str(request.data.get('email') or '').strip(), is_active=True).first()
    if user:
        try: send_code(user, PasswordResetCode, 'Digital Archive - password reset', 'Your password reset code is: {code}\nThis code expires in 10 minutes.')
        except Exception: return Response({'detail': 'Email could not be sent.'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
    return Response({'detail': 'If this email exists, a reset code was sent.'})


@api_view(['POST'])
@permission_classes([AllowAny])
def verify_reset_code(request):
    email = str(request.data.get('email') or '').strip()
    code = str(request.data.get('code') or '').strip()
    user = User.objects.filter(email__iexact=email).first(); reset = PasswordResetCode.objects.filter(user=user, code=code).first() if user else None
    if not reset or not reset.is_valid: return Response({'detail': 'Invalid or expired reset code.'}, status=status.HTTP_400_BAD_REQUEST)
    return Response({'valid': True})


@api_view(['POST'])
@permission_classes([AllowAny])
def reset_password(request):
    email = str(request.data.get('email') or '').strip()
    code = str(request.data.get('code') or '').strip()
    password = str(request.data.get('new_password') or '')
    confirm = str(request.data.get('confirm_password', password) or '')
    user = User.objects.filter(email__iexact=email).first(); reset = PasswordResetCode.objects.filter(user=user, code=code).first() if user else None
    if not reset or not reset.is_valid: return Response({'detail': 'Invalid or expired reset code.'}, status=status.HTTP_400_BAD_REQUEST)
    if password != confirm:
        return Response({'detail': 'Passwords do not match.'}, status=status.HTTP_400_BAD_REQUEST)
    try:
        validate_password(password, user=user)
    except DjangoValidationError as exc:
        return Response({'password': list(exc.messages)}, status=status.HTTP_400_BAD_REQUEST)
    user.set_password(password); user.save(update_fields=['password']); PasswordResetCode.objects.filter(user=user).delete(); send_mail('Digital Archive - password changed', 'Your password was changed successfully.', None, [user.email], fail_silently=True); return Response({'detail': 'Password reset successfully.'})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request): logout(request); return Response({'detail': 'Logged out successfully.'})


@api_view(['GET', 'PATCH'])
@parser_classes([MultiPartParser, FormParser, JSONParser])
@permission_classes([IsAuthenticated])
def profile(request):
    if request.method == 'PATCH':
        serializer = UserSerializer(request.user, data=request.data, partial=True, context={'request': request}); serializer.is_valid(raise_exception=True); serializer.save()
    return Response(UserSerializer(request.user, context={'request': request}).data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def profile_dashboard(request):
    user = request.user
    books = Book.objects.filter(created_by=user).select_related('author_record', 'category').order_by('-created_at')
    stats = {
        'books': books.count(),
        'followers': UserFollow.objects.filter(following=user).count(),
        'following': UserFollow.objects.filter(follower=user).count(),
        'readers': ReadingProgress.objects.filter(book__created_by=user).values('user_id').distinct().count(),
        'likes_received': Favorite.objects.filter(book__created_by=user).count(),
        'reviews_received': BookReview.objects.filter(book__created_by=user).count(),
        'comments_received': BookComment.objects.filter(book__created_by=user).count(),
        'saved_books': Favorite.objects.filter(user=user).count(),
        'books_read': ReadingProgress.objects.filter(user=user, progress_percent=100).count(),
    }
    activity = [
        {'type': 'book', 'text': f'Published {book.title}', 'created_at': book.created_at}
        for book in books[:5]
    ]
    return Response({
        'stats': stats,
        'books': BookSerializer(books, many=True, context={'request': request}).data,
        'activity': activity,
    })


@api_view(['POST', 'DELETE'])
@permission_classes([IsAuthenticated])
def follow_user(request, user_id):
    target = get_object_or_404(User, pk=user_id)
    if target == request.user:
        return Response({'detail': 'You cannot follow yourself.'}, status=status.HTTP_400_BAD_REQUEST)
    if request.method == 'DELETE':
        UserFollow.objects.filter(follower=request.user, following=target).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    follow, created = UserFollow.objects.get_or_create(follower=request.user, following=target)
    return Response({'id': follow.id, 'following': target.id, 'created': created}, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([AllowAny])
def search(request):
    term = request.query_params.get('q', request.query_params.get('search', '')).strip()
    qs = Book.objects.select_related('author_record', 'category').all()
    if term: qs = qs.filter(Q(title__icontains=term) | Q(author__icontains=term) | Q(author_record__name__icontains=term) | Q(genre__icontains=term) | Q(isbn__icontains=term) | Q(publication_year__icontains=term))
    return Response(BookSerializer(qs[:30], many=True, context={'request': request}).data)
