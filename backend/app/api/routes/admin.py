from fastapi import APIRouter, Depends, HTTPException, Query
from pymongo.database import Database
from typing import List, Optional

from app.core.mongodb import get_mongo_db
from app.api.deps import MongoDep, get_current_active_superuser

router = APIRouter(prefix="/humanloop/admin/tasks", tags=["tasks"])

@router.get(
    "/", dependencies=[Depends(get_current_active_superuser)], response_model=List[dict]
)
async def get_tasks(
    db: MongoDep,
    user_id: Optional[str] = None,
    task_id: Optional[str] = None,
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

        return tasks
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取任务列表失败: {str(e)}")

@router.get("/sync/logs",  dependencies=[Depends(get_current_active_superuser)], response_model=List[dict])
async def get_sync_logs(
    task_id: Optional[str] = None,
    user_id: Optional[str] = None,
    sync_status: Optional[str] = None,
    limit: int = Query(default=100, ge=1, le=1000),
    skip: int = Query(default=0, ge=0),
    db: Database = Depends(get_mongo_db),
):
    """获取同步日志列表，支持过滤和分页"""
    try:
        # 构建查询条件
        query = {}
        if task_id:
            query["task_id"] = task_id
        if user_id:
            query["user_id"] = user_id
        if sync_status:
            query["sync_status"] = sync_status

        # 执行查询
        cursor = db.sync_logs.find(query).skip(skip).limit(limit).sort("synced_at", -1)

        # 处理结果
        logs = []
        for doc in cursor:
            doc["_id"] = str(doc["_id"])
            logs.append(doc)

        return logs
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取同步日志列表失败: {str(e)}")
