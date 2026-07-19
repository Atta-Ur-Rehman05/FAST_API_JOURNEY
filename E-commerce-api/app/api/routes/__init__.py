from fastapi import APIRouter
from app.api.routes import (
    auth,
    cart,
    categories,
    checkout,
    inventory,
    orders,
    products,
    reviews,
    users,
)

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(categories.router, prefix="/categories", tags=["categories"])
api_router.include_router(products.router, prefix="/products", tags=["products"])
api_router.include_router(inventory.router, prefix="/inventory", tags=["inventory"])
api_router.include_router(cart.router, prefix="/cart", tags=["cart"])
api_router.include_router(orders.router, prefix="/orders", tags=["orders"])
api_router.include_router(checkout.router, prefix="/checkout", tags=["checkout"])
api_router.include_router(reviews.router, prefix="/reviews", tags=["reviews"])
