import pytest
from httpx import AsyncClient
import uuid


@pytest.mark.asyncio
async def test_address_api_lifecycle(
    client: AsyncClient,
    auth_headers_customer: dict,
    auth_headers_admin: dict,
):
    # 1. Create Address for Customer
    create_payload = {
        "full_name": "Jane Doe",
        "phone": "+1234567890",
        "address_line_1": "100 Tech Blvd",
        "address_line_2": "Suite 500",
        "city": "San Francisco",
        "state": "CA",
        "postal_code": "94105",
        "country": "USA",
        "address_type": "Home",
        "is_default_shipping": True,
        "is_default_billing": True,
    }

    response = await client.post(
        "/api/v1/addresses/",
        json=create_payload,
        headers=auth_headers_customer,
    )
    assert response.status_code == 201
    address_1 = response.json()
    assert address_1["full_name"] == "Jane Doe"
    assert address_1["is_default_shipping"] is True
    assert address_1["is_default_billing"] is True
    addr1_id = address_1["id"]

    # 2. Create Second Address for Customer
    create_payload_2 = {
        "full_name": "Jane Work",
        "phone": "+1987654321",
        "address_line_1": "200 Corporate Way",
        "city": "San Francisco",
        "state": "CA",
        "postal_code": "94107",
        "country": "USA",
        "address_type": "Office",
        "is_default_shipping": True,
        "is_default_billing": False,
    }

    response2 = await client.post(
        "/api/v1/addresses/",
        json=create_payload_2,
        headers=auth_headers_customer,
    )
    assert response2.status_code == 201
    address_2 = response2.json()
    assert address_2["is_default_shipping"] is True
    addr2_id = address_2["id"]

    # Verify address_1 is no longer default shipping
    get_addr1 = await client.get(
        f"/api/v1/addresses/{addr1_id}",
        headers=auth_headers_customer,
    )
    assert get_addr1.status_code == 200
    assert get_addr1.json()["is_default_shipping"] is False

    # 3. List Customer Addresses
    list_res = await client.get(
        "/api/v1/addresses/",
        headers=auth_headers_customer,
    )
    assert list_res.status_code == 200
    list_data = list_res.json()
    assert list_data["total"] == 2
    assert len(list_data["items"]) == 2

    # 4. Get Single Address
    get_res = await client.get(
        f"/api/v1/addresses/{addr2_id}",
        headers=auth_headers_customer,
    )
    assert get_res.status_code == 200
    assert get_res.json()["address_line_1"] == "200 Corporate Way"

    # 5. Update Address
    update_res = await client.put(
        f"/api/v1/addresses/{addr1_id}",
        json={
            "address_line_1": "105 Tech Blvd Updated",
            "is_default_shipping": True,
            "is_default_billing": True,
            "phone": "+19998887777",
            "postal_code": "90210",
            "address_line_2": "Suite 101"
        },
        headers=auth_headers_customer,
    )
    assert update_res.status_code == 200
    assert update_res.json()["address_line_1"] == "105 Tech Blvd Updated"
    assert update_res.json()["is_default_shipping"] is True
    assert update_res.json()["is_default_billing"] is True

    # 6. Set Default Billing via PATCH endpoint
    patch_billing = await client.patch(
        f"/api/v1/addresses/{addr2_id}/default-billing",
        headers=auth_headers_customer,
    )
    assert patch_billing.status_code == 200
    assert patch_billing.json()["is_default_billing"] is True

    # 7. Set Default Shipping via PATCH endpoint
    patch_shipping = await client.patch(
        f"/api/v1/addresses/{addr2_id}/default-shipping",
        headers=auth_headers_customer,
    )
    assert patch_shipping.status_code == 200
    assert patch_shipping.json()["is_default_shipping"] is True

    # 8. Security Check: Admin (another user) tries to access Customer's address
    forbidden_get = await client.get(
        f"/api/v1/addresses/{addr1_id}",
        headers=auth_headers_admin,
    )
    assert forbidden_get.status_code == 403

    forbidden_put = await client.put(
        f"/api/v1/addresses/{addr1_id}",
        json={"city": "Hacked City"},
        headers=auth_headers_admin,
    )
    assert forbidden_put.status_code == 403

    forbidden_patch = await client.patch(
        f"/api/v1/addresses/{addr1_id}/default-shipping",
        headers=auth_headers_admin,
    )
    assert forbidden_patch.status_code == 403

    forbidden_patch_billing = await client.patch(
        f"/api/v1/addresses/{addr1_id}/default-billing",
        headers=auth_headers_admin,
    )
    assert forbidden_patch_billing.status_code == 403

    forbidden_delete = await client.delete(
        f"/api/v1/addresses/{addr1_id}",
        headers=auth_headers_admin,
    )
    assert forbidden_delete.status_code == 403

    # 9. Delete Address
    del_res = await client.delete(
        f"/api/v1/addresses/{addr2_id}",
        headers=auth_headers_customer,
    )
    assert del_res.status_code == 204

    # Confirm deletion
    get_deleted = await client.get(
        f"/api/v1/addresses/{addr2_id}",
        headers=auth_headers_customer,
    )
    assert get_deleted.status_code == 404


