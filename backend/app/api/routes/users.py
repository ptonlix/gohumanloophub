import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import func, select

from app import crud
from app.api.deps import (
    CurrentUser,
    SessionDep,
    get_current_active_superuser,
)
from app.core.config import settings
from app.core.redis import generate_verification_code, redis_client
from app.core.security import get_password_hash, verify_password
from app.models.models import (
    APIResponseWithData,
    APIResponseWithList,
    EmailVerificationCode,
    EmailVerificationRequest,
    Message,
    UpdatePassword,
    User,
    UserCreate,
    UserPublic,
    UserRegister,
    UserRegisterWithCode,
    UserUpdate,
    UserUpdateMe,
)
from app.utils import (
    generate_new_account_email,
    generate_verification_code_email,
    send_email,
)

router = APIRouter(prefix="/users", tags=["users"])


@router.get(
    "/",
    dependencies=[Depends(get_current_active_superuser)],
    response_model=APIResponseWithList[UserPublic],
)
def read_users(session: SessionDep, skip: int = 0, limit: int = 100) -> Any:
    """
    Retrieve users.
    """

    count_statement = select(func.count()).select_from(User)
    count = session.exec(count_statement).one()

    statement = select(User).offset(skip).limit(limit)
    users = session.exec(statement).all()

    # 将 Sequence[User] 转换为 list[UserPublic]
    users_public = [UserPublic.model_validate(user) for user in users]
    return APIResponseWithList(data=users_public, count=count)


@router.post(
    "/",
    dependencies=[Depends(get_current_active_superuser)],
    response_model=APIResponseWithData[UserPublic],
)
def create_user(*, session: SessionDep, user_in: UserCreate) -> Any:
    """
    Create new UserUpdate.
    """
    user = crud.get_user_by_email(session=session, email=user_in.email)
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this email already exists in the system.",
        )

    user = crud.create_user(session=session, user_create=user_in)
    if settings.emails_enabled and user_in.email:
        email_data = generate_new_account_email(
            email_to=user_in.email, username=user_in.email, password=user_in.password
        )
        send_email(
            email_to=user_in.email,
            subject=email_data.subject,
            html_content=email_data.html_content,
        )
    return APIResponseWithData(data=user)


@router.patch("/me", response_model=APIResponseWithData[UserPublic])
def update_user_me(
    *, session: SessionDep, user_in: UserUpdateMe, current_user: CurrentUser
) -> Any:
    """
    Update own user.
    """

    if user_in.email:
        existing_user = crud.get_user_by_email(session=session, email=user_in.email)
        if existing_user and existing_user.id != current_user.id:
            raise HTTPException(
                status_code=409, detail="User with this email already exists"
            )
    user_data = user_in.model_dump(exclude_unset=True)
    current_user.sqlmodel_update(user_data)
    session.add(current_user)
    session.commit()
    session.refresh(current_user)
    return APIResponseWithData(data=current_user)


@router.patch("/me/password", response_model=APIResponseWithData[Message])
def update_password_me(
    *, session: SessionDep, body: UpdatePassword, current_user: CurrentUser
) -> Any:
    """
    Update own password.
    """
    if not verify_password(body.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect password")
    if body.current_password == body.new_password:
        raise HTTPException(
            status_code=400, detail="New password cannot be the same as the current one"
        )
    hashed_password = get_password_hash(body.new_password)
    current_user.hashed_password = hashed_password
    session.add(current_user)
    session.commit()
    return APIResponseWithData(data=Message(message="Password updated successfully"))


@router.get("/me", response_model=UserPublic)
def read_user_me(current_user: CurrentUser) -> Any:
    """
    Get current user.
    """
    return current_user


@router.delete("/me", response_model=APIResponseWithData[Message])
def delete_user_me(session: SessionDep, current_user: CurrentUser) -> Any:
    """
    Delete own user.
    """
    if current_user.is_superuser:
        raise HTTPException(
            status_code=403, detail="Super users are not allowed to delete themselves"
        )
    session.delete(current_user)
    session.commit()
    return APIResponseWithData(data=Message(message="User deleted successfully"))


@router.post("/send-verification-code", response_model=APIResponseWithData[Message])
def send_verification_code(
    session: SessionDep, request: EmailVerificationRequest
) -> Any:
    """
    Send email verification code.
    """
    # 检查邮箱是否已存在
    user = crud.get_user_by_email(session=session, email=request.email)
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this email already exists in the system",
        )

    # 检查发送频率限制
    if not redis_client.check_rate_limit(request.email):
        raise HTTPException(
            status_code=429,
            detail="请等待1分钟后再次发送验证码",
        )

    # 生成验证码
    verification_code = generate_verification_code()

    # 存储验证码到Redis
    if not redis_client.set_verification_code(request.email, verification_code):
        raise HTTPException(
            status_code=500,
            detail="验证码存储失败，请稍后重试",
        )

    # 发送邮件
    if settings.emails_enabled:
        email_data = generate_verification_code_email(
            email_to=request.email, verification_code=verification_code
        )
        send_email(
            email_to=request.email,
            subject=email_data.subject,
            html_content=email_data.html_content,
        )

    return APIResponseWithData(data=Message(message="验证码已发送到您的邮箱"))


