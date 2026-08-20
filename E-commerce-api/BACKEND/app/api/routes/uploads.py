from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from typing import Annotated
import os
import uuid
from pathlib import Path
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import SessionDep, get_current_admin_user
from app.models.models import User

router = APIRouter()

UPLOAD_DIR = Path(__file__).resolve().parent.parent.parent / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB


@router.post("/upload/image", status_code=status.HTTP_200_OK)
async def upload_image(
    session: SessionDep,
    _: Annotated[User, Depends(get_current_admin_user)],
    file: bytes,
    filename: str,
):
    ext = Path(filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Unsupported file type: {ext}")

    if len(file) > MAX_FILE_SIZE:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="File too large. Max 5MB.")

    unique_name = f"{uuid.uuid4().hex}{ext}"
    file_path = UPLOAD_DIR / unique_name
    file_path.write_bytes(file)

    url = f"/uploads/{unique_name}"
    return {"filename": unique_name, "url": url, "content_type": ext.lstrip(".")}
