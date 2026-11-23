from rest_framework import serializers

from .models import ConfigLocal


class PublicConfigLocalSerializer(serializers.ModelSerializer):
    class Meta:
        model = ConfigLocal
        fields = (
            "nombre",
            "abierto",
            "mensaje_cerrado",
            "horarios",
            "barrio",
            "direccion",
            "telefono",
            "instagram",
        )
