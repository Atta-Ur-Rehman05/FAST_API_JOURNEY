from typing import Generic, TypeVar

from pydantic import BaseModel


ItemT = TypeVar("ItemT")


class PaginatedResponse(BaseModel, Generic[ItemT]):
    items: list[ItemT]
    total: int
    page: int
    page_size: int
    next_page: int | None

    @classmethod
    def create(cls, *, items: list[ItemT], total: int, skip: int, limit: int):
        page = skip // limit + 1
        return cls(
            items=items,
            total=total,
            page=page,
            page_size=limit,
            next_page=page + 1 if skip + len(items) < total else None,
        )
