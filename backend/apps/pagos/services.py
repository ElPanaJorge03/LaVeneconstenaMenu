import base64
import hashlib
import hmac
import json

from django.conf import settings
from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from apps.pedidos.models import Pedido
from apps.pedidos.realtime import emitir_evento_pedido

from .models import Pago


def generar_firma_integridad_bold(order_id: str, amount: int, currency: str = "COP") -> str:
    """
    Hash de integridad oficial de Bold (Botón de Pagos):
    SHA256(f"{order_id}{amount}{currency}{BOLD_SECRET_KEY}")
    """
    secret = settings.BOLD_SECRET_KEY
    raw = f"{order_id}{int(amount)}{currency}{secret}"
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


def verificar_firma_webhook_bold(raw_body: bytes, signature_header: str) -> bool:
    """
    Verificación oficial de webhook Bold Colombia:
    HMAC-SHA256 sobre base64(raw_body) usando BOLD_SECRET_KEY, comparado en tiempo constante.
    """
    secret = settings.BOLD_SECRET_KEY
    if not secret or not signature_header:
        return False

    body_b64 = base64.b64encode(raw_body)
    expected = hmac.new(
        secret.encode("utf-8"),
        body_b64,
        hashlib.sha256,
    ).hexdigest()
    return hmac.compare_digest(expected.lower(), signature_header.strip().lower())


@transaction.atomic
def iniciar_pago_bold(pedido: Pedido) -> dict:
    """
    Prepara parámetros firmados para el botón/checkout de Bold sin exponer BOLD_SECRET_KEY.
    """
    pago = getattr(pedido, "pago", None)
    if not pago:
        raise ValidationError({"pago": "El pedido no tiene registro de pago."})
    if pago.metodo != Pago.Metodo.BOLD:
        raise ValidationError({"pago": "Este pedido está configurado para pago en efectivo."})
    if pago.estado == Pago.Estado.PAGADO:
        raise ValidationError({"pago": "Este pedido ya se encuentra pagado."})

    if not pago.referencia_bold:
        pago.referencia_bold = pedido.codigo
        pago.save(update_fields=["referencia_bold", "actualizado_en"])

    configured = bool(settings.BOLD_API_KEY and settings.BOLD_SECRET_KEY)
    integrity_signature = (
        generar_firma_integridad_bold(pago.referencia_bold, pago.monto, "COP")
        if configured
        else ""
    )

    return {
        "configured": configured,
        "apiKey": settings.BOLD_API_KEY if configured else "",
        "orderId": pago.referencia_bold,
        "amount": int(pago.monto),
        "currency": "COP",
        "description": f"Pedido {pedido.codigo} - La VeneConsteña",
        "integritySignature": integrity_signature,
        "redirectionUrl": f"{settings.FRONTEND_URL}/pedido/{pedido.codigo}",
    }


@transaction.atomic
def procesar_webhook_bold(raw_body: bytes, signature_header: str) -> dict:
    """
    Único punto autorizado para confirmar un pago Bold como PAGADO.
    Valida firma HMAC-SHA256 antes de tocar cualquier estado.
    """
    if not settings.BOLD_SECRET_KEY:
        return {"ok": False, "status_code": 503, "detail": "Webhook Bold no configurado."}

    if not verificar_firma_webhook_bold(raw_body, signature_header):
        return {"ok": False, "status_code": 401, "detail": "Firma x-bold-signature inválida."}

    try:
        payload = json.loads(raw_body.decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError):
        return {"ok": False, "status_code": 400, "detail": "Payload JSON inválido."}

    event_type = (payload.get("type") or "").upper()
    data = payload.get("data") or {}
    metadata = data.get("metadata") or {}
    order_ref = (
        metadata.get("reference")
        or data.get("reference")
        or data.get("order_id")
        or payload.get("subject")
        or ""
    ).strip()

    if not order_ref:
        return {"ok": False, "status_code": 400, "detail": "Referencia de pedido ausente."}

    try:
        pago = Pago.objects.select_related("pedido").get(referencia_bold__iexact=order_ref)
    except Pago.DoesNotExist:
        try:
            pago = Pago.objects.select_related("pedido").get(pedido__codigo__iexact=order_ref)
            pago.referencia_bold = order_ref
        except Pago.DoesNotExist:
            return {"ok": False, "status_code": 404, "detail": "Pago no encontrado."}

    # Validar monto si Bold lo incluye (previene discrepancias)
    amount_info = data.get("amount") or {}
    reported_total = (
        amount_info.get("total")
        if isinstance(amount_info, dict)
        else amount_info
    )
    if reported_total is not None and int(reported_total) != int(pago.monto):
        return {"ok": False, "status_code": 400, "detail": "Monto reportado no coincide con el pedido."}

    if event_type == "SALE_APPROVED":
        if pago.estado != Pago.Estado.PAGADO:
            pago.estado = Pago.Estado.PAGADO
            pago.pagado_en = timezone.now()
            pago.save(update_fields=["estado", "pagado_en", "referencia_bold", "actualizado_en"])
            transaction.on_commit(
                lambda: emitir_evento_pedido(pago.pedido, "pedido_actualizado")
            )
    elif event_type in {"SALE_REJECTED", "SALE_FAILED"}:
        if pago.estado != Pago.Estado.PAGADO:
            pago.estado = Pago.Estado.FALLIDO
            pago.save(update_fields=["estado", "referencia_bold", "actualizado_en"])
            transaction.on_commit(
                lambda: emitir_evento_pedido(pago.pedido, "pedido_actualizado")
            )
    elif event_type in {"VOID_APPROVED", "SALE_VOIDED"}:
        pago.estado = Pago.Estado.CANCELADO
        pago.save(update_fields=["estado", "referencia_bold", "actualizado_en"])
        transaction.on_commit(
            lambda: emitir_evento_pedido(pago.pedido, "pedido_actualizado")
        )

    return {"ok": True, "status_code": 200, "estado": pago.estado, "codigo": pago.pedido.codigo}
