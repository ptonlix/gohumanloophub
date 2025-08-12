from typing import Any

from fastapi import APIRouter, HTTPException, Query

from app import crud
from app.api.deps import CurrentUserByAPIKey, SessionDep
from app.models.models import (
    APIResponse,
    HumanLoopCancelConversationRequest,
    HumanLoopCancelRequest,
    HumanLoopContinueRequest,
    HumanLoopRequestCreate,
    HumanLoopRequestUpdate,
    HumanLoopStatusResponse,
)

router = APIRouter(prefix="/humanloop", tags=["humanloop"])


@router.post("/request", response_model=APIResponse)
def create_humanloop_request(
    *,
    session: SessionDep,
    current_user: CurrentUserByAPIKey,
    request_in: HumanLoopRequestCreate,
) -> Any:
    """
    创建人机循环请求
    """
    try:
        # 检查是否已存在相同的请求
        existing_request = crud.get_humanloop_request(
            session=session,
            conversation_id=request_in.conversation_id,
            request_id=request_in.request_id,
            platform=request_in.platform,
            owner_id=current_user.id,
        )

        if existing_request:
            return APIResponse(success=False, error="Request already exists")

        # 创建新的人机循环请求
        crud.create_humanloop_request(
            session=session, request_in=request_in, owner_id=current_user.id
        )

        return APIResponse(success=True)

    except Exception as e:
        return APIResponse(success=False, error=str(e))


@router.get("/status", response_model=HumanLoopStatusResponse)
def get_humanloop_status(
    *,
    session: SessionDep,
    current_user: CurrentUserByAPIKey,
    conversation_id: str = Query(..., description="对话ID"),
    request_id: str = Query(..., description="请求ID"),
    platform: str = Query(..., description="平台"),
) -> Any:
    """
    查询请求状态
    """
    try:
        # 查找请求
        humanloop_request = crud.get_humanloop_request(
            session=session,
            conversation_id=conversation_id,
            request_id=request_id,
            platform=platform,
            owner_id=current_user.id,
        )

        if not humanloop_request:
            raise HTTPException(status_code=404, detail="Request not found")

        return HumanLoopStatusResponse(
            success=True,
            status=humanloop_request.status,
            response=humanloop_request.response,
            feedback=humanloop_request.feedback,
            responded_by=humanloop_request.responded_by,
            responded_at=humanloop_request.responded_at,
        )

    except HTTPException:
        raise
    except Exception as e:
        return HumanLoopStatusResponse(
            success=False,
            status="error",
            response=None,
            feedback=str(e),
            responded_by=None,
            responded_at=None,
        )


@router.post("/cancel", response_model=APIResponse)
def cancel_humanloop_request(
    *,
    session: SessionDep,
    current_user: CurrentUserByAPIKey,
    cancel_request: HumanLoopCancelRequest,
) -> Any:
    """
    取消单个请求
    """
    try:
        # 查找请求
        humanloop_request = crud.get_humanloop_request(
            session=session,
            conversation_id=cancel_request.conversation_id,
            request_id=cancel_request.request_id,
            platform=cancel_request.platform,
            owner_id=current_user.id,
        )

        if not humanloop_request:
            return APIResponse(success=False, error="Request not found")

        # 只有pending状态的请求可以被取消
        if humanloop_request.status != "pending":
            return APIResponse(
                success=False,
                error=f"Cannot cancel request with status: {humanloop_request.status}",
            )

        # 取消请求
        crud.cancel_humanloop_request(session=session, db_request=humanloop_request)

        return APIResponse(success=True)

    except Exception as e:
        return APIResponse(success=False, error=str(e))


@router.post("/cancel_conversation", response_model=APIResponse)
def cancel_humanloop_conversation(
    *,
    session: SessionDep,
    current_user: CurrentUserByAPIKey,
    cancel_request: HumanLoopCancelConversationRequest,
) -> Any:
    """
    取消整个对话
    """
    try:
        # 取消该对话下所有pending状态的请求
        cancelled_count = crud.cancel_conversation_requests(
            session=session,
            conversation_id=cancel_request.conversation_id,
            platform=cancel_request.platform,
            owner_id=current_user.id,
        )

        if cancelled_count == 0:
            return APIResponse(
                success=False, error="No pending requests found for this conversation"
            )

        return APIResponse(success=True)

    except Exception as e:
        return APIResponse(success=False, error=str(e))


@router.post("/continue", response_model=APIResponse)
def continue_humanloop_request(
    *,
    session: SessionDep,
    current_user: CurrentUserByAPIKey,
    continue_request: HumanLoopContinueRequest,
) -> Any:
    """
    继续对话请求
    """
    try:
        # 查找现有请求
        existing_request = crud.get_humanloop_request(
            session=session,
            conversation_id=continue_request.conversation_id,
            request_id=continue_request.request_id,
            platform=continue_request.platform,
            owner_id=current_user.id,
        )

        if existing_request:
            # 更新现有请求
            update_data = HumanLoopRequestUpdate(
                status="pending"
                if existing_request.status in ["completed", "cancelled"]
                else existing_request.status,
                response=None
                if existing_request.status in ["completed", "cancelled"]
                else existing_request.response,
                feedback=None
                if existing_request.status in ["completed", "cancelled"]
                else existing_request.feedback,
                responded_by=None
                if existing_request.status in ["completed", "cancelled"]
                else existing_request.responded_by,
                responded_at=None
                if existing_request.status in ["completed", "cancelled"]
                else existing_request.responded_at,
            )

            # 更新任务ID、上下文和元数据
            existing_request.task_id = continue_request.task_id
            existing_request.context = continue_request.context
            existing_request.metadata_ = continue_request.metadata_

            crud.update_humanloop_request(
                session=session, db_request=existing_request, request_in=update_data
            )
        else:
            # 创建新的请求
            new_request_data = HumanLoopRequestCreate(
                task_id=continue_request.task_id,
                conversation_id=continue_request.conversation_id,
                request_id=continue_request.request_id,
                loop_type="conversation",  # 默认为conversation类型
                platform=continue_request.platform,
                context=continue_request.context,
                metadata=continue_request.metadata,  # pyright: ignore[reportArgumentType]
            )

            crud.create_humanloop_request(
                session=session, request_in=new_request_data, owner_id=current_user.id
            )

        return APIResponse(success=True)

    except Exception as e:
        return APIResponse(success=False, error=str(e))
