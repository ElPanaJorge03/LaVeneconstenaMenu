from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.usuarios.permissions import IsAdminRole

from .models import Adicional, Categoria, Producto
from .serializers import (
    AdicionalSerializer,
    CategoriaSerializer,
    ProductoSerializer,
    PublicCategoriaSerializer,
)
from .services import (
    get_public_adicionales_queryset,
    get_public_menu_queryset,
    toggle_adicional_disponibilidad,
    toggle_producto_disponibilidad,
)


class PublicMenuView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        categorias = get_public_menu_queryset()
        adicionales = get_public_adicionales_queryset()
        return Response(
            {
                "categorias": PublicCategoriaSerializer(
                    categorias, many=True, context={"request": request}
                ).data,
                "adicionales": AdicionalSerializer(adicionales, many=True).data,
            }
        )


class AdminCategoriaViewSet(viewsets.ModelViewSet):
    queryset = Categoria.objects.all().order_by("orden", "id")
    serializer_class = CategoriaSerializer
    permission_classes = [IsAdminRole]


class AdminProductoViewSet(viewsets.ModelViewSet):
    queryset = Producto.objects.select_related("categoria").order_by(
        "categoria__orden", "orden", "id"
    )
    serializer_class = ProductoSerializer
    permission_classes = [IsAdminRole]

    def get_queryset(self):
        qs = super().get_queryset()
        categoria_id = self.request.query_params.get("categoria")
        if categoria_id:
            qs = qs.filter(categoria_id=categoria_id)
        return qs

    @action(detail=True, methods=["post"])
    def toggle_disponible(self, request, pk=None):
        producto = toggle_producto_disponibilidad(self.get_object())
        return Response(ProductoSerializer(producto, context={"request": request}).data)


class AdminAdicionalViewSet(viewsets.ModelViewSet):
    queryset = Adicional.objects.all().order_by("orden", "id")
    serializer_class = AdicionalSerializer
    permission_classes = [IsAdminRole]

    @action(detail=True, methods=["post"])
    def toggle_disponible(self, request, pk=None):
        adicional = toggle_adicional_disponibilidad(self.get_object())
        return Response(AdicionalSerializer(adicional).data)
