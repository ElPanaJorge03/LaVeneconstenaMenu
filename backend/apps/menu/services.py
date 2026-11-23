from django.db.models import Prefetch

from .models import Adicional, Categoria, Producto


def get_public_menu_queryset():
    """Retorna categorías activas con sus productos disponibles y ordenados."""
    productos_disponibles = Producto.objects.filter(disponible=True).order_by(
        "orden", "id"
    )
    return (
        Categoria.objects.filter(activa=True)
        .prefetch_related(
            Prefetch("productos", queryset=productos_disponibles, to_attr="productos_activos")
        )
        .order_by("orden", "id")
    )


def get_public_adicionales_queryset():
    return Adicional.objects.filter(disponible=True).order_by("orden", "id")


def toggle_producto_disponibilidad(producto: Producto) -> Producto:
    producto.disponible = not producto.disponible
    producto.save(update_fields=["disponible", "actualizado_en"])
    return producto


def toggle_adicional_disponibilidad(adicional: Adicional) -> Adicional:
    adicional.disponible = not adicional.disponible
    adicional.save(update_fields=["disponible", "actualizado_en"])
    return adicional
