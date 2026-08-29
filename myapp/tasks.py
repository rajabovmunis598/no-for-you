from celery import shared_task
from django.core.mail import send_mail


@shared_task
def send_platform_email(subject, text, recipient):
    """Reusable async email task; uses the configured SMTP backend."""
    return send_mail(subject, text, None, [recipient], fail_silently=False)
