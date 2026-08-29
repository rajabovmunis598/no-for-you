from django.db import migrations, models


def empty_phones_to_null(apps, schema_editor):
    Profile = apps.get_model('myapp', 'Profile')
    Profile.objects.filter(phone='').update(phone=None)


class Migration(migrations.Migration):
    dependencies = [('myapp', '0007_bookcomment_bookreview_userfollow')]

    operations = [
        migrations.AlterField(
            model_name='profile',
            name='phone',
            field=models.CharField(blank=True, max_length=32, null=True),
        ),
        migrations.RunPython(empty_phones_to_null, migrations.RunPython.noop),
        migrations.AlterField(
            model_name='profile',
            name='phone',
            field=models.CharField(blank=True, max_length=32, null=True, unique=True),
        ),
    ]
