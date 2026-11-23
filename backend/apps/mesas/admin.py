from django.contrib import admin

from .models import Mesa


@admin.register(Mesa)
class MesaAdmin(admin.ModelAdmin):
    list_display = ("numero", "nombre", "activa", "creado_en")
    list_editable = ("activa",)
