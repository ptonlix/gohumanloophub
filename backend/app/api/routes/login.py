from datetime import timedelta
from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import HTMLResponse
from fastapi.security import OAuth2PasswordRequestForm

from app import crud
from app.api.deps import CurrentUser, SessionDep, get_current_active_superuser
from app.core import security
from app.core.config import settings
from app.core.security import get_password_hash
from app.models.models import (
    Message,
    NewPassword,
    Token,
    UserPublic,
    APIResponseWithData,
)
from app.utils import (
    generate_password_reset_token,
    generate_reset_password_email,
    send_email,
    verify_password_reset_token,
)

router = APIRouter(tags=["login"])


@router.post("/login/access-token", response_model=APIResponseWithData[Token])
def login_access_token(
    session: SessionDep, form_data: Annotated[OAuth2PasswordRequestForm, Depends()]
) -> Any:
    """
    OAuth2 compatible token login, get an access token for future requests
    """
    try:
        user = crud.authenticate(
            session=session, email=form_data.username, password=form_data.password
        )
        if not user:
            return APIResponseWithData(
                success=False, error="Incorrect email or password", data=None
            )
        elif not user.is_active:
            return APIResponseWithData(success=False, error="Inactive user", data=None)

        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        token = Token(
            access_token=security.create_access_token(
                user.id, expires_delta=access_token_expires
            )
        )
        return APIResponseWithData(success=True, data=token)
    except Exception as e:
        return APIResponseWithData(success=False, error=str(e), data=None)


@router.post("/login/test-token", response_model=APIResponseWithData[UserPublic])
def test_token(current_user: CurrentUser) -> Any:
    """
    Test access token
    """
    try:
        user_public = UserPublic.model_validate(current_user)
        return APIResponseWithData(success=True, data=user_public)
    except Exception as e:
        return APIResponseWithData(success=False, error=str(e), data=None)


@router.post("/password-recovery/{email}", response_model=APIResponseWithData[Message])
def recover_password(email: str, session: SessionDep) -> Any:
    """
    Password Recovery
    """
    try:
        user = crud.get_user_by_email(session=session, email=email)

        if not user:
            return APIResponseWithData(
                success=False,
                error="The user with this email does not exist in the system.",
                data=None,
            )

        password_reset_token = generate_password_reset_token(email=email)
        email_data = generate_reset_password_email(
            email_to=user.email, email=email, token=password_reset_token
        )
        send_email(
            email_to=user.email,
            subject=email_data.subject,
            html_content=email_data.html_content,
        )
        return APIResponseWithData(
            success=True, data=Message(message="Password recovery email sent")
        )
    except Exception as e:
        return APIResponseWithData(success=False, error=str(e), data=None)


@router.post("/reset-password/", response_model=APIResponseWithData[Message])
def reset_password(session: SessionDep, body: NewPassword) -> Any:
    """
    Reset password
    """
    try:
        email = verify_password_reset_token(token=body.token)
        if not email:
            return APIResponseWithData(success=False, error="Invalid token", data=None)
        user = crud.get_user_by_email(session=session, email=email)
        if not user:
            return APIResponseWithData(
                success=False,
                error="The user with this email does not exist in the system.",
                data=None,
            )
        elif not user.is_active:
            return APIResponseWithData(success=False, error="Inactive user", data=None)

        hashed_password = get_password_hash(password=body.new_password)
        user.hashed_password = hashed_password
        session.add(user)
        session.commit()

        return APIResponseWithData(
            success=True, data=Message(message="Password updated successfully")
        )
    except Exception as e:
        return APIResponseWithData(success=False, error=str(e), data=None)


@router.post(
    "/password-recovery-html-content/{email}",
    dependencies=[Depends(get_current_active_superuser)],
    response_class=HTMLResponse,
)
def recover_password_html_content(email: str, session: SessionDep) -> Any:
    """
    HTML Content for Password Recovery
    """
    user = crud.get_user_by_email(session=session, email=email)

    if not user:
        raise HTTPException(
            status_code=404,
            detail="The user with this username does not exist in the system.",
        )
    password_reset_token = generate_password_reset_token(email=email)
    email_data = generate_reset_password_email(
        email_to=user.email, email=email, token=password_reset_token
    )

    return HTMLResponse(
        content=email_data.html_content, headers={"subject:": email_data.subject}
    )
