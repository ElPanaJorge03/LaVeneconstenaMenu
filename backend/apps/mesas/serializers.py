from rest_framework import serializers

from .models import Mesa
from .services import get_mesa_qr_url


class MesaPublicSerializer(serializers.ModelSerializer):
    class Meta:
        model = Mesa
        fields = ("id", "numero", "nombre", "activa")


class MesaAdminSerializer(serializers.ModelSerializer):
    qr_target_url = serializers.SerializerMethodField()

    class Meta:
        model = Mesa
        fields = ("id", "numero", "nombre", "activa", "qr_target_url", "creado_en")
        read_only_fields = ("id", "creado_en", "qr_target_url")

    def get_qr_target_url(self, obj):
        return get_mesa_qr_url(obj)
