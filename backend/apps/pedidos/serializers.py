from rest_framework import serializers

from apps.pagos.models import Pago

from .models import ItemPedido, Pedido


class CreateItemPedidoInputSerializer(serializers.Serializer):
    producto_id = serializers.IntegerField(min_value=1)
    tamano = serializers.ChoiceField(
        choices=ItemPedido.Tamano.choices, default=ItemPedido.Tamano.NORMAL
    )
    cantidad = serializers.IntegerField(min_value=1, max_value=20, default=1)
    adicionales_ids = serializers.ListField(
        child=serializers.IntegerField(min_value=1),
        required=False,
        default=list,
    )
    notas = serializers.CharField(max_length=200, required=False, allow_blank=True, default="")


class CreatePedidoPublicSerializer(serializers.Serializer):
    tipo = serializers.ChoiceField(choices=Pedido.Tipo.choices)
    cliente_nombre = serializers.CharField(max_length=120)
    telefono = serializers.CharField(max_length=30, required=False, allow_blank=True, default="")
    direccion = serializers.CharField(max_length=240, required=False, allow_blank=True, default="")
    mesa_id = serializers.IntegerField(required=False, allow_null=True, default=None)
    mesa_referencia = serializers.CharField(
        max_length=40, required=False, allow_blank=True, default=""
    )
    notas = serializers.CharField(max_length=400, required=False, allow_blank=True, default="")
    metodo_pago = serializers.ChoiceField(
        choices=Pago.Metodo.choices, default=Pago.Metodo.EFECTIVO
    )
    items = CreateItemPedidoInputSerializer(many=True)


class ItemPedidoReadSerializer(serializers.ModelSerializer):
    class Meta:
        model = ItemPedido
        fields = (
            "id",
            "producto_id",
            "nombre_producto",
            "tamano",
            "cantidad",
            "precio_unitario",
            "adicionales_snapshot",
            "subtotal",
            "notas",
        )


class PagoSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = Pago
        fields = ("metodo", "estado", "monto", "pagado_en")


class PublicPedidoTrackingSerializer(serializers.ModelSerializer):
    """
    Exposición mínima para seguimiento público por código:
    NUNCA incluye teléfono ni dirección completa del cliente.
    """

    items = ItemPedidoReadSerializer(many=True, read_only=True)
    pago = PagoSummarySerializer(read_only=True)
    mesa_display = serializers.CharField(read_only=True)
    cliente_primer_nombre = serializers.SerializerMethodField()

    class Meta:
        model = Pedido
        fields = (
            "codigo",
            "tipo",
            "estado",
            "mesa_display",
            "cliente_primer_nombre",
            "notas",
            "total",
            "pago",
            "items",
            "creado_en",
            "actualizado_en",
        )

    def get_cliente_primer_nombre(self, obj) -> str:
        parts = (obj.cliente_nombre or "").strip().split()
        return parts[0] if parts else "Cliente"


class PanelPedidoSerializer(serializers.ModelSerializer):
    items = ItemPedidoReadSerializer(many=True, read_only=True)
    pago = PagoSummarySerializer(read_only=True)
    mesa_display = serializers.CharField(read_only=True)

    class Meta:
        model = Pedido
        fields = (
            "id",
            "codigo",
            "tipo",
            "estado",
            "mesa",
            "mesa_display",
            "cliente_nombre",
            "telefono",
            "direccion",
            "notas",
            "total",
            "pago",
            "items",
            "creado_en",
            "actualizado_en",
        )


class ChangePedidoEstadoSerializer(serializers.Serializer):
    estado = serializers.ChoiceField(choices=Pedido.Estado.choices)


class CreateManualPedidoSerializer(serializers.Serializer):
    tipo = serializers.ChoiceField(
        choices=Pedido.Tipo.choices, default=Pedido.Tipo.MESA
    )
    cliente_nombre = serializers.CharField(
        max_length=120, required=False, allow_blank=True, default=""
    )
    telefono = serializers.CharField(
        max_length=30, required=False, allow_blank=True, default=""
    )
    direccion = serializers.CharField(
        max_length=240, required=False, allow_blank=True, default=""
    )
    mesa_id = serializers.IntegerField(required=False, allow_null=True, default=None)
    mesa_referencia = serializers.CharField(
        max_length=40, required=False, allow_blank=True, default=""
    )
    notas = serializers.CharField(
        max_length=400, required=False, allow_blank=True, default=""
    )
    metodo_pago = serializers.ChoiceField(
        choices=Pago.Metodo.choices, default=Pago.Metodo.EFECTIVO
    )
    marcar_efectivo_pagado = serializers.BooleanField(required=False, default=False)
    items = CreateItemPedidoInputSerializer(many=True)
