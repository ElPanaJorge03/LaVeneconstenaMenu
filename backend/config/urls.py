from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path

from apps.local.views import HealthCheckView

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/health/", HealthCheckView.as_view(), name="health-check"),
    path("api/v1/auth/", include("apps.usuarios.urls")),
    path("api/v1/local/", include("apps.local.urls")),
    path("api/v1/menu/", include("apps.menu.urls")),
    path("api/v1/mesas/", include("apps.mesas.urls")),
    path("api/v1/pedidos/", include("apps.pedidos.urls")),
    path("api/v1/pagos/", include("apps.pagos.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
