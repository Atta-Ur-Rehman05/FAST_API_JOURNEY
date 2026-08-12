from typing import Optional

from pydantic import BaseModel

class Token(BaseModel):
    access_token: str
    token_type: str

class RefreshTokenRequest(BaseModel):
    # Kept optional during the cookie migration so older API clients fail
    # gracefully. Browser clients use the HttpOnly cookie exclusively.
    refresh_token: Optional[str] = None

class TokenPayload(BaseModel):
    sub: str = None
