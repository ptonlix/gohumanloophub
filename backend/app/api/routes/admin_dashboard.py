from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import desc, func, select

from app.api.deps import (
    MongoDep,
    SessionDep,
    get_current_active_admin,
    get_current_active_superuser,
)
from app.models.models import APIResponseWithData, HumanLoopRequest, User

router = APIRouter(prefix="/humanloop/admin/dashboard", tags=["admin_dashboard"])


class DashboardStats:
    """Dashboard统计数据模型"""

    def __init__(self) -> None:
        self.total_tasks = 0
        self.total_conversations = 0
        self.total_requests = 0
        self.total_users = 0
        self.total_human_loop_requests = 0
        self.human_loop_by_status: dict[str, int] = {}
        self.human_loop_by_type: dict[str, int] = {}
        self.human_loop_by_platform: dict[str, int] = {}
        self.recent_tasks: list[dict[str, Any]] = []
        self.recent_human_loop_requests: list[dict[str, Any]] = []


@router.get(
    "/stats",
    dependencies=[Depends(get_current_active_superuser)],
    response_model=APIResponseWithData[dict[str, Any]],
)
async def get_dashboard_stats(
    db: MongoDep,
    session: SessionDep,
) -> APIResponseWithData[dict[str, Any]]:
    """获取Dashboard统计数据（超级管理员权限）"""
    try:
        stats = DashboardStats()

        # 1. 获取任务统计数据
        tasks_cursor = db.tasks.find({})
        tasks_list = list(tasks_cursor)
        stats.total_tasks = len(tasks_list)

        # 统计对话和请求数量
        for task in tasks_list:
            if "conversations" in task and task["conversations"]:
                stats.total_conversations += len(task["conversations"])
                for conv in task["conversations"]:
                    if "requests" in conv and conv["requests"]:
                        stats.total_requests += len(conv["requests"])

        # 获取最近的任务（最多5个）
        recent_tasks_cursor = db.tasks.find({}).sort("created_at", -1).limit(5)
        stats.recent_tasks = []
        for task in recent_tasks_cursor:
            task["_id"] = str(task["_id"])
            stats.recent_tasks.append(
                {
                    "task_id": task.get("task_id", ""),
                    "created_at": task.get("created_at", ""),
                    "conversations_count": len(task.get("conversations", [])),
                    "total_requests": sum(
                        len(conv.get("requests", []))
                        for conv in task.get("conversations", [])
                    ),
                }
            )

        # 2. 获取用户统计数据
        total_users_count = session.exec(select(func.count()).select_from(User)).first()
        stats.total_users = total_users_count or 0

        # 3. 获取人机协同请求统计数据
        # 总数量
        total_human_loop_count = session.exec(
            select(func.count()).select_from(HumanLoopRequest)
        ).first()
        stats.total_human_loop_requests = total_human_loop_count or 0

        # 按状态分组统计
        status_stats = session.exec(
            select(HumanLoopRequest.status, func.count()).group_by(
                HumanLoopRequest.status
            )
        ).all()
        stats.human_loop_by_status = dict(status_stats)

        # 按类型分组统计
        type_stats = session.exec(
            select(HumanLoopRequest.loop_type, func.count()).group_by(
                HumanLoopRequest.loop_type
            )
        ).all()
        stats.human_loop_by_type = dict(type_stats)

        # 按平台分组统计
        platform_stats = session.exec(
            select(HumanLoopRequest.platform, func.count()).group_by(
                HumanLoopRequest.platform
            )
        ).all()
        stats.human_loop_by_platform = dict(platform_stats)

        # 获取最近的人机协同请求（最多5个）
        recent_human_loop_requests = session.exec(
            select(HumanLoopRequest)
            .order_by(desc(HumanLoopRequest.created_at))
            .limit(5)
        ).all()

        stats.recent_human_loop_requests = [
            {
                "id": str(req.id),
                "task_id": req.task_id,
                "conversation_id": req.conversation_id,
                "loop_type": req.loop_type,
                "platform": req.platform,
                "status": req.status,
                "created_at": req.created_at.isoformat() if req.created_at else None,
                "responded_at": req.responded_at.isoformat()
                if req.responded_at
                else None,
            }
            for req in recent_human_loop_requests
        ]

        # 构建响应数据
        dashboard_data = {
            "tasks": {
                "total": stats.total_tasks,
                "total_conversations": stats.total_conversations,
                "total_requests": stats.total_requests,
                "recent": stats.recent_tasks,
            },
            "human_loop_requests": {
                "total": stats.total_human_loop_requests,
                "by_status": stats.human_loop_by_status,
                "by_type": stats.human_loop_by_type,
                "by_platform": stats.human_loop_by_platform,
                "recent": stats.recent_human_loop_requests,
            },
            "summary": {
                "total_tasks": stats.total_tasks,
                "total_users": stats.total_users,
                "total_human_loop_requests": stats.total_human_loop_requests,
                "pending_requests": stats.human_loop_by_status.get("pending", 0),
                "completed_requests": stats.human_loop_by_status.get("completed", 0)
                + (
                    stats.human_loop_by_status.get("approved", 0)
                    + stats.human_loop_by_status.get("rejected", 0)
                ),
            },
        }

        return APIResponseWithData(success=True, data=dashboard_data)

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"获取Dashboard统计数据失败: {str(e)}"
        )


