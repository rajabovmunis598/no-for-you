from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True
    dependencies = []
    operations = [
        migrations.CreateModel(
            name='Book',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(max_length=200, verbose_name='Номи китоб')),
                ('author', models.CharField(max_length=160, verbose_name='Муаллиф')),
                ('description', models.TextField(blank=True, verbose_name='Тавсиф')),
                ('genre', models.CharField(default='Адабиёт', max_length=80, verbose_name='Жанр')),
                ('published_year', models.PositiveIntegerField(blank=True, null=True, verbose_name='Соли нашр')),
                ('pages', models.PositiveIntegerField(blank=True, null=True, verbose_name='Шумораи саҳифаҳо')),
                ('cover', models.FileField(blank=True, null=True, upload_to='book_covers/', verbose_name='Муқова')),
                ('is_available', models.BooleanField(default=True, verbose_name='Дастрас аст')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
            options={'verbose_name': 'Китоб', 'verbose_name_plural': 'Китобҳо', 'ordering': ['title']},
        ),
    ]
