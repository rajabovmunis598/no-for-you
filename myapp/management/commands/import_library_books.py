from pathlib import Path

from django.contrib.auth import get_user_model
from django.core.files import File
from django.core.management.base import BaseCommand, CommandError

from myapp.models import Book


class Command(BaseCommand):
    help = 'Imports the 20 PDF books in the local китоб folder for a user.'

    def add_arguments(self, parser):
        parser.add_argument('--username', required=True)

    def handle(self, *args, **options):
        user = get_user_model().objects.filter(username=options['username']).first()
        if not user:
            raise CommandError(f"User '{options['username']}' was not found.")

        source_root = Path.cwd() / 'китоб'
        pdfs = sorted(source_root.glob('*/*.pdf'), key=lambda item: int(item.parent.name))
        if len(pdfs) != 20:
            raise CommandError(f'Expected 20 PDFs in {source_root}, found {len(pdfs)}.')

        created = 0
        skipped = 0
        image_suffixes = {'.jpg', '.jpeg', '.png', '.webp'}
        for pdf in pdfs:
            title = pdf.stem.replace('_', ' ').strip()
            if Book.objects.filter(created_by=user, title=title).exists():
                skipped += 1
                continue
            cover = next((item for item in pdf.parent.iterdir() if item.suffix.lower() in image_suffixes), None)
            book = Book(
                title=title,
                author='Digital Archive contributor',
                description='A PDF book added to the Digital Archive library.',
                genre='Personal development',
                publication_year=2026,
                language='English',
                created_by=user,
            )
            with pdf.open('rb') as pdf_file:
                book.book_file.save(f'book-{pdf.parent.name}.pdf', File(pdf_file), save=False)
            if cover:
                with cover.open('rb') as cover_file:
                    book.cover.save(f'cover-{pdf.parent.name}{cover.suffix.lower()}', File(cover_file), save=False)
            book.save()
            created += 1
            self.stdout.write(f'Added book #{created + skipped}')

        self.stdout.write(self.style.SUCCESS(f'Completed: {created} added, {skipped} already present.'))
