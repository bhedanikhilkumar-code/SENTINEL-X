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

# Rate limiter instance for auth endpoints
limiter = Limiter(key_func=get_remote_address)
router = APIRouter(prefix="/api/auth", tags=["auth"])

# Demo users dictionary for offline/demo environment resilience
DEMO_USERS = {
    "priya": ("analyst_demo", "analyst", "priya123", "Priya (Senior Analyst)"),
    "vk_senior": ("senior_demo", "senior_analyst", "senior123", "Senior Analyst"),
    "rahul": ("senior_demo_2", "senior_analyst", "rahul123", "Rahul (Senior Analyst)"),
    "anjali": ("soc_lead_demo", "soc_lead", "anjali123", "Anjali (SOC Lead)"),
    "audit": ("auditor_demo", "auditor", "audit123", "Auditor"),
    "vikram": ("auditor_demo_2", "auditor", "vikram123", "Vikram (Auditor)"),
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
    """Authenticate user and return a signed JWT access token.
    
    Rate limited to 10 requests per minute per IP address.
    """
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

    # Upsert user record in database if necessary
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
        # Keep demo role canonical if applicable
        if demo_entry:
            user.role = demo_entry[1]
            if not getattr(user, "hashed_password", None):
                user.hashed_password = get_password_hash(body.password)
            db.commit()
            db.refresh(user)

    role_str = str(user.role)
    token = create_access_token(data={"sub": user.id, "username": user.username, "role": role_str})

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "username": user.username,
            "role": role_str,
            "display_name": getattr(user, "display_name", "")
        }
    }


@router.post("/register")
def register(
    body: RegisterBody,
    db: Session = Depends(get_db),
    admin: Optional[User] = Depends(require_role("soc_lead"))
):
    """Create a new user account. Restricted to SOC Lead role."""
    existing = db.query(User).filter_by(username=body.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")

    if body.role not in VALID_ROLES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid role. Allowed roles: {list(VALID_ROLES)}"
        )

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

    return {
        "status": "created",
        "user": {
            "id": new_user.id,
            "username": new_user.username,
            "role": str(new_user.role),
            "display_name": new_user.display_name
        }
    }


@router.get("/me")
def me(user: Optional[User] = Depends(get_current_user)):
    """Return the profile of the authenticated user or anonymous demo fallback."""
    if user is None:
        return {"mode": "demo_anonymous", "role": "analyst (implicit)"}
    
    return {
        "id": user.id,
        "username": user.username,
        "role": str(user.role),
        "display_name": getattr(user, "display_name", ""),
        "is_active": getattr(user, "is_active", True)
    }


@router.put("/me/password")
def change_password(
    body: PasswordChangeBody,
    db: Session = Depends(get_db),
    user: Optional[User] = Depends(get_current_user)
):
    """Change password for the currently authenticated user."""
    if user is None:
        raise HTTPException(status_code=401, detail="Authentication required")

    if not user.hashed_password or not verify_password(body.old_password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect existing password")

    user.hashed_password = get_password_hash(body.new_password)
    db.commit()
    return {"status": "success", "message": "Password successfully updated"}
