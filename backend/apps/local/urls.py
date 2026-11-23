from django.urls import path

from .views import AdminConfigLocalView, PublicLocalInfoView

urlpatterns = [
    path("info/", PublicLocalInfoView.as_view(), name="local-public-info"),
    path("admin/config/", AdminConfigLocalView.as_view(), name="local-admin-config"),
]
