"""Root models shim — exports all models from app.models for backwards compatibility.

Ensures both `from app.models import ...` and `from models import ...` work.
"""
from app.models import *  # noqa: F401, F403
