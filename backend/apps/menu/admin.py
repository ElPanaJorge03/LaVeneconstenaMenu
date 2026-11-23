from django.contrib import admin

from .models import Adicional, Categoria, Producto


@admin.register(Categoria)
class CategoriaAdmin(admin.ModelAdmin):
    list_display = ("nombre", "orden", "color_acento", "es_promocion", "activa")
    list_editable = ("orden", "activa")
    prepopulated_fields = {"slug": ("nombre",)}


@admin.register(Producto)
class ProductoAdmin(admin.ModelAdmin):
    list_display = (
        "nombre",
        "categoria",
        "precio_normal",
        "precio_mini",
        "es_especial",
        "disponible",
        "orden",
    )
    list_filter = ("categoria", "es_especial", "disponible")
    search_fields = ("nombre", "descripcion")
    list_editable = ("precio_normal", "precio_mini", "disponible")


@admin.register(Adicional)
class AdicionalAdmin(admin.ModelAdmin):
    list_display = ("nombre", "precio", "disponible", "orden")
    list_editable = ("precio", "disponible", "orden")
