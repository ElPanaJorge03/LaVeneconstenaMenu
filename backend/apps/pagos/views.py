from django.shortcuts import get_object_or_404
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from apps.pedidos.models import Pedido

from .services import iniciar_pago_bold, procesar_webhook_bold


class BoldIniciarPagoView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "orders_public"

    def post(self, request, codigo: str):
        pedido = get_object_or_404(
            Pedido.objects.select_related("pago"),
            codigo__iexact=codigo.strip(),
        )
        data = iniciar_pago_bold(pedido)
        return Response(data)


@method_decorator(csrf_exempt, name="dispatch")
class BoldWebhookView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        signature = request.headers.get("x-bold-signature", "")
        result = procesar_webhook_bold(request.body, signature)
        status_code = result.pop("status_code", 200)
        return Response(result, status=status_code)
