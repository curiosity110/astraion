import pytest
from rest_framework.test import APIClient
from apps.people.models import Client


@pytest.mark.django_db
def test_create_update_client_with_multiple_phones():
    api = APIClient()
    payload = {
        "first_name": "John",
        "last_name": "Doe",
        "passport_id": "AA123456",
        "phones": [
            {"e164": "+1 415 555 2671", "label": "home"},
            {"e164": "0712345678", "label": "local"},
        ],
    }
    resp = api.post("/api/clients/", payload, format="json")
    assert resp.status_code == 201
    assert len(resp.data["phones"]) == 2
    client_id = resp.data["id"]

    client = Client.objects.get(id=client_id)
    numbers = sorted([p.e164 for p in client.phones.all()])
    assert "+14155552671" in numbers
    assert "0712345678" in numbers

    update_payload = {"phones": [{"e164": "+1 202 555 0123", "label": "work"}]}
    resp = api.patch(f"/api/clients/{client_id}/", update_payload, format="json")
    assert resp.status_code == 200
    client.refresh_from_db()
    assert list(client.phones.values_list("e164", flat=True)) == ["+12025550123"]


@pytest.mark.django_db
def test_search_by_partial_phone_and_passport():
    api = APIClient()
    api.post(
        "/api/clients/",
        {
            "first_name": "Jane",
            "last_name": "Smith",
            "passport_id": "BB987654",
            "phones": [{"e164": "+1 303 555 0198"}],
        },
        format="json",
    )
    api.post(
        "/api/clients/",
        {
            "first_name": "Alice",
            "last_name": "Jones",
            "passport_id": "CC111222",
            "phones": [{"e164": "+1 404 555 0100"}],
        },
        format="json",
    )

    target_id = str(Client.objects.get(passport_id="BB987654").id)

    resp = api.get("/api/clients/", {"search": "555019"})
    assert resp.status_code == 200
    ids = [c["id"] for c in resp.data["results"]]
    assert ids == [target_id]

    resp2 = api.get("/api/clients/", {"search": "BB987"})
    assert resp2.status_code == 200
    ids2 = [c["id"] for c in resp2.data["results"]]
    assert ids2 == [target_id]
