from fastapi import APIRouter, Depends, HTTPException
from pymongo.database import Database
from pydantic import BaseModel
from typing import Any, Dict, List

from app.core.mongodb import get_mongo_db

router = APIRouter(prefix="/mongodb", tags=["mongodb"])


class MongoDBData(BaseModel):
    """接收客户端传输的数据模型"""
    collection: str  # 集合名称
    data: Dict[str, Any]  # 数据内容


class MongoDBDataResponse(BaseModel):
    """MongoDB数据操作响应"""
    success: bool
    message: str
    id: str | None = None


@router.post("/data", response_model=MongoDBDataResponse)
async def create_data(data_in: MongoDBData, db: Database = Depends(get_mongo_db)):
    """接收并存储客户端传输的数据到MongoDB"""
    try:
        # 获取指定的集合
        collection = db[data_in.collection]
        
        # 插入数据
        result = collection.insert_one(data_in.data)
        
        # 返回成功响应
        return {
            "success": True,
            "message": "数据已成功存储",
            "id": str(result.inserted_id)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"存储数据失败: {str(e)}")


@router.get("/data/{collection}", response_model=List[Dict[str, Any]])
async def get_data(collection: str, limit: int = 100, db: Database = Depends(get_mongo_db)):
    """从指定集合获取数据"""
    try:
        # 获取指定的集合
        mongo_collection = db[collection]
        
        # 查询数据
        cursor = mongo_collection.find().limit(limit)
        
        # 将数据转换为列表并返回
        result = []
        for doc in cursor:
            # 将ObjectId转换为字符串
            doc["_id"] = str(doc["_id"])
            result.append(doc)
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取数据失败: {str(e)}")