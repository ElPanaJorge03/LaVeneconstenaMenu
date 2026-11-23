from datetime import timedelta

from django.db import transaction
from django.db.models import Count, Sum
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from apps.local.models import ConfigLocal
from apps.menu.models import Adicional, Producto
from apps.mesas.models import Mesa
from apps.pagos.models import Pago

from .models import ItemPedido, Pedido, generate_order_code
from .realtime import emitir_evento_pedido

ALLOWED_TRANSITIONS = {
    Pedido.Estado.NUEVO: {Pedido.Estado.PREPARANDO, Pedido.Estado.CANCELADO},
    Pedido.Estado.PREPARANDO: {Pedido.Estado.LISTO, Pedido.Estado.CANCELADO},
    Pedido.Estado.LISTO: {Pedido.Estado.ENTREGADO, Pedido.Estado.CANCELADO},
    Pedido.Estado.ENTREGADO: set(),
    Pedido.Estado.CANCELADO: set(),
}


def _generate_unique_code() -> str:
    for _ in range(10):
        code = generate_order_code()
        if not Pedido.objects.filter(codigo=code).exists():
            return code
    raise ValidationError("No se pudo generar un código de pedido único.")


@transaction.atomic
def crear_pedido(
    *,
    tipo: str,
    cliente_nombre: str,
    telefono: str = "",
    direccion: str = "",
    mesa_id: int | None = None,
    mesa_referencia: str = "",
    notas: str = "",
    metodo_pago: str = Pago.Metodo.EFECTIVO,
    items_data: list[dict],
    creado_por=None,
    ignorar_local_cerrado: bool = False,
    marcar_efectivo_pagado: bool = False,
) -> Pedido:
    """
    Crea un pedido validando disponibilidad, tipo y recalculando TODOS los precios
    y totales estrictamente desde la base de datos en enteros COP.
    """
    if not ignorar_local_cerrado:
        local_cfg = ConfigLocal.get_solo()
        if not local_cfg.abierto:
            raise ValidationError(
                {
                    "detail": local_cfg.mensaje_cerrado
                    or "El local se encuentra cerrado en este momento."
                }
            )

    if not items_data:
        raise ValidationError({"items": "Debes agregar al menos un producto al pedido."})
    if len(items_data) > 40:
        raise ValidationError({"items": "Máximo 40 líneas por pedido."})

    cliente_nombre = (cliente_nombre or "").strip()
    telefono = (telefono or "").strip()
    direccion = (direccion or "").strip()
    mesa_referencia = (mesa_referencia or "").strip()
    notas = (notas or "").strip()

    if not cliente_nombre:
        if creado_por is not None and tipo == Pedido.Tipo.MESA:
            cliente_nombre = "Cliente en mesa"
        else:
            raise ValidationError(
                {"cliente_nombre": "Ingresa tu nombre para identificar el pedido."}
            )

    mesa_obj = None
    if tipo == Pedido.Tipo.DOMICILIO:
        if not telefono:
            raise ValidationError(
                {"telefono": "Ingresa un teléfono de contacto para el domicilio."}
            )
        if not direccion:
            raise ValidationError(
                {"direccion": "Ingresa la dirección completa para el domicilio."}
            )
    elif tipo == Pedido.Tipo.RECOGER:
        if not telefono and creado_por is None:
            raise ValidationError(
                {"telefono": "Ingresa un teléfono para avisarte cuando esté listo."}
            )
    elif tipo == Pedido.Tipo.MESA:
        if mesa_id is not None:
            try:
                mesa_obj = Mesa.objects.get(pk=mesa_id, activa=True)
            except Mesa.DoesNotExist:
                raise ValidationError(
                    {"mesa": "La mesa seleccionada no existe o no está activa."}
                )
        elif not mesa_referencia:
            raise ValidationError({"mesa_referencia": "Indica el número de tu mesa."})
    else:
        raise ValidationError({"tipo": "Tipo de pedido inválido."})

    if metodo_pago not in {Pago.Metodo.EFECTIVO, Pago.Metodo.BOLD}:
        raise ValidationError({"metodo_pago": "Método de pago inválido."})

    product_ids = {int(entry["producto_id"]) for entry in items_data}
    productos_map = {
        p.id: p
        for p in Producto.objects.select_related("categoria").filter(
            id__in=product_ids, disponible=True, categoria__activa=True
        )
    }

    all_extra_ids = set()
    for entry in items_data:
        for extra_id in entry.get("adicionales_ids") or []:
            all_extra_ids.add(int(extra_id))

    adicionales_map = {
        a.id: a for a in Adicional.objects.filter(id__in=all_extra_ids, disponible=True)
    }

    prepared_items = []
    total_pedido = 0

    for idx, entry in enumerate(items_data):
        prod_id = int(entry["producto_id"])
        producto = productos_map.get(prod_id)
        if not producto:
            raise ValidationError(
                {"items": f"El producto #{prod_id} no existe o no está disponible."}
            )

        tamano = entry.get("tamano", ItemPedido.Tamano.NORMAL)
        if tamano not in {ItemPedido.Tamano.NORMAL, ItemPedido.Tamano.MINI}:
            raise ValidationError({"items": f"Tamaño inválido en el ítem {idx + 1}."})

        cantidad = int(entry.get("cantidad", 1))
        if cantidad < 1 or cantidad > 20:
            raise ValidationError(
                {"items": f"La cantidad de '{producto.nombre}' debe estar entre 1 y 20."}
            )

        if tamano == ItemPedido.Tamano.MINI:
            if not producto.tiene_mini:
                raise ValidationError(
                    {"items": f"'{producto.nombre}' no tiene tamaño MINI."}
                )
            base_price = int(producto.precio_mini)
        else:
            if producto.precio_normal <= 0:
                raise ValidationError(
                    {
                        "items": f"'{producto.nombre}' aún no tiene precio configurado en el local."
                    }
                )
            base_price = int(producto.precio_normal)

        extra_ids = list(
            dict.fromkeys(int(x) for x in (entry.get("adicionales_ids") or []))
        )
        extra_objs = []
        extras_total = 0
        extras_snapshot = []
        for eid in extra_ids:
            extra = adicionales_map.get(eid)
            if not extra:
                raise ValidationError(
                    {"items": f"El adicional #{eid} no está disponible."}
                )
            extra_objs.append(extra)
            extras_total += int(extra.precio)
            extras_snapshot.append(
                {"id": extra.id, "nombre": extra.nombre, "precio": int(extra.precio)}
            )

        precio_unitario = base_price + extras_total
        subtotal = precio_unitario * cantidad
        total_pedido += subtotal

        prepared_items.append(
            {
                "producto": producto,
                "nombre_producto": producto.nombre,
                "tamano": tamano,
                "cantidad": cantidad,
                "precio_unitario": precio_unitario,
                "extras_objs": extra_objs,
                "adicionales_snapshot": extras_snapshot,
                "subtotal": subtotal,
                "notas": (entry.get("notas") or "").strip()[:200],
            }
        )

    pedido = Pedido.objects.create(
        codigo=_generate_unique_code(),
        tipo=tipo,
        estado=Pedido.Estado.NUEVO,
        mesa=mesa_obj,
        mesa_referencia=mesa_referencia if not mesa_obj else "",
        cliente_nombre=cliente_nombre,
        telefono=telefono,
        direccion=direccion if tipo == Pedido.Tipo.DOMICILIO else "",
        notas=notas,
        total=total_pedido,
        creado_por=creado_por,
    )

    for item_payload in prepared_items:
        extras_objs = item_payload.pop("extras_objs")
        item = ItemPedido.objects.create(pedido=pedido, **item_payload)
        if extras_objs:
            item.adicionales.set(extras_objs)

    # Pago online Bold siempre inicia PENDIENTE; efectivo solo puede marcarse pagado por staff
    pago_estado = (
        Pago.Estado.PAGADO
        if (
            creado_por is not None
            and metodo_pago == Pago.Metodo.EFECTIVO
            and marcar_efectivo_pagado
        )
        else Pago.Estado.PENDIENTE
    )
    Pago.objects.create(
        pedido=pedido,
        metodo=metodo_pago,
        estado=pago_estado,
        monto=total_pedido,
        pagado_en=timezone.now() if pago_estado == Pago.Estado.PAGADO else None,
    )

    transaction.on_commit(lambda: emitir_evento_pedido(pedido, "pedido_creado"))
    return pedido


