"""Auth API — login/logout/me (JWT)."""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.db import get_db
from app.models import User
from app.security.auth import DEMO_USERS, create_token, get_current_user, hash_password, verify_password

router = APIRouter(prefix="/api/auth", tags=["auth"])


class LoginBody(BaseModel):
    username: str
    password: str


@router.post("/login")
def login(body: LoginBody, db: Session = Depends(get_db)):
    entry = DEMO_USERS.get(body.username)
    if not entry or not verify_password(body.password, hash_password(entry[2])):
        raise HTTPException(401, "invalid credentials")
    user_id, role, _, display = entry
    user = db.get(User, user_id)
    if not user:
        user = User(id=user_id, username=body.username, role=role, display_name=display)
        db.add(user)
    else:
        user.role = role  # keep demo roles canonical
    db.commit()
    db.refresh(user)
    return {"access_token": create_token(user), "token_type": "bearer",
            "user": {"id": user.id, "username": user.username, "role": user.role}}


@router.get("/me")
def me(user=Depends(get_current_user)):
    if user is None:
        return {"mode": "demo_anonymous", "role": "analyst (implicit)"}
    return {"id": user.id, "username": user.username, "role": user.role}
