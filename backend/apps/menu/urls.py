from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    AdminAdicionalViewSet,
    AdminCategoriaViewSet,
    AdminProductoViewSet,
    PublicMenuView,
)

router = DefaultRouter()
router.register("admin/categorias", AdminCategoriaViewSet, basename="admin-categorias")
router.register("admin/productos", AdminProductoViewSet, basename="admin-productos")
router.register("admin/adicionales", AdminAdicionalViewSet, basename="admin-adicionales")

urlpatterns = [
    path("public/", PublicMenuView.as_view(), name="menu-public"),
    path("", include(router.urls)),
]
