import pytest
from httpx import AsyncClient
import uuid

@pytest.mark.asyncio
async def test_review_lifecycle(
    client: AsyncClient,
    auth_headers_customer: dict,
    auth_headers_admin: dict
):
    # 1. Create a product and category
    cat_res = await client.post("/api/v1/categories/", json={
        "name": "Review Category", "slug": f"rev-cat-{uuid.uuid4()}"
    }, headers=auth_headers_admin)
    cat_id = cat_res.json()["id"]

    prod_res = await client.post("/api/v1/products/", json={
        "category_id": cat_id, "name": "Review Product",
        "slug": f"rev-prod-{uuid.uuid4()}", "base_price": 50.0
    }, headers=auth_headers_admin)
    prod_id = prod_res.json()["id"]

    # 2. Create review
    review_res = await client.post("/api/v1/reviews/", json={
        "product_id": str(prod_id),
        "rating": 5,
        "comment": "Great product!"
    }, headers=auth_headers_customer)
    assert review_res.status_code == 201
    review_id = review_res.json()["id"]

    # 3. Duplicate review
    duplicate_res = await client.post("/api/v1/reviews/", json={
        "product_id": str(prod_id),
        "rating": 4,
        "comment": "Changed my mind"
    }, headers=auth_headers_customer)
    assert duplicate_res.status_code == 400

    # 4. Get Review
    get_res = await client.get(f"/api/v1/reviews/{review_id}")
    assert get_res.status_code == 200
    assert get_res.json()["rating"] == 5

    # 5. List Reviews
    list_res = await client.get("/api/v1/reviews/")
    assert list_res.status_code == 200
    assert any(r["id"] == review_id for r in list_res.json()["items"])

    # 6. Update Review
    update_res = await client.patch(f"/api/v1/reviews/{review_id}", json={
        "rating": 4,
        "comment": "Actually it's a 4"
    }, headers=auth_headers_customer)
    assert update_res.status_code == 200
    assert update_res.json()["rating"] == 4

    # 7. Update Review Ownership Error
    # customer cannot update admin's review, so let's try to update using admin credentials
    update_fail = await client.patch(f"/api/v1/reviews/{review_id}", json={
        "rating": 1
    }, headers=auth_headers_admin)
    assert update_fail.status_code == 403

    # 8. Delete Review Ownership Error
    # A different customer cannot delete... we don't have a second customer fixture, but admin can admin_delete.
    # So we'll skip to admin delete.

    # 9. Admin delete review
    admin_del = await client.delete(f"/api/v1/reviews/{review_id}", headers=auth_headers_admin)
    assert admin_del.status_code == 204

    # 10. Check if deleted
    get_del = await client.get(f"/api/v1/reviews/{review_id}")
    assert get_del.status_code == 404

@pytest.mark.asyncio
async def test_review_errors(
    client: AsyncClient,
    auth_headers_customer: dict
):
    wrong_id = str(uuid.uuid4())
    wrong_prod = str(uuid.uuid4())

    # Get non-existent review
    res = await client.get(f"/api/v1/reviews/{wrong_id}")
    assert res.status_code == 404

    # Update non-existent review
    res = await client.patch(f"/api/v1/reviews/{wrong_id}", json={
        "rating": 1
    }, headers=auth_headers_customer)
    assert res.status_code == 404

    # Delete non-existent review
    res = await client.delete(f"/api/v1/reviews/{wrong_id}", headers=auth_headers_customer)
    assert res.status_code == 404

    # Create review for non-existent product
    res = await client.post("/api/v1/reviews/", json={
        "product_id": wrong_prod,
        "rating": 5
    }, headers=auth_headers_customer)
    assert res.status_code == 404

@pytest.mark.asyncio
async def test_review_normal_delete(
    client: AsyncClient,
    auth_headers_customer: dict,
    auth_headers_admin: dict
):
    # 1. Create a product and category
    cat_res = await client.post("/api/v1/categories/", json={
        "name": "Review Category 2", "slug": f"rev-cat2-{uuid.uuid4()}"
    }, headers=auth_headers_admin)
    cat_id = cat_res.json()["id"]

    prod_res = await client.post("/api/v1/products/", json={
        "category_id": cat_id, "name": "Review Product 2",
        "slug": f"rev-prod2-{uuid.uuid4()}", "base_price": 50.0
    }, headers=auth_headers_admin)
    prod_id = prod_res.json()["id"]

    # 2. Create review
    review_res = await client.post("/api/v1/reviews/", json={
        "product_id": str(prod_id),
        "rating": 5,
        "comment": "Great product 2!"
    }, headers=auth_headers_customer)
    review_id = review_res.json()["id"]

    # 3. Normal delete review
    del_res = await client.delete(f"/api/v1/reviews/{review_id}", headers=auth_headers_customer)
    assert del_res.status_code == 204
