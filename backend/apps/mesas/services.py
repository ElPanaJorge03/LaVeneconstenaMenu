from io import BytesIO

import qrcode
from django.conf import settings
from PIL import Image, ImageDraw, ImageFont

from .models import Mesa


def get_mesa_qr_url(mesa: Mesa) -> str:
    return f"{settings.FRONTEND_URL}/mesa/{mesa.id}"


def generate_mesa_qr_png(mesa: Mesa) -> bytes:
    """Genera un QR estilo tarjeta imprimible con bordes cálidos de La VeneConsteña."""
    url = get_mesa_qr_url(mesa)
    qr = qrcode.QRCode(
        version=None,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=12,
        border=3,
    )
    qr.add_data(url)
    qr.make(fit=True)
    qr_img = qr.make_image(fill_color="#4A2C25", back_color="#FFFFFF").convert("RGB")

    pad_x = 48
    top_h = 96
    bot_h = 84
    w = qr_img.width + pad_x * 2
    h = qr_img.height + top_h + bot_h

    canvas = Image.new("RGB", (w, h), "#FFF8EC")
    draw = ImageDraw.Draw(canvas)

    # Cabecera roja de marca
    draw.rounded_rectangle([(16, 16), (w - 16, top_h - 8)], radius=24, fill="#C8371E")
    font_default = ImageFont.load_default()
    title = f"LA VENECONSTEÑA · MESA {mesa.numero}"
    bbox = draw.textbbox((0, 0), title, font=font_default)
    tw = bbox[2] - bbox[0]
    draw.text(((w - tw) / 2, 46), title, fill="#FFFFFF", font=font_default)

    # Marco sticker blanco del QR
    draw.rounded_rectangle(
        [(pad_x - 10, top_h - 2), (pad_x + qr_img.width + 10, top_h + qr_img.height + 10)],
        radius=20,
        fill="#FFFFFF",
        outline="#EBDCCB",
        width=3,
    )
    canvas.paste(qr_img, (pad_x, top_h + 4))

    footer = f"Escanea para pedir en {mesa}"
    fb = draw.textbbox((0, 0), footer, font=font_default)
    fw = fb[2] - fb[0]
    draw.text(((w - fw) / 2, top_h + qr_img.height + 32), footer, fill="#4A2C25", font=font_default)

    buf = BytesIO()
    canvas.save(buf, format="PNG")
    return buf.getvalue()
