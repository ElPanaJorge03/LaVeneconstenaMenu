from django.contrib import admin

from .models import ConfigLocal


@admin.register(ConfigLocal)
class ConfigLocalAdmin(admin.ModelAdmin):
    list_display = ("nombre", "abierto", "barrio", "telefono", "actualizado_en")
