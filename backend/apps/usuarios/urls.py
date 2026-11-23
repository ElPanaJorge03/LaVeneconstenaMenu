from django.urls import include, path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    AdminAccessCheckView,
    AdminUserViewSet,
    CustomTokenObtainPairView,
    MeView,
    PanelAccessCheckView,
)

router = DefaultRouter()
router.register("admin/usuarios", AdminUserViewSet, basename="admin-usuarios")

urlpatterns = [
    path("login/", CustomTokenObtainPairView.as_view(), name="token-obtain-pair"),
    path("refresh/", TokenRefreshView.as_view(), name="token-refresh"),
    path("me/", MeView.as_view(), name="auth-me"),
    path("check-panel/", PanelAccessCheckView.as_view(), name="auth-check-panel"),
    path("check-admin/", AdminAccessCheckView.as_view(), name="auth-check-admin"),
    path("", include(router.urls)),
]
