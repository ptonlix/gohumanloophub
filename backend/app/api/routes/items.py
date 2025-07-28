import uuid
from typing import Any

from fastapi import APIRouter
from sqlmodel import func, select

from app.api.deps import CurrentUser, SessionDep
from app.models.models import (
    Item,
    ItemCreate,
    ItemPublic,
    ItemUpdate,
    APIResponseWithData,
    APIResponseWithList,
)

router = APIRouter(prefix="/items", tags=["items"])


@router.get("/", response_model=APIResponseWithList[ItemPublic])
def read_items(
    session: SessionDep, current_user: CurrentUser, skip: int = 0, limit: int = 100
) -> Any:
    """
    Retrieve items.
    """

    try:
        if current_user.is_superuser:
            count_statement = select(func.count()).select_from(Item)
            count = session.exec(count_statement).one()
            statement = select(Item).offset(skip).limit(limit)
            items = session.exec(statement).all()
        else:
            count_statement = (
                select(func.count())
                .select_from(Item)
                .where(Item.owner_id == current_user.id)
            )
            count = session.exec(count_statement).one()
            statement = (
                select(Item)
                .where(Item.owner_id == current_user.id)
                .offset(skip)
                .limit(limit)
            )
            items = session.exec(statement).all()

        # 转换为ItemPublic
        items_public = [ItemPublic.model_validate(item) for item in items]

        return APIResponseWithList(
            success=True, data=items_public, count=count, skip=skip, limit=limit
        )
    except Exception as e:
        return APIResponseWithList(
            success=False, error=str(e), data=[], count=0, skip=skip, limit=limit
        )


@router.get("/{id}", response_model=APIResponseWithData[ItemPublic])
def read_item(session: SessionDep, current_user: CurrentUser, id: uuid.UUID) -> Any:
    """
    Get item by ID.
    """
    try:
        item = session.get(Item, id)
        if not item:
            return APIResponseWithData(success=False, error="Item not found", data=None)
        if not current_user.is_superuser and (item.owner_id != current_user.id):
            return APIResponseWithData(
                success=False, error="Not enough permissions", data=None
            )

        item_public = ItemPublic.model_validate(item)
        return APIResponseWithData(success=True, data=item_public)
    except Exception as e:
        return APIResponseWithData(success=False, error=str(e), data=None)


@router.post("/", response_model=APIResponseWithData[ItemPublic])
def create_item(
    *, session: SessionDep, current_user: CurrentUser, item_in: ItemCreate
) -> Any:
    """
    Create new item.
    """
    try:
        item = Item.model_validate(item_in, update={"owner_id": current_user.id})
        session.add(item)
        session.commit()
        session.refresh(item)

        item_public = ItemPublic.model_validate(item)
        return APIResponseWithData(success=True, data=item_public)
    except Exception as e:
        return APIResponseWithData(success=False, error=str(e), data=None)


@router.put("/{id}", response_model=APIResponseWithData[ItemPublic])
def update_item(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    id: uuid.UUID,
    item_in: ItemUpdate,
) -> Any:
    """
    Update an item.
    """
    try:
        item = session.get(Item, id)
        if not item:
            return APIResponseWithData(success=False, error="Item not found", data=None)
        if not current_user.is_superuser and (item.owner_id != current_user.id):
            return APIResponseWithData(
                success=False, error="Not enough permissions", data=None
            )

        update_dict = item_in.model_dump(exclude_unset=True)
        item.sqlmodel_update(update_dict)
        session.add(item)
        session.commit()
        session.refresh(item)

        item_public = ItemPublic.model_validate(item)
        return APIResponseWithData(success=True, data=item_public)
    except Exception as e:
        return APIResponseWithData(success=False, error=str(e), data=None)


@router.delete("/{id}", response_model=APIResponseWithData[ItemPublic])
def delete_item(session: SessionDep, current_user: CurrentUser, id: uuid.UUID) -> Any:
    """
    Delete an item.
    """
    try:
        item = session.get(Item, id)
        if not item:
            return APIResponseWithData(success=False, error="Item not found", data=None)
        if not current_user.is_superuser and (item.owner_id != current_user.id):
            return APIResponseWithData(
                success=False, error="Not enough permissions", data=None
            )

        session.delete(item)
        session.commit()

        return APIResponseWithData(
            success=True, data={"message": "Item deleted successfully"}
        )
    except Exception as e:
        return APIResponseWithData(success=False, error=str(e), data=None)
