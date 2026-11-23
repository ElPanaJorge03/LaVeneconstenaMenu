from rest_framework.permissions import BasePermission


class IsAdminRole(BasePermission):
    message = "Se requieren permisos de administrador."

    def has_permission(self, request, view) -> bool:
        user = request.user
        return bool(user and user.is_authenticated and user.is_admin_role)


class IsMeseraOrAdmin(BasePermission):
    message = "Se requieren permisos de mesera o administrador."

    def has_permission(self, request, view) -> bool:
        user = request.user
        return bool(
            user
            and user.is_authenticated
            and (user.is_admin_role or user.is_mesera_role)
        )
