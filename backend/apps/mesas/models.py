from django.db import models


class Mesa(models.Model):
    numero = models.PositiveIntegerField(unique=True)
    nombre = models.CharField(max_length=60, blank=True)
    activa = models.BooleanField(default=True)
    creado_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("numero",)
        verbose_name = "Mesa"
        verbose_name_plural = "Mesas"

    def __str__(self):
        return self.nombre or f"Mesa {self.numero}"
