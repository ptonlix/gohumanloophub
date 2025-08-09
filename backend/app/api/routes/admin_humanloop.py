from typing import Any, List
from datetime import datetime
import uuid

from fastapi import APIRouter, Query, HTTPException
from sqlmodel import select, and_, or_, desc

from app.api.deps import SessionDep, CurrentUser
from app.models.models import (
    HumanLoopRequestUpdate,
    HumanLoopRequestPublic,
    APIResponse,
    APIResponseWithData,
    APIResponseWithList,
)
from app import crud

router = APIRouter(prefix="/admin/humanloop", tags=["admin-humanloop"])


# 管理后台专用的请求模型
from pydantic import BaseModel
from sqlmodel import SQLModel, Field
from sqlalchemy.types import JSON


class AdminHumanLoopApprovalRequest(SQLModel):
    """审批模式处理请求"""
    request_id: str = Field(description="请求ID")
    action: str = Field(description="操作: approved | rejected")
    feedback: str | None = Field(default=None, description="审批意见")
    response: dict | None = Field(default=None, sa_type=JSON, description="响应数据")


class AdminHumanLoopInformationRequest(SQLModel):
    """信息获取模式处理请求"""
    request_id: str = Field(description="请求ID")
    response: dict = Field(sa_type=JSON, description="获取到的信息")
    feedback: str | None = Field(default=None, description="备注信息")


class AdminHumanLoopConversationRequest(SQLModel):
    """对话模式处理请求"""
    request_id: str = Field(description="请求ID")
    response: dict = Field(sa_type=JSON, description="对话回复内容")
    feedback: str | None = Field(default=None, description="备注信息")
    is_complete: bool = Field(default=False, description="对话是否完成: true-完成对话(completed), false-继续对话(inprogress)")


class AdminHumanLoopBatchRequest(SQLModel):
    """批量处理请求"""
    request_ids: List[str] = Field(description="请求ID列表")
    action: str = Field(description="批量操作: approved | rejected | cancelled")
    feedback: str | None = Field(default=None, description="批量操作备注")


