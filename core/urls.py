from django.contrib import admin
from django.conf import settings
from django.conf.urls.static import static
from django.contrib.staticfiles.views import serve as static_serve
from django.urls import include, path, re_path
from django.views.generic import TemplateView
from drf_spectacular.views import SpectacularAPIView, SpectacularRedocView, SpectacularSwaggerView


def serve_static(request, path):
    return static_serve(request, path, insecure=True)

urlpatterns = [
    path('', TemplateView.as_view(template_name='react_index.html'), name='home'),
    path('admin/', admin.site.urls),
    path('api/', include('myapp.urls')),
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
]

if settings.DEBUG:
    urlpatterns += [re_path(r'^static/(?P<path>.*)$', serve_static)]
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
