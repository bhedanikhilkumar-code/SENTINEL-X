"""Authentication & RBAC dependencies — JWT token extraction and role hierarchy enforcement."""
import os
from typing import Callable, Optional
from fastapi import Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User
from app.auth.security import verify_token

# Demo-mode flag: SENTINELX_AUTH_REQUIRED env (default "0")
AUTH_REQUIRED = os.environ.get("SENTINELX_AUTH_REQUIRED", "0") == "1"

# Role hierarchy: auditor < analyst < senior_analyst < soc_lead
ROLE_RANK = {
    "auditor": 0,
    "analyst": 1,
    "senior_analyst": 2,
    "soc_lead": 3
}

VALID_ROLES = set(ROLE_RANK.keys())


def get_current_user(
    request: Request,
    db: Session = Depends(get_db)
) -> Optional[User]:
    """Decode JWT bearer token and fetch the corresponding User from the database.
    
    In demo mode (AUTH_REQUIRED=0), missing tokens return None without 401,
    allowing read/demo access while still blocking privileged operations.
    """
    auth_header = request.headers.get("Authorization", "")
    token = None
    if auth_header.startswith("Bearer "):
        token = auth_header[7:].strip()
    elif auth_header.startswith("bearer "):
        token = auth_header[7:].strip()

    if not token:
        if AUTH_REQUIRED:
            raise HTTPException(status_code=401, detail="Bearer token required (AUTH_REQUIRED=1)")
        return None

    token_data = verify_token(token)
    if not token_data:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    user = None
    if token_data.sub:
        user = db.get(User, token_data.sub)
    if not user and token_data.username:
        user = db.query(User).filter_by(username=token_data.username).first()

    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    if hasattr(user, "is_active") and not user.is_active:
        raise HTTPException(status_code=403, detail="User account is deactivated")

    return user


def require_role(*roles: str) -> Callable:
    """Dependency factory: checks that current user satisfies the allowed roles
    or role hierarchy rank.
    
    Hierarchy: auditor (0) < analyst (1) < senior_analyst (2) < soc_lead (3).
    Raises HTTP 403 Forbidden if unauthorized.
    """
    allowed_roles = [r.lower() for r in roles]

    def role_dependency(user: Optional[User] = Depends(get_current_user)) -> Optional[User]:
        if user is None:
            # Unauthenticated demo request: acts as implicit analyst
            min_rank = min(ROLE_RANK.get(r, 1) for r in allowed_roles) if allowed_roles else 1
            if min_rank > ROLE_RANK["analyst"] or ("analyst" not in allowed_roles and min_rank > 0):
                raise HTTPException(
                    status_code=403,
                    detail=f"Role '{'/'.join(allowed_roles)}' required — please login"
                )
            return None

        # Resolve user's string role
        user_role_str = str(user.role.value if hasattr(user.role, "value") else user.role).lower()
        user_rank = ROLE_RANK.get(user_role_str, -1)

        # Check explicit match or hierarchy satisfaction
        is_allowed = user_role_str in allowed_roles
        if not is_allowed and allowed_roles:
            # If a minimum role was specified (e.g. 'soc_lead')
            min_required_rank = min(ROLE_RANK.get(r, 99) for r in allowed_roles)
            if user_rank >= min_required_rank:
                is_allowed = True

        if not is_allowed:
            raise HTTPException(
                status_code=403,
                detail=f"Role '{user_role_str}' insufficient — requires '{'/'.join(allowed_roles)}'"
            )
        return user

    return role_dependency
