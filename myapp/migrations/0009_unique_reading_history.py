from django.db import migrations, models
from django.db.models import Count


def remove_duplicate_history(apps, schema_editor):
    ReadingHistory = apps.get_model('myapp', 'ReadingHistory')
    duplicates = (
        ReadingHistory.objects.values('user_id', 'book_id')
        .annotate(total=Count('id'))
        .filter(total__gt=1)
    )
    for duplicate in duplicates.iterator():
        ids = list(
            ReadingHistory.objects.filter(
                user_id=duplicate['user_id'], book_id=duplicate['book_id'],
            )
            .order_by('-last_read_at', '-id')
            .values_list('id', flat=True)
        )
        ReadingHistory.objects.filter(id__in=ids[1:]).delete()


class Migration(migrations.Migration):
    dependencies = [('myapp', '0008_unique_profile_phone')]

    operations = [
        migrations.RunPython(remove_duplicate_history, migrations.RunPython.noop),
        migrations.AddConstraint(
            model_name='readinghistory',
            constraint=models.UniqueConstraint(
                fields=('user', 'book'), name='unique_history_user_book',
            ),
        ),
    ]
