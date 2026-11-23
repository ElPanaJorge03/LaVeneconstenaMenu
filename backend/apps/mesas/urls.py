from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import AdminMesaViewSet, PublicMesaDetailView, StaffMesasActivasView

router = DefaultRouter()
router.register("admin", AdminMesaViewSet, basename="admin-mesas")

urlpatterns = [
    path("public/<int:pk>/", PublicMesaDetailView.as_view(), name="mesas-public-detail"),
    path("activas/", StaffMesasActivasView.as_view(), name="mesas-activas"),
    path("", include(router.urls)),
]
