from django.urls import path

from .views import (
    AdminVentasResumenView,
    PanelCreateManualPedidoView,
    PanelMarcarEfectivoView,
    PanelPedidoChangeEstadoView,
    PanelPedidoListView,
    PublicCreatePedidoView,
    PublicTrackingPedidoView,
)

urlpatterns = [
    path("public/", PublicCreatePedidoView.as_view(), name="pedidos-public-create"),
    path(
        "seguimiento/<str:codigo>/",
        PublicTrackingPedidoView.as_view(),
        name="pedidos-public-tracking",
    ),
    path("panel/", PanelPedidoListView.as_view(), name="pedidos-panel-list"),
    path("panel/manual/", PanelCreateManualPedidoView.as_view(), name="pedidos-panel-manual"),
    path(
        "panel/<int:pk>/estado/",
        PanelPedidoChangeEstadoView.as_view(),
        name="pedidos-panel-change-estado",
    ),
    path(
        "panel/<int:pk>/marcar-efectivo/",
        PanelMarcarEfectivoView.as_view(),
        name="pedidos-panel-marcar-efectivo",
    ),
    path("admin/ventas/", AdminVentasResumenView.as_view(), name="pedidos-admin-ventas"),
]
