"""Auth API — login, registration, user profile, and password management."""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User
from app.auth.security import (
    create_access_token,
    get_password_hash,
    verify_password,
)
from app.auth.dependencies import get_current_user, require_role, VALID_ROLES

limiter = Limiter(key_func=get_remote_address)
router = APIRouter(prefix="/api/auth", tags=["auth"])

# Predefined demo accounts for quick testing across all 4 roles
DEMO_USERS = {
    "priya": ("analyst_demo", "analyst", "priya123", "Priya (Analyst)"),
    "vk_senior": ("senior_demo", "senior_analyst", "senior123", "Senior Analyst"),
    "anjali": ("soc_lead_demo", "soc_lead", "anjali123", "Anjali (SOC Lead)"),
    "audit": ("auditor_demo", "auditor", "audit123", "Auditor (Independent)"),
}


class LoginBody(BaseModel):
    username: str
    password: str


class RegisterBody(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=6)
    role: str = "analyst"  # analyst | senior_analyst | soc_lead | auditor
    display_name: str = ""


class PasswordChangeBody(BaseModel):
    old_password: str
    new_password: str = Field(..., min_length=6)


@router.post("/login")
@limiter.limit("10/minute")
def login(request: Request, body: LoginBody, db: Session = Depends(get_db)):
    """Authenticate user and return signed JWT access token."""
    user = db.query(User).filter_by(username=body.username).first()
    demo_entry = DEMO_USERS.get(body.username)

    authenticated = False
    role_to_set = "analyst"
    display_to_set = body.username
    user_id_to_set = None

    if user and getattr(user, "hashed_password", None):
        if verify_password(body.password, user.hashed_password):
            authenticated = True
    elif demo_entry:
        uid_demo, demo_role, demo_pwd, demo_disp = demo_entry
        if body.password == demo_pwd or verify_password(body.password, demo_pwd):
            authenticated = True
            role_to_set = demo_role
            display_to_set = demo_disp
            user_id_to_set = uid_demo

    if not authenticated:
        raise HTTPException(status_code=401, detail="Invalid username or password")

    if not user:
        if role_to_set not in VALID_ROLES:
            role_to_set = "analyst"
        user = User(
            id=user_id_to_set or body.username,
            username=body.username,
            role=role_to_set,
            display_name=display_to_set,
            hashed_password=get_password_hash(body.password),
            is_active=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        if demo_entry:
            user.role = demo_entry[1]
            if not getattr(user, "hashed_password", None):
                user.hashed_password = get_password_hash(body.password)
            db.commit()

    token = create_access_token(
        data={
            "sub": user.id,
            "username": user.username,
            "role": str(user.role.value if hasattr(user.role, "value") else user.role)
        }
    )

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "username": user.username,
            "role": str(user.role.value if hasattr(user.role, "value") else user.role),
            "display_name": user.display_name or user.username
        }
    }


@router.post("/register")
def register(body: RegisterBody, db: Session = Depends(get_db)):
    """Register a new analyst/investigator account."""
    if body.role not in VALID_ROLES:
        raise HTTPException(status_code=400, detail=f"Invalid role. Must be one of: {list(VALID_ROLES)}")

    existing = db.query(User).filter_by(username=body.username).first()
    if existing:
        raise HTTPException(status_code=409, detail="Username already exists")

    new_user = User(
        username=body.username,
        role=body.role,
        display_name=body.display_name or body.username,
        hashed_password=get_password_hash(body.password),
        is_active=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    token = create_access_token(
        data={
            "sub": new_user.id,
            "username": new_user.username,
            "role": str(new_user.role.value if hasattr(new_user.role, "value") else new_user.role)
        }
    )

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": new_user.id,
            "username": new_user.username,
            "role": str(new_user.role.value if hasattr(new_user.role, "value") else new_user.role),
            "display_name": new_user.display_name
        }
    }


@router.get("/me")
def get_me(user: Optional[User] = Depends(get_current_user)):
    """Return currently authenticated user identity and role."""
    if not user:
        return {
            "authenticated": False,
            "user": {
                "id": "analyst_demo",
                "username": "guest_analyst",
                "role": "analyst",
                "display_name": "Analyst Demo (Unauthenticated)"
            }
        }
    return {
        "authenticated": True,
        "user": {
            "id": user.id,
            "username": user.username,
            "role": str(user.role.value if hasattr(user.role, "value") else user.role),
            "display_name": user.display_name or user.username
        }
    }


@router.post("/change-password")
def change_password(
    body: PasswordChangeBody,
    user: User = Depends(require_role("analyst")),
    db: Session = Depends(get_db)
):
    """Change current user password."""
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")

    if not verify_password(body.old_password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password incorrect")

    user.hashed_password = get_password_hash(body.new_password)
    db.commit()
    return {"status": "ok", "message": "Password updated successfully"}