@router.get(
    "/user-stats",
    dependencies=[Depends(get_current_active_admin)],
    response_model=APIResponseWithData[dict[str, Any]],
)
async def get_user_dashboard_stats(
    db: MongoDep,
    session: SessionDep,
    current_user: User = Depends(get_current_active_admin),
) -> APIResponseWithData[dict[str, Any]]:
    """获取当前用户的Dashboard统计数据（普通管理员权限）"""
    try:
        stats = DashboardStats()
        user_id = str(current_user.id)

        # 1. 获取当前用户相关的任务统计数据
        # 注意：这里需要根据实际业务逻辑确定如何关联用户和任务
        # 目前假设任务中有owner_id字段或类似的用户关联字段
        tasks_cursor = db.tasks.find({"owner_id": user_id})
        tasks_list = list(tasks_cursor)
        stats.total_tasks = len(tasks_list)

        # 统计对话和请求数量
        for task in tasks_list:
            if "conversations" in task and task["conversations"]:
                stats.total_conversations += len(task["conversations"])
                for conv in task["conversations"]:
                    if "requests" in conv and conv["requests"]:
                        stats.total_requests += len(conv["requests"])

        # 获取最近的任务（最多5个）
        recent_tasks_cursor = (
            db.tasks.find({"owner_id": user_id}).sort("created_at", -1).limit(5)
        )
        stats.recent_tasks = []
        for task in recent_tasks_cursor:
            task["_id"] = str(task["_id"])
            stats.recent_tasks.append(
                {
                    "task_id": task.get("task_id", ""),
                    "created_at": task.get("created_at", ""),
                    "conversations_count": len(task.get("conversations", [])),
                    "total_requests": sum(
                        len(conv.get("requests", []))
                        for conv in task.get("conversations", [])
                    ),
                }
            )

        # 2. 获取当前用户的人机协同请求统计数据
        # 总数量
        total_user_human_loop_count = session.exec(
            select(func.count())
            .select_from(HumanLoopRequest)
            .where(HumanLoopRequest.owner_id == current_user.id)
        ).first()
        stats.total_human_loop_requests = total_user_human_loop_count or 0

        # 按状态分组统计
        user_status_stats = session.exec(
            select(HumanLoopRequest.status, func.count())
            .where(HumanLoopRequest.owner_id == current_user.id)
            .group_by(HumanLoopRequest.status)
        ).all()
        stats.human_loop_by_status = dict(user_status_stats)

        # 按类型分组统计
        user_type_stats = session.exec(
            select(HumanLoopRequest.loop_type, func.count())
            .where(HumanLoopRequest.owner_id == current_user.id)
            .group_by(HumanLoopRequest.loop_type)
        ).all()
        stats.human_loop_by_type = dict(user_type_stats)

        # 按平台分组统计
        user_platform_stats = session.exec(
            select(HumanLoopRequest.platform, func.count())
            .where(HumanLoopRequest.owner_id == current_user.id)
            .group_by(HumanLoopRequest.platform)
        ).all()
        stats.human_loop_by_platform = dict(user_platform_stats)

        # 获取最近的人机协同请求（最多5个）
        recent_user_human_loop_requests = session.exec(
            select(HumanLoopRequest)
            .where(HumanLoopRequest.owner_id == current_user.id)
            .order_by(desc(HumanLoopRequest.created_at))
            .limit(5)
        ).all()

        stats.recent_human_loop_requests = [
            {
                "id": str(req.id),
                "task_id": req.task_id,
                "conversation_id": req.conversation_id,
                "loop_type": req.loop_type,
                "platform": req.platform,
                "status": req.status,
                "created_at": req.created_at.isoformat() if req.created_at else None,
                "responded_at": req.responded_at.isoformat()
                if req.responded_at
                else None,
            }
            for req in recent_user_human_loop_requests
        ]

        # 构建响应数据
        dashboard_data = {
            "tasks": {
                "total": stats.total_tasks,
                "total_conversations": stats.total_conversations,
                "total_requests": stats.total_requests,
                "recent": stats.recent_tasks,
            },
            "human_loop_requests": {
                "total": stats.total_human_loop_requests,
                "by_status": stats.human_loop_by_status,
                "by_type": stats.human_loop_by_type,
                "by_platform": stats.human_loop_by_platform,
                "recent": stats.recent_human_loop_requests,
            },
            "summary": {
                "total_tasks": stats.total_tasks,
                "total_users": 1,  # 普通管理员只能看到自己
                "total_human_loop_requests": stats.total_human_loop_requests,
                "pending_requests": stats.human_loop_by_status.get("pending", 0),
                "completed_requests": stats.human_loop_by_status.get("completed", 0)
                + (
                    stats.human_loop_by_status.get("approved", 0)
                    + stats.human_loop_by_status.get("rejected", 0)
                ),
            },
        }

        return APIResponseWithData(success=True, data=dashboard_data)

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"获取用户Dashboard统计数据失败: {str(e)}"
        )
