from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    class Role(models.TextChoices):
        ADMIN = "admin", "Administrador"
        MESERA = "mesera", "Mesera"

    rol = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.MESERA,
    )

    class Meta:
        verbose_name = "Usuario"
        verbose_name_plural = "Usuarios"

    @property
    def is_admin_role(self) -> bool:
        return self.is_superuser or self.rol == self.Role.ADMIN

    @property
    def is_mesera_role(self) -> bool:
        return self.rol == self.Role.MESERA
