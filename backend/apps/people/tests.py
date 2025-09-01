from django.urls import reverse
from rest_framework.test import APITestCase
from .models import Client

class TestClientPhone(APITestCase):
    def test_relaxed_phone(self):
        url = reverse("client-list")
        data = {"first_name": "Foo", "last_name": "Bar", "phones": [{"e164": "notaphone"}]}
        resp = self.client.post(url, data, format="json")
        self.assertEqual(resp.status_code, 201)
        client = Client.objects.get(first_name="Foo")
        self.assertEqual(client.phones.first().e164, "notaphone")
