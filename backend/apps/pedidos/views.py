from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from apps.usuarios.permissions import IsAdminRole, IsMeseraOrAdmin

from .models import Pedido
from .serializers import (
    ChangePedidoEstadoSerializer,
    CreateManualPedidoSerializer,
    CreatePedidoPublicSerializer,
    PanelPedidoSerializer,
    PublicPedidoTrackingSerializer,
)
from .services import (
    cambiar_estado_pedido,
    crear_pedido,
    marcar_pago_efectivo,
    obtener_resumen_ventas,
)


class PublicCreatePedidoView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "orders_public"

    def post(self, request):
        serializer = CreatePedidoPublicSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        pedido = crear_pedido(
            tipo=data["tipo"],
            cliente_nombre=data["cliente_nombre"],
            telefono=data["telefono"],
            direccion=data["direccion"],
            mesa_id=data["mesa_id"],
            mesa_referencia=data["mesa_referencia"],
            notas=data["notas"],
            metodo_pago=data["metodo_pago"],
            items_data=data["items"],
        )
        pedido = (
            Pedido.objects.select_related("mesa", "pago")
            .prefetch_related("items")
            .get(pk=pedido.pk)
        )
        return Response(
            PublicPedidoTrackingSerializer(pedido).data,
            status=status.HTTP_201_CREATED,
        )


class PublicTrackingPedidoView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "orders_public"

    def get(self, request, codigo: str):
        normalized = codigo.strip().upper()
        pedido = get_object_or_404(
            Pedido.objects.select_related("mesa", "pago").prefetch_related("items"),
            codigo__iexact=normalized,
        )
        return Response(PublicPedidoTrackingSerializer(pedido).data)


class PanelPedidoListView(APIView):
    permission_classes = [IsMeseraOrAdmin]

    def get(self, request):
        qs = Pedido.objects.select_related("mesa", "pago").prefetch_related("items")
        estado = request.query_params.get("estado")
        if estado:
            qs = qs.filter(estado=estado)
        return Response(PanelPedidoSerializer(qs[:100], many=True).data)


class PanelCreateManualPedidoView(APIView):
    permission_classes = [IsMeseraOrAdmin]

    def post(self, request):
        serializer = CreateManualPedidoSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        pedido = crear_pedido(
            tipo=data["tipo"],
            cliente_nombre=data["cliente_nombre"],
            telefono=data["telefono"],
            direccion=data["direccion"],
            mesa_id=data["mesa_id"],
            mesa_referencia=data["mesa_referencia"],
            notas=data["notas"],
            metodo_pago=data["metodo_pago"],
            items_data=data["items"],
            creado_por=request.user,
            ignorar_local_cerrado=True,
            marcar_efectivo_pagado=data["marcar_efectivo_pagado"],
        )
        pedido = (
            Pedido.objects.select_related("mesa", "pago")
            .prefetch_related("items")
            .get(pk=pedido.pk)
        )
        return Response(PanelPedidoSerializer(pedido).data, status=status.HTTP_201_CREATED)


class PanelPedidoChangeEstadoView(APIView):
    permission_classes = [IsMeseraOrAdmin]

    def post(self, request, pk: int):
        pedido = get_object_or_404(
            Pedido.objects.select_related("mesa", "pago").prefetch_related("items"),
            pk=pk,
        )
        serializer = ChangePedidoEstadoSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        pedido = cambiar_estado_pedido(pedido, serializer.validated_data["estado"])
        return Response(PanelPedidoSerializer(pedido).data)


class PanelMarcarEfectivoView(APIView):
    permission_classes = [IsMeseraOrAdmin]

    def post(self, request, pk: int):
        pedido = get_object_or_404(
            Pedido.objects.select_related("mesa", "pago").prefetch_related("items"),
            pk=pk,
        )
        pedido = marcar_pago_efectivo(pedido)
        return Response(PanelPedidoSerializer(pedido).data)


class AdminVentasResumenView(APIView):
    permission_classes = [IsAdminRole]

    def get(self, request):
        rango = request.query_params.get("rango", "hoy")
        if rango not in {"hoy", "semana", "mes", "todo"}:
            rango = "hoy"
        resumen = obtener_resumen_ventas(rango)
        resumen["historial"] = PanelPedidoSerializer(resumen["historial"], many=True).data
        return Response(resumen)
