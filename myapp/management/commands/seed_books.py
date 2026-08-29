from pathlib import Path

from django.conf import settings
from django.core.files import File
from django.core.management.base import BaseCommand

from myapp.models import Book


BOOKS = [
    ('Alice in Wonderland', 'Lewis Carroll', 'A classic journey through a strange and wonderful world.', 'Фантастика', 1865, 192, 'alice.jpg'),
    ('The Little Prince', 'Antoine de Saint-Exupéry', 'A timeless story about friendship and imagination.', 'Фантастика', 1943, 96, 'little-prince.jpg'),
    ('1984', 'George Orwell', 'A classic novel about society, freedom and truth.', 'Дистопия', 1949, 328, '1984.jpg'),
    ('The Alchemist', 'Paulo Coelho', 'A story about dreams, courage and self-discovery.', 'Фалсафа', 1988, 208, 'alchemist.jpg'),
    ('The Hobbit', 'J. R. R. Tolkien', 'An adventure across Middle-earth.', 'Фантастика', 1937, 310, 'hobbit.jpg'),
    ('Harry Potter', 'J. K. Rowling', 'A young wizard discovers his extraordinary world.', 'Фантастика', 1997, 309, 'harry-potter.jpg'),
    ('The Great Gatsby', 'F. Scott Fitzgerald', 'A story of ambition, love and the American dream.', 'Роман', 1925, 180, 'gatsby.jpg'),
    ('Pride and Prejudice', 'Jane Austen', 'A beloved novel of manners, love and wit.', 'Роман', 1813, 432, 'pride.jpg'),
    ('Sherlock Holmes', 'Arthur Conan Doyle', 'Brilliant mysteries solved by a legendary detective.', 'Детектив', 1892, 307, 'sherlock.jpg'),
    ('Frankenstein', 'Mary Shelley', 'A gothic tale about science and responsibility.', 'Даҳшат', 1818, 280, 'frankenstein.jpg'),
    ('Don Quixote', 'Miguel de Cervantes', 'A comic and adventurous classic of world literature.', 'Адабиёт', 1605, 992, 'don-quixote.jpg'),
    ('Moby-Dick', 'Herman Melville', 'A powerful voyage across the open sea.', 'Саргузашт', 1851, 720, 'moby-dick.jpg'),
]


class Command(BaseCommand):
    help = 'Create the initial catalog of ten books using image.png as cover.'

    def handle(self, *args, **options):
        image_path = settings.BASE_DIR / 'image.png'
        created = 0
        titles = [book[0] for book in BOOKS]
        Book.objects.exclude(title__in=titles).delete()
        for title, author, description, genre, year, pages, cover_name in BOOKS:
            book, was_created = Book.objects.update_or_create(
                title=title,
                defaults={
                    'author': author, 'description': description, 'genre': genre,
                    'published_year': year, 'pages': pages,
                },
            )
            cover_path = settings.BASE_DIR / 'media' / 'book_covers' / cover_name
            if cover_path.exists() and book.cover.name != f'book_covers/{cover_name}':
                with cover_path.open('rb') as image:
                    book.cover.save(cover_name, File(image), save=True)
            elif not book.cover:
                with image_path.open('rb') as image:
                    book.cover.save('image.png', File(image), save=True)
            if was_created:
                created += 1
        self.stdout.write(self.style.SUCCESS(f'{created} books added. Total: {Book.objects.count()}'))
