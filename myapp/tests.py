from unittest.mock import patch

from django.contrib.auth.models import User
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Book, Category, ChatMember, Favorite, Profile, ReadingProgress, UserFollow
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
