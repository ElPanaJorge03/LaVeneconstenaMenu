from django.db import models
from django.utils.text import slugify


class Categoria(models.Model):
    class AccentColor(models.TextChoices):
        ROJO = "rojo", "Rojo marca"
        VERDE = "verde", "Verde costeño"
        MOSTAZA = "mostaza", "Mostaza"

    nombre = models.CharField(max_length=80, unique=True)
    slug = models.SlugField(max_length=90, unique=True, blank=True)
    descripcion = models.CharField(max_length=200, blank=True)
    color_acento = models.CharField(
        max_length=20,
        choices=AccentColor.choices,
        default=AccentColor.ROJO,
    )
    es_promocion = models.BooleanField(default=False)
    orden = models.PositiveIntegerField(default=0)
    activa = models.BooleanField(default=True)
    creado_en = models.DateTimeField(auto_now_add=True)
    actualizado_en = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("orden", "id")
        verbose_name = "Categoría"
        verbose_name_plural = "Categorías"

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.nombre)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.nombre


class Producto(models.Model):
    categoria = models.ForeignKey(
        Categoria,
        on_delete=models.CASCADE,
        related_name="productos",
    )
    nombre = models.CharField(max_length=120)
    descripcion = models.TextField(blank=True)
    # Dinero siempre en enteros COP (nunca float). 0 = precio por definir en admin (ej. bebidas)
    precio_normal = models.PositiveIntegerField(default=0)
    precio_mini = models.PositiveIntegerField(null=True, blank=True)
    es_especial = models.BooleanField(default=False)
    porciones_texto = models.CharField(
        max_length=40,
        blank=True,
        help_text="Ej: 2 personas, 5 personas, Lunes a Jueves",
    )
    etiqueta = models.CharField(max_length=40, blank=True)
    imagen = models.ImageField(upload_to="productos/", null=True, blank=True)
    disponible = models.BooleanField(default=True)
    orden = models.PositiveIntegerField(default=0)
    creado_en = models.DateTimeField(auto_now_add=True)
    actualizado_en = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("orden", "id")
        verbose_name = "Producto"
        verbose_name_plural = "Productos"
        constraints = [
            models.UniqueConstraint(
                fields=("categoria", "nombre"),
                name="unique_producto_por_categoria",
            )
        ]

    @property
    def tiene_mini(self) -> bool:
        return self.precio_mini is not None and self.precio_mini > 0

    def __str__(self):
        return f"{self.nombre} ({self.categoria.nombre})"


class Adicional(models.Model):
    nombre = models.CharField(max_length=80, unique=True)
    # Dinero siempre en enteros COP
    precio = models.PositiveIntegerField()
    disponible = models.BooleanField(default=True)
    orden = models.PositiveIntegerField(default=0)
    creado_en = models.DateTimeField(auto_now_add=True)
    actualizado_en = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("orden", "id")
        verbose_name = "Adicional"
        verbose_name_plural = "Adicionales"

    def __str__(self):
        return f"{self.nombre} (+${self.precio:,})"