@transaction.atomic
def cambiar_estado_pedido(pedido: Pedido, nuevo_estado: str) -> Pedido:
    if nuevo_estado == pedido.estado:
        return pedido

    permitidos = ALLOWED_TRANSITIONS.get(pedido.estado, set())
    if nuevo_estado not in permitidos:
        raise ValidationError(
            {
                "estado": (
                    f"No se puede pasar un pedido de '{pedido.estado}' a '{nuevo_estado}'."
                )
            }
        )

    pedido.estado = nuevo_estado
    pedido.save(update_fields=["estado", "actualizado_en"])
    transaction.on_commit(lambda: emitir_evento_pedido(pedido, "pedido_actualizado"))
    return pedido


@transaction.atomic
def marcar_pago_efectivo(pedido: Pedido) -> Pedido:
    pago = getattr(pedido, "pago", None)
    if not pago:
        raise ValidationError({"pago": "El pedido no tiene un pago asociado."})
    if pago.metodo != Pago.Metodo.EFECTIVO:
        raise ValidationError(
            {
                "pago": "Solo los pagos en efectivo pueden confirmarse manualmente. Los pagos Bold se confirman únicamente por webhook."
            }
        )
    if pago.estado == Pago.Estado.PAGADO:
        return pedido

    pago.estado = Pago.Estado.PAGADO
    pago.pagado_en = timezone.now()
    pago.save(update_fields=["estado", "pagado_en", "actualizado_en"])
    transaction.on_commit(lambda: emitir_evento_pedido(pedido, "pedido_actualizado"))
    return pedido


