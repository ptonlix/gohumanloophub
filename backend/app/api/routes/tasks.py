from datetime import datetime
from fastapi import APIRouter, Query
from typing import Optional

from app.models.mongodb_models import TaskModel, TaskUpdateModel
from app.api.deps import CurrentUser, CurrentUserByAPIKey, MongoDep
from app.models.models import APIResponseWithData, APIResponseWithList

router = APIRouter(prefix="/humanloop/tasks", tags=["tasks"])


@router.post("/sync", response_model=APIResponseWithData[TaskUpdateModel], status_code=201)
async def sync_task_data(task: TaskModel, db: MongoDep, current_user: CurrentUserByAPIKey):
    """接收从客户端同步的任务数据，创建新任务或全量更新已存在的任务"""
    try:
        # 转换为字典并准备插入数据库
        task_dict = task.model_dump()

        # 从token中获取user_id，覆盖请求中的user_id
        task_dict["user_id"] = str(current_user.id)

        # 确保时间字段是datetime对象
        for field in ["timestamp", "created_at", "updated_at"]:
            if isinstance(task_dict.get(field), str):
                task_dict[field] = datetime.fromisoformat(
                    task_dict[field].replace("Z", "+00:00")
                )

        # 处理conversations中的时间字段
        for conv in task_dict.get("conversations", []):
            for req in conv.get("requests", []):
                if isinstance(req.get("responded_at"), str):
                    req["responded_at"] = datetime.fromisoformat(
                        req["responded_at"].replace("Z", "+00:00")
                    )

        # 设置更新时间
        task_dict["updated_at"] = datetime.utcnow()

        # 检查任务是否已存在
        existing_task = db.tasks.find_one({"task_id": task.task_id})

        if existing_task:
            # 如果任务已存在，执行全量替换（保留原始_id）
            task_dict["created_at"] = existing_task.get("created_at", datetime.utcnow())
            result = db.tasks.replace_one({"task_id": task.task_id}, task_dict)
            return APIResponseWithData(
                success=True,
                data=TaskUpdateModel(
                    _id=str(existing_task["_id"]),
                    task_id=task.task_id,
                    updated=True,
                ),
            )
        else:
            # 如果任务不存在，执行插入
            result = db.tasks.insert_one(task_dict)
            return APIResponseWithData(
                success=True,
                data=TaskUpdateModel(
                    _id=str(result.inserted_id),
                    task_id=task.task_id,
                    updated=False,
                ),
            )
    except Exception as e:
        return APIResponseWithData(
            success=False, error=f"创建或更新任务失败: {str(e)}", data=None
        )


@router.get("/", response_model=APIResponseWithList[TaskModel])
async def get_my_tasks(
    db: MongoDep,
    current_user: CurrentUser,
    task_id: Optional[str] = None,
    limit: int = Query(default=100, ge=1, le=1000),
    skip: int = Query(default=0, ge=0),
):
    """获取当前用户的任务列表"""
    try:
        # 构建查询条件 - 只查询当前用户的任务
        query = {"user_id": str(current_user.id)}
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
        return APIResponseWithList(
            success=False,
            error=f"获取用户任务列表失败: {str(e)}",
            data=[],
            count=0,
            skip=skip,
            limit=limit,
        )


@router.get("/{task_id}", response_model=APIResponseWithData[TaskModel])
async def get_task(db: MongoDep, current_user: CurrentUser, task_id: str):
    """根据task_id获取单个任务"""
    try:
        # 查询任务
        task = db.tasks.find_one({"user_id": str(current_user.id), "task_id": task_id})

        if not task:
            return APIResponseWithData(
                success=False, error=f"未找到任务: {task_id}", data=None
            )

        # 转换ObjectId为字符串
        task["_id"] = str(task["_id"])

        return APIResponseWithData(success=True, data=task)
    except Exception as e:
        return APIResponseWithData(
            success=False, error=f"获取任务失败: {str(e)}", data=None
        )


@router.delete("/{task_id}", response_model=APIResponseWithData)
async def delete_task(db: MongoDep, current_user: CurrentUser, task_id: str):
    """删除任务"""
    try:
        # 执行删除
        result = db.tasks.delete_one(
            {"user_id": str(current_user.id), "task_id": task_id}
        )

        if result.deleted_count == 0:
            return APIResponseWithData(
                success=False, error=f"未找到任务: {task_id}", data=None
            )

        return APIResponseWithData(success=True, data={"message": "任务删除成功"})
    except Exception as e:
        return APIResponseWithData(
            success=False, error=f"删除任务失败: {str(e)}", data=None
        )
