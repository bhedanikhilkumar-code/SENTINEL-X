"""Security utilities — password hashing (bcrypt) & JWT access token handling (python-jose)."""
import os
from datetime import datetime, timedelta, timezone
from typing import Any, Optional

# Compatibility fix for passlib 1.7.4 with bcrypt >= 4.0.0
import bcrypt
if not hasattr(bcrypt, "__about__"):
    class _About:
        __version__ = getattr(bcrypt, "__version__", "4.0.0")
    bcrypt.__about__ = _About()

from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel

# Configuration from environment
SECRET_KEY = os.environ.get("SECRET_KEY", "f78a63dc164a2f8d8b9e6729a4e0c35489f65c192d774e14ab958e932efda712")
ALGORITHM = os.environ.get("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.environ.get("ACCESS_TOKEN_EXPIRE_MINUTES", "480"))

# Password hashing with passlib bcrypt
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class TokenData(BaseModel):
    """Schema for validated JWT claims."""
    username: Optional[str] = None
    role: Optional[str] = None
    sub: Optional[str] = None


def get_password_hash(password: str) -> str:
    """Generate bcrypt hash of password."""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify plaintext password against bcrypt hash or fallback pbkdf2 hash."""
    if not hashed_password:
        return False
    try:
        if pwd_context.identify(hashed_password):
            return pwd_context.verify(plain_password, hashed_password)
    except Exception:
        pass
    # Support legacy PBKDF2 salt check for demo backward compatibility
    import hashlib
    import hmac
    legacy = hashlib.pbkdf2_hmac("sha256", plain_password.encode(), b"sentinelx", 120_000).hex()
    return hmac.compare_digest(legacy, hashed_password)


def create_access_token(data: dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """Create signed JWT access token using python-jose."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def verify_token(token: str) -> Optional[TokenData]:
    """Verify and decode JWT token, returning TokenData if valid."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: Optional[str] = payload.get("username")
        sub: Optional[str] = payload.get("sub")
        role: Optional[str] = payload.get("role")
        if username is None and sub is None:
            return None
        return TokenData(username=username, role=role, sub=sub)
    except JWTError:
        return None
