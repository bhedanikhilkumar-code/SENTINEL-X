"""Auth & RBAC — JWT bearer tokens + role hierarchy (PRD §4.2).

Roles: analyst < senior_analyst < soc_lead, plus auditor (audit-log read only).

Demo-mode flag: SENTINELX_AUTH_REQUIRED env (default "0" so the existing demo
UI keeps working). When "1", every protected endpoint demands a valid Bearer
token and enforces role minimums — production/air-gapped deployments set this.
"""
import hashlib
import hmac
import os
from datetime import datetime, timedelta, timezone

import jwt
from fastapi import Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import User

SECRET_KEY = os.environ.get("SENTINELX_JWT_SECRET", "sentinelx-dev-secret-change-in-prod")
ALGORITHM = "HS256"
TOKEN_TTL_MINUTES = int(os.environ.get("SENTINELX_TOKEN_TTL", "60"))
AUTH_REQUIRED = os.environ.get("SENTINELX_AUTH_REQUIRED", "0") == "1"

ROLE_RANK = {"auditor": 0, "analyst": 1, "senior_analyst": 2, "soc_lead": 3}


def hash_password(password: str, salt: str = "sentinelx") -> str:
    return hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 120_000).hex()


def verify_password(password: str, password_hash: str) -> bool:
    return hmac.compare_digest(hash_password(password), password_hash)


DEMO_USERS = {
    # username: (db user id, role, password, display)
    "priya":   ("analyst_demo", "analyst", "priya123", "Priya (Senior Analyst)"),
    "vk_senior": ("senior_demo", "senior_analyst", "senior123", "Senior Analyst"),
    "anjali":  ("soc_lead_demo", "soc_lead", "anjali123", "Anjali (SOC Lead)"),
    "audit":   ("auditor_demo", "auditor", "audit123", "Auditor"),
}


def create_token(user: User) -> str:
    payload = {"sub": user.id, "username": user.username, "role": user.role,
               "exp": datetime.now(timezone.utc) + timedelta(minutes=TOKEN_TTL_MINUTES)}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def get_current_user(request: Request, db: Session = Depends(get_db)) -> User | None:
    """Returns the authenticated User, or None in demo mode with no token.
    In enforcement mode (AUTH_REQUIRED=1) a missing/invalid token is a 401."""
    header = request.headers.get("Authorization", "")
    token = header[7:] if header.startswith("Bearer ") else None
    if not token:
        if AUTH_REQUIRED:
            raise HTTPException(401, "Bearer token required (AUTH_REQUIRED=1)")
        return None  # demo mode: unauthenticated requests act as demo analyst
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(401, "token expired — re-authenticate")
    except jwt.InvalidTokenError:
        raise HTTPException(401, "invalid token")
    user = db.get(User, payload["sub"])
    if not user:
        raise HTTPException(401, "unknown user")
    return user


def require_role(minimum: str):
    """Dependency factory: enforce role minimum when identity is known.
    In demo mode (no token) the request is treated as analyst_demo — which
    still BLOCKS soc_lead-only operations like dossier export."""
    def dep(user: User | None = Depends(get_current_user)) -> User | None:
        if user is None:  # demo mode anonymous — treated as ANALYST, not omnipotent
            if ROLE_RANK.get(minimum, 1) > ROLE_RANK["analyst"]:
                raise HTTPException(403,
                    f"role '{minimum}' required — login via POST /api/auth/login "
                    f"(demo: anjali/anjali123 for soc_lead)")
            return None
        if ROLE_RANK.get(user.role, -1) < ROLE_RANK.get(minimum, 99):
            raise HTTPException(403, f"role '{user.role}' insufficient — requires '{minimum}'")
        return user
    return dep
