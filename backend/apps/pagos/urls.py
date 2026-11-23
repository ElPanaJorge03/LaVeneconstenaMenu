from django.urls import path

from .views import BoldIniciarPagoView, BoldWebhookView

urlpatterns = [
    path("bold/iniciar/<str:codigo>/", BoldIniciarPagoView.as_view(), name="bold-iniciar"),
    path("bold/webhook/", BoldWebhookView.as_view(), name="bold-webhook"),
]
