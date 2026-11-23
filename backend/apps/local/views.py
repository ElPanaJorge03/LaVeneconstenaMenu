from django.db import connection
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.usuarios.permissions import IsAdminRole

from .models import ConfigLocal
from .serializers import PublicConfigLocalSerializer


class HealthCheckView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        return Response(
            {
                "status": "ok",
                "service": "la-veneconstena-api",
                "phase": 8,
            }
        )


class PublicLocalInfoView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        config = ConfigLocal.get_solo()
        return Response(PublicConfigLocalSerializer(config).data)


class AdminConfigLocalView(APIView):
    permission_classes = [IsAdminRole]

    def get(self, request):
        config = ConfigLocal.get_solo()
        return Response(PublicConfigLocalSerializer(config).data)

    def patch(self, request):
        config = ConfigLocal.get_solo()
        serializer = PublicConfigLocalSerializer(config, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