def obtener_resumen_ventas(rango: str = "hoy") -> dict:
    ahora = timezone.localtime()
    qs = Pedido.objects.select_related("mesa", "pago").prefetch_related("items")

    if rango == "hoy":
        inicio = ahora.replace(hour=0, minute=0, second=0, microsecond=0)
        qs = qs.filter(creado_en__gte=inicio)
    elif rango == "semana":
        qs = qs.filter(creado_en__gte=ahora - timedelta(days=7))
    elif rango == "mes":
        qs = qs.filter(creado_en__gte=ahora - timedelta(days=30))

    no_cancelados = qs.exclude(estado=Pedido.Estado.CANCELADO)
    pagados = no_cancelados.filter(pago__estado=Pago.Estado.PAGADO)

    ventas_totales = no_cancelados.aggregate(s=Sum("total"))["s"] or 0
    ventas_cobradas = pagados.aggregate(s=Sum("total"))["s"] or 0
    total_pedidos = no_cancelados.count()
    pedidos_activos = qs.filter(
        estado__in=[
            Pedido.Estado.NUEVO,
            Pedido.Estado.PREPARANDO,
            Pedido.Estado.LISTO,
        ]
    ).count()
    ticket_promedio = int(ventas_totales // total_pedidos) if total_pedidos else 0

    por_metodo = {
        "efectivo": no_cancelados.filter(pago__metodo=Pago.Metodo.EFECTIVO).aggregate(
            s=Sum("total")
        )["s"]
        or 0,
        "bold": no_cancelados.filter(pago__metodo=Pago.Metodo.BOLD).aggregate(
            s=Sum("total")
        )["s"]
        or 0,
    }

    por_tipo = {
        row["tipo"]: row["c"]
        for row in no_cancelados.values("tipo").annotate(c=Count("id"))
    }

    top_productos = list(
        ItemPedido.objects.filter(pedido__in=no_cancelados)
        .values("nombre_producto")
        .annotate(unidades=Sum("cantidad"), ingresos=Sum("subtotal"))
        .order_by("-unidades", "-ingresos")[:8]
    )

    return {
        "rango": rango,
        "ventas_totales": int(ventas_totales),
        "ventas_cobradas": int(ventas_cobradas),
        "total_pedidos": total_pedidos,
        "pedidos_activos": pedidos_activos,
        "pedidos_cancelados": qs.filter(estado=Pedido.Estado.CANCELADO).count(),
        "ticket_promedio": ticket_promedio,
        "por_metodo": por_metodo,
        "por_tipo": por_tipo,
        "top_productos": top_productos,
        "historial": qs.order_by("-creado_en")[:50],
    }
