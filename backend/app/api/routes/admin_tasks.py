from fastapi import APIRouter, Depends, HTTPException, Query

from app.api.deps import MongoDep, get_current_active_superuser
from app.models.models import (
    APIResponseWithList,
)
from app.models.mongodb_models import TaskModel

router = APIRouter(prefix="/humanloop/admin/tasks", tags=["amdin_tasks"])


@router.get(
    "/",
    dependencies=[Depends(get_current_active_superuser)],
    response_model=APIResponseWithList[TaskModel],
)
async def get_tasks(
    db: MongoDep,
    user_id: str | None = None,
    task_id: str | None = None,
    limit: int = Query(default=100, ge=1, le=1000),
    skip: int = Query(default=0, ge=0),
):
    """获取任务列表，支持过滤和分页（管理员权限）"""
    try:
        # 构建查询条件
        query = {}
        if user_id:
            query["user_id"] = user_id
        if task_id:
            query["task_id"] = task_id

        # 执行查询
        cursor = db.tasks.find(query).skip(skip).limit(limit).sort("created_at", -1)

        # 处理结果
        tasks = []
        for doc in cursor:
            doc["_id"] = str(doc["_id"])
            tasks.append(doc)

        return APIResponseWithList(
            success=True, data=tasks, count=len(tasks), skip=skip, limit=limit
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取任务列表失败: {str(e)}")
