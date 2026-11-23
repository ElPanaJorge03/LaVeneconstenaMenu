from django.db import models


class ConfigLocal(models.Model):
    """Configuración editable del local (singleton). Nunca hardcodear horarios ni dirección."""

    nombre = models.CharField(max_length=120, default="La VeneConsteña")
    abierto = models.BooleanField(default=True)
    mensaje_cerrado = models.CharField(
        max_length=220,
        blank=True,
        default="En este momento estamos cerrados. Puedes ver la carta y pedir apenas abramos.",
    )
    horarios = models.TextField(blank=True, default="")
    barrio = models.CharField(max_length=120, blank=True, default="")
    direccion = models.CharField(max_length=220, blank=True, default="")
    telefono = models.CharField(max_length=40, blank=True, default="")
    instagram = models.CharField(max_length=80, blank=True, default="")
    actualizado_en = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Configuración del Local"
        verbose_name_plural = "Configuración del Local"

    @classmethod
    def get_solo(cls) -> "ConfigLocal":
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj

    def __str__(self):
        estado = "Abierto" if self.abierto else "Cerrado"
        return f"{self.nombre} ({estado})"
