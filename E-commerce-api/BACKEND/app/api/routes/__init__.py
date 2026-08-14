from fastapi import APIRouter
from app.api.routes import (
    addresses,
    auth,
    cart,
    categories,
    checkout,
    inventory,
    orders,
    payments,
    products,
    reviews,
    users,
    wishlist,
)

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(addresses.router, prefix="/addresses", tags=["addresses"])
api_router.include_router(categories.router, prefix="/categories", tags=["categories"])
api_router.include_router(products.router, prefix="/products", tags=["products"])
api_router.include_router(inventory.router, prefix="/inventory", tags=["inventory"])
api_router.include_router(cart.router, prefix="/cart", tags=["cart"])
api_router.include_router(orders.router, prefix="/orders", tags=["orders"])
api_router.include_router(payments.router, prefix="/payments", tags=["payments"])
api_router.include_router(checkout.router, prefix="/checkout", tags=["checkout"])
api_router.include_router(reviews.router, prefix="/reviews", tags=["reviews"])
api_router.include_router(wishlist.router, prefix="/wishlist", tags=["wishlist"])
