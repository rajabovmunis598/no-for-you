from unittest.mock import patch

from django.contrib.auth.models import User
from django.core import mail
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from rest_framework import status
from rest_framework.test import APITestCase

from .models import (
    Book, Call, Category, ChatMember, EmailVerificationCode, Favorite, Group,
    GroupMember, PasswordResetCode, Profile, ReadingProgress, UserFollow,
)
from .serializers import RegistrationSerializer


class LibraryApiTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='reader', email='reader@example.com', password='Strong-pass-123')
        self.category = Category.objects.create(name='Fantasy')
        self.book = Book.objects.create(title='The Archive', author='A. Writer', genre='Fantasy', category=self.category, publication_year=2025, pages=240, isbn='9780000000001')

    def authenticate(self):
        response = self.client.post('/api/auth/login/', {'username': 'reader', 'password': 'Strong-pass-123'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {response.data['access']}")

    def test_book_list_search_and_similar(self):
        response = self.client.get('/api/books/?search=archive')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(self.client.get(f'/api/books/{self.book.id}/similar/').status_code, status.HTTP_200_OK)

    def test_favorite_and_reading_progress(self):
        self.authenticate()
        response = self.client.post(f'/api/books/{self.book.id}/favorite/')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Favorite.objects.filter(user=self.user, book=self.book).exists())
        response = self.client.post('/api/reading/progress/', {'book': self.book.id, 'current_page': 24, 'progress_percent': 10}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(ReadingProgress.objects.get(user=self.user, book=self.book).current_page, 24)
        self.assertEqual(self.client.get('/api/reading/history/').status_code, status.HTTP_200_OK)

    def test_authenticated_user_can_submit_a_book(self):
        self.authenticate()
        response = self.client.post('/api/books/', {
            'title': 'My submitted book', 'author': 'Reader', 'genre': 'Fantasy',
            'description': 'A reader submission.', 'publication_year': 2026,
            'cover': SimpleUploadedFile('cover.jpg', b'cover-content', content_type='image/jpeg'),
            'book_file': SimpleUploadedFile('book.pdf', b'%PDF-1.4 test', content_type='application/pdf'),
        }, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Book.objects.get(pk=response.data['id']).created_by, self.user)

    def test_profile_dashboard_lists_own_books_and_stats(self):
        self.authenticate()
        self.book.created_by = self.user
        self.book.save(update_fields=['created_by'])
        other = User.objects.create_user(username='follower', password='Strong-pass-123')
        UserFollow.objects.create(follower=other, following=self.user)
        response = self.client.get('/api/profile/dashboard/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['stats']['books'], 1)
        self.assertEqual(response.data['stats']['followers'], 1)
        self.assertEqual(response.data['books'][0]['id'], self.book.id)

    def test_user_directory_creates_private_chat_and_sends_message(self):
        self.authenticate()
        other = User.objects.create_user(username='friend', email='friend@example.com', password='Strong-pass-123')
        Profile.objects.create(user=other, phone='+992900000002')
        response = self.client.get('/api/users/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['results'][0]['username'], 'friend')
        response = self.client.post(f'/api/users/{other.id}/chat/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        chat_id = response.data['id']
        self.assertEqual(ChatMember.objects.filter(chat_id=chat_id).count(), 2)
        response = self.client.post(f'/api/chats/{chat_id}/messages/', {'text': 'Hello'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    @override_settings(GEMINI_API_KEY='')
    def test_quick_game_and_unique_registration_fields(self):
        self.authenticate()
        for index in range(4):
            Book.objects.create(title=f'Quiz book {index}', author='Author', cover=f'book_covers/{index}.jpg')
        response = self.client.get('/api/games/quick/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data['questions']), 4)
        self.assertEqual(response.data['source'], 'fallback')
        self.assertIn('emoji', response.data['questions'][0])
        User.objects.create_user(username='used', email='used@example.com', password='Strong-pass-123')
        owner = User.objects.get(username='used')
        Profile.objects.create(user=owner, phone='+992900000003')
        serializer = RegistrationSerializer(data={'username': 'new-user', 'email': 'new@example.com', 'phone': '+992900000003', 'password': 'Strong-pass-123'})
        self.assertFalse(serializer.is_valid())
        self.assertIn('phone', serializer.errors)

    @override_settings(GEMINI_API_KEY='configured-for-test')
    @patch('myapp.views.generate_quiz_copy')
    def test_quick_game_uses_validated_ai_copy(self, mocked_generate):
        self.authenticate()
        for index in range(4):
            Book.objects.create(title=f'AI quiz book {index}', author='Author', cover=f'book_covers/ai-{index}.jpg')

        def generated_copy(books, language):
            self.assertEqual(language, 'tj')
            return {
                book['id']: {
                    'prompt': f"AI question {book['id']}",
                    'emoji': '🤖',
                    'explanation': f"AI explanation {book['id']}",
                }
                for book in books
            }

        mocked_generate.side_effect = generated_copy
        response = self.client.get('/api/games/quick/?language=tj')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['source'], 'ai')
        self.assertTrue(all(question['prompt'].startswith('AI question') for question in response.data['questions']))
        self.assertTrue(all(question['answer'] in question['options'] for question in response.data['questions']))


class AuthenticationFlowTests(APITestCase):
    registration_payload = {
        'username': 'new-reader',
        'email': 'new-reader@example.com',
        'phone': '+992900001111',
        'password': 'Strong-pass-123',
        'confirm_password': 'Strong-pass-123',
    }

    @override_settings(REQUIRE_EMAIL_VERIFICATION=False)
    def test_registration_auto_verifies_when_email_delivery_is_disabled(self):
        response = self.client.post('/api/auth/register/', self.registration_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertFalse(response.data['verification_required'])
        self.assertIn('access', response.data)
        user = User.objects.get(username='new-reader')
        self.assertTrue(user.profile.is_verified)
        self.assertEqual(self.client.get('/api/auth/profile/').status_code, status.HTTP_200_OK)

    @override_settings(
        REQUIRE_EMAIL_VERIFICATION=True,
        EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend',
    )
    def test_registration_preserves_real_email_verification_flow(self):
        response = self.client.post('/api/auth/register/', self.registration_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data['verification_required'])
        self.assertEqual(len(mail.outbox), 1)
        user = User.objects.get(username='new-reader')
        code = EmailVerificationCode.objects.get(user=user).code

        blocked = self.client.post('/api/auth/login/', {
            'username': user.username, 'password': self.registration_payload['password'],
        }, format='json')
        self.assertEqual(blocked.status_code, status.HTTP_403_FORBIDDEN)
        self.assertTrue(blocked.data['verification_required'])

        verified = self.client.post('/api/auth/verify-email/', {
            'email': user.email, 'code': code,
        }, format='json')
        self.assertEqual(verified.status_code, status.HTTP_200_OK)
        self.assertIn('access', verified.data)
        user.profile.refresh_from_db()
        self.assertTrue(user.profile.is_verified)

    @override_settings(REQUIRE_EMAIL_VERIFICATION=True)
    @patch('myapp.views.send_code', side_effect=RuntimeError('private SMTP detail'))
    def test_registration_email_failure_is_safe_and_rolls_back_user(self, _mocked_send):
        response = self.client.post('/api/auth/register/', self.registration_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_503_SERVICE_UNAVAILABLE)
        self.assertNotIn('private SMTP detail', response.data['detail'])
        self.assertFalse(User.objects.filter(username='new-reader').exists())

    @override_settings(REQUIRE_EMAIL_VERIFICATION=False)
    def test_registration_rejects_weak_password(self):
        payload = {**self.registration_payload, 'password': 'password', 'confirm_password': 'password'}
        response = self.client.post('/api/auth/register/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('password', response.data)

    @override_settings(EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend')
    def test_password_reset_validates_strength_and_consumes_code(self):
        user = User.objects.create_user(
            username='reset-user', email='reset@example.com', password='Old-strong-pass-123',
        )
        self.client.post('/api/auth/forgot-password/', {'email': user.email}, format='json')
        code = PasswordResetCode.objects.get(user=user).code
        weak = self.client.post('/api/auth/reset-password/', {
            'email': user.email, 'code': code, 'new_password': 'password', 'confirm_password': 'password',
        }, format='json')
        self.assertEqual(weak.status_code, status.HTTP_400_BAD_REQUEST)
        good = self.client.post('/api/auth/reset-password/', {
            'email': user.email, 'code': code,
            'new_password': 'New-strong-pass-456', 'confirm_password': 'New-strong-pass-456',
        }, format='json')
        self.assertEqual(good.status_code, status.HTTP_200_OK)
        self.assertFalse(PasswordResetCode.objects.filter(user=user).exists())
        user.refresh_from_db()
        self.assertTrue(user.check_password('New-strong-pass-456'))


class ApiPermissionAndValidationTests(APITestCase):
    def setUp(self):
        self.owner = User.objects.create_user(
            username='owner', email='owner@example.com', password='Strong-pass-123',
        )
        self.member = User.objects.create_user(
            username='member', email='member@example.com', password='Strong-pass-123',
        )
        Profile.objects.create(user=self.owner, phone='+992900002221')
        Profile.objects.create(user=self.member, phone='+992900002222')
        self.book = Book.objects.create(
            title='Safe book', author='Writer', pages=100, created_by=self.owner,
        )

    def test_public_book_payload_does_not_expose_creator_email_or_phone(self):
        response = self.client.get(f'/api/books/{self.book.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertNotIn('email', response.data['created_by'])
        self.assertNotIn('phone', response.data['created_by'])

    def test_reading_progress_uses_model_validation(self):
        self.client.force_authenticate(self.owner)
        response = self.client.post('/api/reading/progress/', {
            'book': self.book.id, 'current_page': 101, 'progress_percent': 101,
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(ReadingProgress.objects.filter(user=self.owner, book=self.book).exclude(current_page=0).exists())

    def test_duplicate_favorite_is_idempotent(self):
        self.client.force_authenticate(self.owner)
        first = self.client.post('/api/favorites/', {'book_id': self.book.id}, format='json')
        second = self.client.post('/api/favorites/', {'book_id': self.book.id}, format='json')
        self.assertEqual(first.status_code, status.HTTP_201_CREATED)
        self.assertEqual(second.status_code, status.HTTP_200_OK)
        self.assertEqual(Favorite.objects.filter(user=self.owner, book=self.book).count(), 1)

    def test_only_receiver_can_accept_call(self):
        self.client.force_authenticate(self.owner)
        created = self.client.post('/api/calls/', {
            'receiver_id': self.member.id, 'call_type': Call.CallType.AUDIO,
        }, format='json')
        self.assertEqual(created.status_code, status.HTTP_201_CREATED)
        call_id = created.data['id']
        self.assertEqual(
            self.client.post(f'/api/calls/{call_id}/accept/').status_code,
            status.HTTP_403_FORBIDDEN,
        )
        self.client.force_authenticate(self.member)
        accepted = self.client.post(f'/api/calls/{call_id}/accept/')
        self.assertEqual(accepted.status_code, status.HTTP_200_OK)
        self.assertEqual(accepted.data['status'], Call.Status.ACCEPTED)

    def test_group_member_cannot_edit_group(self):
        group = Group.objects.create(name='Private group', owner=self.owner)
        GroupMember.objects.create(group=group, user=self.owner, role=GroupMember.Role.ADMIN)
        GroupMember.objects.create(group=group, user=self.member)
        self.client.force_authenticate(self.member)
        response = self.client.patch(f'/api/groups/{group.id}/', {'name': 'Hijacked'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        group.refresh_from_db()
        self.assertEqual(group.name, 'Private group')

    def test_non_pdf_page_preview_returns_media_type_error_for_anonymous_user(self):
        self.book.book_file = SimpleUploadedFile('book.epub', b'epub-data', content_type='application/epub+zip')
        self.book.save(update_fields=['book_file'])
        response = self.client.get(f'/api/books/{self.book.id}/page/')
        self.assertEqual(response.status_code, status.HTTP_415_UNSUPPORTED_MEDIA_TYPE)
