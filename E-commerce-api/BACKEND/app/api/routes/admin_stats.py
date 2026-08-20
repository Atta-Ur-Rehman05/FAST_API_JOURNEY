from typing import Annotated
from collections import defaultdict

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import func, extract
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import SessionDep, get_current_admin_user
from app.models.models import User, Order, OrderStatus, OrderItem
from app.schemas.pagination import PaginatedResponse

router = APIRouter()


@router.get("/monthly", status_code=status.HTTP_200_OK)
async def get_monthly_stats(
    session: SessionDep,
    _: Annotated[User, Depends(get_current_admin_user)],
    year: int = Query(..., ge=2000, le=2100),
):
    # Monthly user registrations
    users_by_month = (
        await session.execute(
            select(
                extract("month", User.created_at).label("month"),
                func.count(User.id).label("count"),
            )
            .where(extract("year", User.created_at) == year)
            .group_by(extract("month", User.created_at))
        )
    ).fetchall()

    # Monthly sales (sum of order totals for non-cancelled/non-failed orders)
    sales_by_month = (
        await session.execute(
            select(
                extract("month", Order.created_at).label("month"),
                func.coalesce(func.sum(Order.total_amount), 0).label("total"),
            )
            .where(
                extract("year", Order.created_at) == year,
                Order.order_status.notin_(["cancelled", "failed", "draft"]),
            )
            .group_by(extract("month", Order.created_at))
        )
    ).fetchall()

    users_map = {int(row[0]): int(row[1]) for row in users_by_month}
    sales_map = {int(row[0]): float(row[2]) for row in sales_by_month}

    month_names = ["JAN", "FEB", "MAR", "APRIL", "MAY", "JUNE", "JULY", "AUG", "SEPT", "OCT", "NOV", "DEC"]
    monthly_data = []
    for m in range(1, 13):
        monthly_data.append({
            "month": month_names[m - 1],
            "users": users_map.get(m, 0),
            "sales": sales_map.get(m, 0),
        })

    return {"year": year, "monthly": monthly_data}
