from rest_framework import serializers

from .models import Adicional, Categoria, Producto


class AdicionalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Adicional
        fields = ("id", "nombre", "precio", "disponible", "orden")

    def validate_precio(self, value):
        if value < 0:
            raise serializers.ValidationError("El precio debe ser un entero positivo en COP.")
        return value


class ProductoSerializer(serializers.ModelSerializer):
    categoria_nombre = serializers.CharField(source="categoria.nombre", read_only=True)
    tiene_mini = serializers.BooleanField(read_only=True)

    class Meta:
        model = Producto
        fields = (
            "id",
            "categoria",
            "categoria_nombre",
            "nombre",
            "descripcion",
            "precio_normal",
            "precio_mini",
            "tiene_mini",
            "es_especial",
            "porciones_texto",
            "etiqueta",
            "imagen",
            "disponible",
            "orden",
        )

    def validate_precio_normal(self, value):
        if value < 0:
            raise serializers.ValidationError("El precio normal no puede ser negativo.")
        return value

    def validate_precio_mini(self, value):
        if value is not None and value <= 0:
            raise serializers.ValidationError(
                "El precio MINI debe ser mayor a 0 o quedar vacío."
            )
        return value


class CategoriaSerializer(serializers.ModelSerializer):
    total_productos = serializers.SerializerMethodField()

    class Meta:
        model = Categoria
        fields = (
            "id",
            "nombre",
            "slug",
            "descripcion",
            "color_acento",
            "es_promocion",
            "orden",
            "activa",
            "total_productos",
        )

    def get_total_productos(self, obj):
        return obj.productos.count()


class PublicProductoSerializer(serializers.ModelSerializer):
    tiene_mini = serializers.BooleanField(read_only=True)

    class Meta:
        model = Producto
        fields = (
            "id",
            "nombre",
            "descripcion",
            "precio_normal",
            "precio_mini",
            "tiene_mini",
            "es_especial",
            "porciones_texto",
            "etiqueta",
            "imagen",
            "orden",
        )


class PublicCategoriaSerializer(serializers.ModelSerializer):
    productos = serializers.SerializerMethodField()

    class Meta:
        model = Categoria
        fields = (
            "id",
            "nombre",
            "slug",
            "descripcion",
            "color_acento",
            "es_promocion",
            "orden",
            "productos",
        )

    def get_productos(self, obj):
        items = getattr(obj, "productos_activos", obj.productos.filter(disponible=True))
        return PublicProductoSerializer(items, many=True, context=self.context).data