@router.get("/requests", response_model=APIResponseWithList[HumanLoopRequestPublic])
def get_admin_humanloop_requests(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    loop_type: str | None = Query(None, description="循环类型过滤: conversation | approval | information"),
    status: str | None = Query(None, description="状态过滤: pending | approved | rejected | completed | cancelled"),
    platform: str | None = Query(None, description="平台过滤: wechat | feishu | other"),
    created_at_start: str | None = Query(None, description="创建时间开始过滤 (YYYY-MM-DD)"),
    created_at_end: str | None = Query(None, description="创建时间结束过滤 (YYYY-MM-DD)"),
    skip: int = Query(0, description="跳过记录数"),
    limit: int = Query(100, description="返回记录数")
) -> Any:
    """
    获取管理后台人机循环请求列表
    """
    try:
        # 使用CRUD方法获取数据
        requests = crud.get_humanloop_requests_with_filters(
            session=session,
            loop_type=loop_type,
            status=status,
            platform=platform,
            created_at_start=created_at_start,
            created_at_end=created_at_end,
            skip=skip,
            limit=limit
        )
        
        # 获取总数
        total_count = crud.count_humanloop_requests_with_filters(
            session=session,
            loop_type=loop_type,
            status=status,
            platform=platform,
            created_at_start=created_at_start,
            created_at_end=created_at_end
        )
        
        return APIResponseWithList(
            success=True,
            data=[HumanLoopRequestPublic.model_validate(req) for req in requests],
            count=total_count,
            skip=skip,
            limit=limit
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/requests/{request_id}", response_model=APIResponseWithData[HumanLoopRequestPublic])
def get_admin_humanloop_request(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    request_id: str
) -> Any:
    """
    获取单个人机循环请求详情
    """
    try:
        # 通过UUID查找请求
        try:
            request_uuid = uuid.UUID(request_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid request ID format")
            
        humanloop_request = crud.get_humanloop_request_by_id(
            session=session,
            request_id=request_uuid
        )
        
        if not humanloop_request:
            raise HTTPException(status_code=404, detail="Request not found")
        
        return APIResponseWithData(
            success=True,
            data=HumanLoopRequestPublic.model_validate(humanloop_request)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/approval", response_model=APIResponse)
def handle_approval_request(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    approval_request: AdminHumanLoopApprovalRequest
) -> Any:
    """
    处理审批模式请求
    """
    try:
        # 查找请求
        try:
            request_uuid = uuid.UUID(approval_request.request_id)
        except ValueError:
            return APIResponse(success=False, error="Invalid request ID format")
            
        humanloop_request = crud.get_humanloop_request_by_id(
            session=session,
            request_id=request_uuid
        )
        
        if not humanloop_request:
            return APIResponse(success=False, error="Request not found")
        
        # 检查请求类型
        if humanloop_request.loop_type != "approval":
            return APIResponse(
                success=False,
                error=f"Request type mismatch. Expected 'approval', got '{humanloop_request.loop_type}'"
            )
        
        # 检查请求状态
        if humanloop_request.status not in ["pending", "inprogress"]:
            return APIResponse(
                success=False,
                error=f"Cannot process request with status: {humanloop_request.status}"
            )
        
        # 验证操作类型
        if approval_request.action not in ["approved", "rejected"]:
            return APIResponse(
                success=False,
                error="Invalid action. Must be 'approved' or 'rejected'"
            )
        
        # 更新请求
        update_data = HumanLoopRequestUpdate(
            status=approval_request.action,
            response=approval_request.response,
            feedback=approval_request.feedback,
            responded_by=current_user.full_name or current_user.email,
            responded_at=datetime.utcnow()
        )
        
        crud.update_humanloop_request(
            session=session,
            db_request=humanloop_request,
            request_in=update_data
        )
        
        return APIResponse(success=True)
        
    except Exception as e:
        return APIResponse(success=False, error=str(e))


@router.post("/information", response_model=APIResponse)
def handle_information_request(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    info_request: AdminHumanLoopInformationRequest
) -> Any:
    """
    处理信息获取模式请求
    """
    try:
        # 查找请求
        try:
            request_uuid = uuid.UUID(info_request.request_id)
        except ValueError:
            return APIResponse(success=False, error="Invalid request ID format")
            
        humanloop_request = crud.get_humanloop_request_by_id(
            session=session,
            request_id=request_uuid
        )
        
        if not humanloop_request:
            return APIResponse(success=False, error="Request not found")
        
        # 检查请求类型
        if humanloop_request.loop_type != "information":
            return APIResponse(
                success=False,
                error=f"Request type mismatch. Expected 'information', got '{humanloop_request.loop_type}'"
            )
        
        # 检查请求状态
        if humanloop_request.status not in ["pending", "inprogress"]:
            return APIResponse(
                success=False,
                error=f"Cannot process request with status: {humanloop_request.status}"
            )
        
        # 更新请求
        update_data = HumanLoopRequestUpdate(
            status="completed",
            response=info_request.response,
            feedback=info_request.feedback,
            responded_by=current_user.full_name or current_user.email,
            responded_at=datetime.utcnow()
        )
        
        crud.update_humanloop_request(
            session=session,
            db_request=humanloop_request,
            request_in=update_data
        )
        
        return APIResponse(success=True)
        
    except Exception as e:
        return APIResponse(success=False, error=str(e))


@router.post("/conversation", response_model=APIResponse)
def handle_conversation_request(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    conv_request: AdminHumanLoopConversationRequest
) -> Any:
    """
    处理对话模式请求
    """
    try:
        # 查找请求
        try:
            request_uuid = uuid.UUID(conv_request.request_id)
        except ValueError:
            return APIResponse(success=False, error="Invalid request ID format")
            
        humanloop_request = crud.get_humanloop_request_by_id(
            session=session,
            request_id=request_uuid
        )
        
        if not humanloop_request:
            return APIResponse(success=False, error="Request not found")
        
        # 检查请求类型
        if humanloop_request.loop_type != "conversation":
            return APIResponse(
                success=False,
                error=f"Request type mismatch. Expected 'conversation', got '{humanloop_request.loop_type}'"
            )
        
        # 检查请求状态
        if humanloop_request.status not in ["pending", "inprogress"]:
            return APIResponse(
                success=False,
                error=f"Cannot process request with status: {humanloop_request.status}"
            )
        
        # 根据is_complete字段决定状态
        new_status = "completed" if conv_request.is_complete else "inprogress"
        
        # 更新请求
        update_data = HumanLoopRequestUpdate(
            status=new_status,
            response=conv_request.response,
            feedback=conv_request.feedback,
            responded_by=current_user.full_name or current_user.email,
            responded_at=datetime.utcnow()
        )
        
        crud.update_humanloop_request(
            session=session,
            db_request=humanloop_request,
            request_in=update_data
        )
        
        return APIResponse(success=True)
        
        
    except Exception as e:
        return APIResponse(success=False, error=str(e))


@router.post("/batch", response_model=APIResponse)
def handle_batch_requests(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    batch_request: AdminHumanLoopBatchRequest
) -> Any:
    """
    批量处理人机循环请求
    """
    try:
        if not batch_request.request_ids:
            return APIResponse(success=False, error="Request IDs cannot be empty")
        
        # 验证操作类型
        if batch_request.action not in ["approved", "rejected", "cancelled"]:
            return APIResponse(
                success=False,
                error="Invalid action. Must be 'approved', 'rejected', or 'cancelled'"
            )
        
        processed_count = 0
        errors = []
        
        for request_id in batch_request.request_ids:
            try:
                # 查找请求
                try:
                    request_uuid = uuid.UUID(request_id)
                except ValueError:
                    errors.append(f"Invalid request ID format: {request_id}")
                    continue
                    
                humanloop_request = crud.get_humanloop_request_by_id(
                    session=session,
                    request_id=request_uuid
                )
                
                if not humanloop_request:
                    errors.append(f"Request {request_id} not found")
                    continue
                
                # 检查请求状态
                if humanloop_request.status not in ["pending", "inprogress"]:
                    errors.append(f"Request {request_id} cannot be processed with status: {humanloop_request.status}")
                    continue
                
                # 更新请求
                update_data = HumanLoopRequestUpdate(
                    status=batch_request.action,
                    feedback=batch_request.feedback,
                    responded_by=current_user.full_name or current_user.email,
                    responded_at=datetime.utcnow()
                )
                
                crud.update_humanloop_request(
                    session=session,
                    db_request=humanloop_request,
                    request_in=update_data
                )
                
                processed_count += 1
                
            except Exception as e:
                errors.append(f"Error processing request {request_id}: {str(e)}")
        
        if errors:
            return APIResponse(
                success=processed_count > 0,
                error=f"Processed {processed_count} requests. Errors: {'; '.join(errors)}"
            )
        
        return APIResponse(success=True)
        
    except Exception as e:
        return APIResponse(success=False, error=str(e))


@router.post("/requests/{request_id}/status", response_model=APIResponse)
def update_request_status(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    request_id: str,
    status: str = Query(..., description="新状态: pending | inprogress | completed | cancelled")
) -> Any:
    """
    更新请求状态（用于管理员手动调整状态）
    """
    try:
        # 验证状态值
        valid_statuses = ["pending", "inprogress", "completed", "cancelled", "approved", "rejected", "error", "expired"]
        if status not in valid_statuses:
            return APIResponse(
                success=False,
                error=f"Invalid status. Must be one of: {', '.join(valid_statuses)}"
            )
        
        # 查找请求
        try:
            request_uuid = uuid.UUID(request_id)
        except ValueError:
            return APIResponse(success=False, error="Invalid request ID format")
            
        humanloop_request = crud.get_humanloop_request_by_id(
            session=session,
            request_id=request_uuid
        )
        
        if not humanloop_request:
            return APIResponse(success=False, error="Request not found")
        
        # 更新状态
        update_data = HumanLoopRequestUpdate(
            status=status,
            responded_by=current_user.full_name or current_user.email,
            responded_at=datetime.utcnow()
        )
        
        crud.update_humanloop_request(
            session=session,
            db_request=humanloop_request,
            request_in=update_data
        )
        
        return APIResponse(success=True)
        
    except Exception as e:
        return APIResponse(success=False, error=str(e))


@router.get("/stats", response_model=APIResponseWithData[dict])
def get_humanloop_stats(
    *,
    session: SessionDep,
    current_user: CurrentUser
) -> Any:
    """
    获取人机循环统计信息
    """
    try:
        # 使用CRUD方法获取统计信息
        stats = crud.get_humanloop_stats(session=session)
        
        return APIResponseWithData(
            success=True,
            data=stats
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))