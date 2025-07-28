from fastapi import APIRouter, HTTPException, Query
from typing import Optional

from app.api.deps import CurrentUser, SessionDep
from app.models.models import (
    APIResponseWithData,
    APIResponseWithList,
    APIKeyCreate,
    APIKeyUpdate,
    APIKeyPublic,
    APIKeysPublic,
    Message,
)
from app import crud

router = APIRouter(prefix="/api-keys", tags=["api-keys"])


@router.post("/", response_model=APIResponseWithData[APIKeyPublic], status_code=201)
def create_api_key(
    *, session: SessionDep, current_user: CurrentUser, api_key_in: APIKeyCreate
):
    """创建新的API Key"""
    try:
        api_key = crud.create_api_key(
            session=session, api_key_in=api_key_in, owner_id=current_user.id
        )
        return APIResponseWithData(success=True, data=api_key)
    except Exception as e:
        return APIResponseWithData(
            success=False, error=f"创建API Key失败: {str(e)}", data=None
        )


@router.get("/", response_model=APIResponseWithList[APIKeyPublic])
def get_my_api_keys(
    session: SessionDep,
    current_user: CurrentUser,
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=1000),
):
    """获取当前用户的API Key列表"""
    try:
        api_keys = crud.get_user_api_keys(session=session, owner_id=current_user.id)
        
        # 应用分页
        total_count = len(api_keys)
        paginated_keys = api_keys[skip : skip + limit]
        
        return APIResponseWithList(
            success=True,
            data=paginated_keys,
            count=total_count,
            skip=skip,
            limit=limit,
        )
    except Exception as e:
        return APIResponseWithList(
            success=False,
            error=f"获取API Key列表失败: {str(e)}",
            data=[],
            count=0,
            skip=skip,
            limit=limit,
        )


@router.patch("/{api_key_id}", response_model=APIResponseWithData[APIKeyPublic])
def update_api_key(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    api_key_id: str,
    api_key_in: APIKeyUpdate,
):
    """更新API Key"""
    try:
        # 查找API Key
        from app.models.models import APIKey
        api_key = session.get(APIKey, api_key_id)
        if not api_key:
            return APIResponseWithData(
                success=False, error="API Key不存在", data=None
            )
        
        # 检查所有权
        if api_key.owner_id != current_user.id:
            return APIResponseWithData(
                success=False, error="无权限操作此API Key", data=None
            )
        
        # 更新API Key
        updated_api_key = crud.update_api_key(
            session=session, db_api_key=api_key, api_key_in=api_key_in
        )
        return APIResponseWithData(success=True, data=updated_api_key)
    except Exception as e:
        return APIResponseWithData(
            success=False, error=f"更新API Key失败: {str(e)}", data=None
        )


@router.delete("/{api_key_id}", response_model=APIResponseWithData[Message])
def delete_api_key(
    *, session: SessionDep, current_user: CurrentUser, api_key_id: str
):
    """删除API Key"""
    try:
        # 查找API Key
        from app.models.models import APIKey
        api_key = session.get(APIKey, api_key_id)
        if not api_key:
            return APIResponseWithData(
                success=False, error="API Key不存在", data=None
            )
        
        # 检查所有权
        if api_key.owner_id != current_user.id:
            return APIResponseWithData(
                success=False, error="无权限操作此API Key", data=None
            )
        
        # 删除API Key
        crud.delete_api_key(session=session, api_key=api_key)
        return APIResponseWithData(
            success=True, data=Message(message="API Key删除成功")
        )
    except Exception as e:
        return APIResponseWithData(
            success=False, error=f"删除API Key失败: {str(e)}", data=None
        )