@router.post("/verify-code", response_model=APIResponseWithData[Message])
def verify_email_code(request: EmailVerificationCode) -> Any:
    """
    Verify email verification code.
    """
    stored_code = redis_client.get_verification_code(request.email)
    if not stored_code:
        raise HTTPException(
            status_code=400,
            detail="验证码已过期或不存在",
        )

    if stored_code != request.code:
        raise HTTPException(
            status_code=400,
            detail="验证码错误",
        )

    return APIResponseWithData(data=Message(message="验证码验证成功"))


@router.post("/signup", response_model=APIResponseWithData[UserPublic])
def register_user(session: SessionDep, user_in: UserRegister) -> Any:
    """
    Create new user without the need to be logged in.
    """
    user = crud.get_user_by_email(session=session, email=user_in.email)
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this email already exists in the system",
        )
    user_create = UserCreate.model_validate(user_in)
    user = crud.create_user(session=session, user_create=user_create)
    return APIResponseWithData(data=user)


@router.post("/signup-with-code", response_model=APIResponseWithData[UserPublic])
def register_user_with_code(session: SessionDep, user_in: UserRegisterWithCode) -> Any:
    """
    Create new user with email verification code.
    """
    # 检查邮箱是否已存在
    user = crud.get_user_by_email(session=session, email=user_in.email)
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this email already exists in the system",
        )

    # 验证验证码
    stored_code = redis_client.get_verification_code(user_in.email)
    if not stored_code:
        raise HTTPException(
            status_code=400,
            detail="验证码已过期或不存在",
        )

    if stored_code != user_in.verification_code:
        raise HTTPException(
            status_code=400,
            detail="验证码错误",
        )

    # 创建用户
    user_create = UserCreate(
        email=user_in.email, password=user_in.password, full_name=user_in.full_name
    )
    user = crud.create_user(session=session, user_create=user_create)

    # 删除已使用的验证码
    redis_client.delete_verification_code(user_in.email)

    return APIResponseWithData(data=user)


@router.get("/{user_id}", response_model=APIResponseWithData[UserPublic])
def read_user_by_id(
    user_id: uuid.UUID, session: SessionDep, current_user: CurrentUser
) -> Any:
    """
    Get a specific user by id.
    """
    user = session.get(User, user_id)
    if user == current_user:
        return APIResponseWithData(data=user)
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=403,
            detail="The user doesn't have enough privileges",
        )
    return APIResponseWithData(data=user)


@router.patch(
    "/{user_id}",
    dependencies=[Depends(get_current_active_superuser)],
    response_model=APIResponseWithData[UserPublic],
)
def update_user(
    *,
    session: SessionDep,
    user_id: uuid.UUID,
    user_in: UserUpdate,
) -> Any:
    """
    Update a user.
    """

    db_user = session.get(User, user_id)
    if not db_user:
        raise HTTPException(
            status_code=404,
            detail="The user with this id does not exist in the system",
        )
    if user_in.email:
        existing_user = crud.get_user_by_email(session=session, email=user_in.email)
        if existing_user and existing_user.id != user_id:
            raise HTTPException(
                status_code=409, detail="User with this email already exists"
            )

    db_user = crud.update_user(session=session, db_user=db_user, user_in=user_in)
    return APIResponseWithData(data=db_user)


@router.delete("/{user_id}", dependencies=[Depends(get_current_active_superuser)])
def delete_user(
    session: SessionDep, current_user: CurrentUser, user_id: uuid.UUID
) -> APIResponseWithData[Message]:
    """
    Delete a user.
    """
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user == current_user:
        raise HTTPException(
            status_code=403, detail="Super users are not allowed to delete themselves"
        )

    session.delete(user)
    session.commit()
    return APIResponseWithData(data=Message(message="User deleted successfully"))
