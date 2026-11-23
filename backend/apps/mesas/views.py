from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.usuarios.permissions import IsAdminRole, IsMeseraOrAdmin

from .models import Mesa
from .serializers import MesaAdminSerializer, MesaPublicSerializer
from .services import generate_mesa_qr_png


class PublicMesaDetailView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request, pk: int):
        mesa = get_object_or_404(Mesa, pk=pk, activa=True)
        return Response(MesaPublicSerializer(mesa).data)


class StaffMesasActivasView(APIView):
    permission_classes = [IsMeseraOrAdmin]

    def get(self, request):
        mesas = Mesa.objects.filter(activa=True).order_by("numero")
        return Response(MesaPublicSerializer(mesas, many=True).data)


class AdminMesaViewSet(viewsets.ModelViewSet):
    queryset = Mesa.objects.all().order_by("numero")
    serializer_class = MesaAdminSerializer
    permission_classes = [IsAdminRole]

    @action(detail=True, methods=["get"])
    def qr(self, request, pk=None):
        mesa = self.get_object()
        png_bytes = generate_mesa_qr_png(mesa)
        response = HttpResponse(png_bytes, content_type="image/png")
        response["Content-Disposition"] = f'inline; filename="mesa-{mesa.numero}-qr.png"'
        return response
