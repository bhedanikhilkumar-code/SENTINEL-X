"""Auth & RBAC bridge — re-exports from app.auth for full backward compatibility."""
from app.auth.security import (
    SECRET_KEY,
    ALGORITHM,
    ACCESS_TOKEN_EXPIRE_MINUTES as TOKEN_TTL_MINUTES,
    get_password_hash as hash_password,
    verify_password,
    create_access_token as create_token,
    verify_token,
    TokenData,
)
from app.auth.dependencies import (
    AUTH_REQUIRED,
    ROLE_RANK,
    get_current_user,
    require_role,
)
from app.api.auth import DEMO_USERS

__all__ = [
    "SECRET_KEY",
    "ALGORITHM",
    "TOKEN_TTL_MINUTES",
    "hash_password",
    "verify_password",
    "create_token",
    "verify_token",
    "TokenData",
    "AUTH_REQUIRED",
    "ROLE_RANK",
    "get_current_user",
    "require_role",
    "DEMO_USERS",
]
