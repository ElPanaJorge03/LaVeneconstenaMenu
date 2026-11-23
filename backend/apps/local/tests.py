import pytest
from django.urls import reverse
from rest_framework.test import APIClient


@pytest.mark.django_db
def test_health_endpoint_returns_ok():
    client = APIClient()
    res = client.get(reverse("health-check"))
    assert res.status_code == 200
    assert res.data["status"] == "ok"
    assert res.data["service"] == "la-veneconstena-api"