@pytest.mark.asyncio
async def test_address_validation_and_errors(
    client: AsyncClient,
    auth_headers_customer: dict,
):
    # 1. Unauthenticated request
    unauth_res = await client.get("/api/v1/addresses/")
    assert unauth_res.status_code == 401

    # 2. Non-existent Address
    fake_id = str(uuid.uuid4())
    not_found_get = await client.get(
        f"/api/v1/addresses/{fake_id}",
        headers=auth_headers_customer,
    )
    assert not_found_get.status_code == 404

    not_found_patch = await client.patch(
        f"/api/v1/addresses/{fake_id}/default-shipping",
        headers=auth_headers_customer,
    )
    assert not_found_patch.status_code == 404

    not_found_patch_billing = await client.patch(
        f"/api/v1/addresses/{fake_id}/default-billing",
        headers=auth_headers_customer,
    )
    assert not_found_patch_billing.status_code == 404

    not_found_delete = await client.delete(
        f"/api/v1/addresses/{fake_id}",
        headers=auth_headers_customer,
    )
    assert not_found_delete.status_code == 404

    # 3. Validation Failure: Empty full_name
    bad_name = {
        "full_name": "   ",
        "phone": "+1234567890",
        "address_line_1": "100 Tech Blvd",
        "city": "San Francisco",
        "state": "CA",
        "postal_code": "94105",
        "country": "USA",
    }
    val_err1 = await client.post(
        "/api/v1/addresses/",
        json=bad_name,
        headers=auth_headers_customer,
    )
    assert val_err1.status_code == 422

    # 4. Validation Failure: Invalid Phone
    bad_phone = {
        "full_name": "Jane Doe",
        "phone": "abc-invalid-phone",
        "address_line_1": "100 Tech Blvd",
        "city": "San Francisco",
        "state": "CA",
        "postal_code": "94105",
        "country": "USA",
    }
    val_err2 = await client.post(
        "/api/v1/addresses/",
        json=bad_phone,
        headers=auth_headers_customer,
    )
    assert val_err2.status_code == 422

    # 5. Validation Failure: Invalid Postal Code
    bad_postal = {
        "full_name": "Jane Doe",
        "phone": "+1234567890",
        "address_line_1": "100 Tech Blvd",
        "city": "San Francisco",
        "state": "CA",
        "postal_code": "!!",
        "country": "USA",
    }
    val_err3 = await client.post(
        "/api/v1/addresses/",
        json=bad_postal,
        headers=auth_headers_customer,
    )
    assert val_err3.status_code == 422

    # 6. Update Validation Failures
    update_bad_phone = await client.put(
        f"/api/v1/addresses/{fake_id}",
        json={"phone": "short"},
        headers=auth_headers_customer,
    )
    assert update_bad_phone.status_code == 422

    update_bad_postal = await client.put(
        f"/api/v1/addresses/{fake_id}",
        json={"postal_code": "x"},
        headers=auth_headers_customer,
    )
    assert update_bad_postal.status_code == 422

