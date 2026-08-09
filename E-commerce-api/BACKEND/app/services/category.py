# this file contain the category service logic
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.models import Category
from app.repositories.category import CategoryRepository
from app.schemas.category import CategoryCreate, CategoryTreeResponse, CategoryUpdate


class CategoryServiceError(Exception):  # base class for all category service errors
    def __init__(self, detail: str):
        self.detail = detail
        super().__init__(detail)


class CategoryNotFoundError(CategoryServiceError):  # raised when a category is not found
    pass


class ParentCategoryNotFoundError(CategoryServiceError):  # raised when a parent category is not found
    pass


class DuplicateCategorySlugError(CategoryServiceError):  # raised when a category with the same slug already exists
    pass


class InvalidCategoryParentError(CategoryServiceError):  # raised when a category cannot be its own parent or a descendant
    pass


class CategoryDeleteRestrictedError(CategoryServiceError):  # raised when a category cannot be deleted because it has child categories or products
    pass


class CategoryService:
    def __init__(self, session: AsyncSession):  # initialize the category service with the session
        self.category_repo = CategoryRepository(session)

    # list all categories
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

    # get category tree
    async def get_category_tree(self) -> list[CategoryTreeResponse]:
        categories = await self.category_repo.list_all()
        return self._build_category_tree(categories)

    # count categories
    async def count_categories(self, **filters) -> int:
        return await self.category_repo.count(**filters)

    # create category
    async def create_category(self, category_in: CategoryCreate) -> Category:
        existing_category = await self.category_repo.get_by_slug(category_in.slug)
        if existing_category:
            raise DuplicateCategorySlugError("A category with this slug already exists.")

        await self._validate_parent(category_in.parent_id)
        return await self.category_repo.create(category_in)

    # get category by id
    async def get_category(self, category_id: int) -> Category:
        category = await self.category_repo.get_by_id(category_id)
        if category is None:
            raise CategoryNotFoundError("Category not found.")
        return category

    # update category
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

    # delete category
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

    # validate parent
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

    # build category tree    , this algorithm is O(n)
    def _build_category_tree(
        self, categories: list[Category]
    ) -> list[CategoryTreeResponse]:
        category_map = {                                # create a map of categories
            category.id: CategoryTreeResponse(
                id=category.id,
                name=category.name,
                slug=category.slug,
                parent_id=category.parent_id,
                children=[],
            )
            for category in categories
        }
        roots = []   # list of root categories

        for category in categories:
            node = category_map[category.id]  # get the node from the map
            if category.parent_id and category.parent_id in category_map:
                category_map[category.parent_id].children.append(node)  # append the node to its parent
            else:
                roots.append(node)  # append the node to the roots list

        return roots
