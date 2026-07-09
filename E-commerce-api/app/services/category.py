from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.models import Category
from app.repositories.category import CategoryRepository
from app.schemas.category import CategoryCreate, CategoryTreeResponse, CategoryUpdate


class CategoryServiceError(Exception):
    def __init__(self, detail: str):
        self.detail = detail
        super().__init__(detail)


class CategoryNotFoundError(CategoryServiceError):
    pass


class ParentCategoryNotFoundError(CategoryServiceError):
    pass


class DuplicateCategorySlugError(CategoryServiceError):
    pass


class InvalidCategoryParentError(CategoryServiceError):
    pass


class CategoryDeleteRestrictedError(CategoryServiceError):
    pass


class CategoryService:
    def __init__(self, session: AsyncSession):
        self.category_repo = CategoryRepository(session)

    async def list_categories(
        self,
        *,
        skip: int = 0,
        limit: int = 100,
        parent_id: Optional[int] = None,
        root_only: bool = False,
        search: Optional[str] = None,
    ) -> list[Category]:
        return await self.category_repo.list(
            skip=skip,
            limit=limit,
            parent_id=parent_id,
            root_only=root_only,
            search=search,
        )

    async def get_category_tree(self) -> list[CategoryTreeResponse]:
        categories = await self.category_repo.list_all()
        return self._build_category_tree(categories)

    async def create_category(self, category_in: CategoryCreate) -> Category:
        existing_category = await self.category_repo.get_by_slug(category_in.slug)
        if existing_category:
            raise DuplicateCategorySlugError("A category with this slug already exists.")

        await self._validate_parent(category_in.parent_id)
        return await self.category_repo.create(category_in)

    async def get_category(self, category_id: int) -> Category:
        category = await self.category_repo.get_by_id(category_id)
        if category is None:
            raise CategoryNotFoundError("Category not found.")
        return category

    async def update_category(
        self, category_id: int, category_in: CategoryUpdate
    ) -> Category:
        category = await self.get_category(category_id)

        if category_in.slug is not None:
            existing_category = await self.category_repo.get_by_slug(category_in.slug)
            if existing_category and existing_category.id != category_id:
                raise DuplicateCategorySlugError(
                    "A category with this slug already exists."
                )

        await self._validate_parent(category_in.parent_id, category_id=category_id)
        return await self.category_repo.update(category, category_in)

    async def delete_category(self, category_id: int) -> None:
        category = await self.get_category(category_id)

        if await self.category_repo.has_children(category_id):
            raise CategoryDeleteRestrictedError(
                "Cannot delete a category that has child categories."
            )

        if await self.category_repo.has_products(category_id):
            raise CategoryDeleteRestrictedError(
                "Cannot delete a category that has products."
            )

        await self.category_repo.delete(category)

    async def _validate_parent(
        self,
        parent_id: Optional[int],
        *,
        category_id: Optional[int] = None,
    ) -> None:
        if parent_id is None:
            return

        if category_id is not None and parent_id == category_id:
            raise InvalidCategoryParentError("A category cannot be its own parent.")

        parent = await self.category_repo.get_by_id(parent_id)
        if parent is None:
            raise ParentCategoryNotFoundError("Parent category not found.")

        if category_id is not None and await self.category_repo.would_create_cycle(
            category_id, parent_id
        ):
            raise InvalidCategoryParentError(
                "A category cannot be moved under one of its descendants."
            )

    def _build_category_tree(
        self, categories: list[Category]
    ) -> list[CategoryTreeResponse]:
        category_map = {
            category.id: CategoryTreeResponse(
                id=category.id,
                name=category.name,
                slug=category.slug,
                parent_id=category.parent_id,
                children=[],
            )
            for category in categories
        }
        roots = []

        for category in categories:
            node = category_map[category.id]
            if category.parent_id and category.parent_id in category_map:
                category_map[category.parent_id].children.append(node)
            else:
                roots.append(node)

        return roots
