from rest_framework import viewsets
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import User
from .permissions import IsAdminRole, IsMeseraOrAdmin
from .serializers import (
    AdminUserWriteSerializer,
    CustomTokenObtainPairSerializer,
    UserSerializer,
)


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)


class PanelAccessCheckView(APIView):
    permission_classes = [IsMeseraOrAdmin]

    def get(self, request):
        return Response({"ok": True, "rol": request.user.rol})


class AdminAccessCheckView(APIView):
    permission_classes = [IsAdminRole]

    def get(self, request):
        return Response({"ok": True, "rol": request.user.rol})


class AdminUserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().order_by("id")
    serializer_class = AdminUserWriteSerializer
    permission_classes = [IsAdminRole]

    def perform_update(self, serializer):
        target = self.get_object()
        if target.pk == self.request.user.pk and serializer.validated_data.get("is_active") is False:
            raise ValidationError({"is_active": "No puedes desactivar tu propia cuenta."})
        serializer.save()

    def perform_destroy(self, instance):
        if instance.pk == self.request.user.pk:
            raise ValidationError({"detail": "No puedes eliminar tu propia cuenta."})
        instance.delete()
