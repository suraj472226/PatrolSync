from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from sqlalchemy.orm import Session
import os
import uuid
import base64
from datetime import datetime
from pathlib import Path

from ..database.connection import get_db
from ..core.dependencies import get_current_user
from ..models.user import User
from ..schemas.mobile_schema import FileUploadResponse, SignatureUploadRequest, SignatureUploadResponse

router = APIRouter(prefix="/files", tags=["File Upload"])

# Configure upload directory
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

# Allowed file types
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/jpg", "image/webp"}
ALLOWED_VIDEO_TYPES = {"video/mp4", "video/quicktime", "video/x-msvideo"}
ALLOWED_DOC_TYPES = {"application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"}

MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB


def get_file_extension(content_type: str) -> str:
    """Get file extension from content type"""
    extensions = {
        "image/jpeg": ".jpg",
        "image/jpg": ".jpg",
        "image/png": ".png",
        "image/webp": ".webp",
        "video/mp4": ".mp4",
        "video/quicktime": ".mov",
        "video/x-msvideo": ".avi",
        "application/pdf": ".pdf",
        "application/msword": ".doc",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx"
    }
    return extensions.get(content_type, "")


@router.post("/upload", response_model=FileUploadResponse)
async def upload_file(
    file: UploadFile = File(...),
    category: str = "general",  # photo, video, document
    current_user: User = Depends(get_current_user)
):
    """Upload photo, video, or document file"""

    # Check content type
    content_type = file.content_type
    all_allowed = ALLOWED_IMAGE_TYPES | ALLOWED_VIDEO_TYPES | ALLOWED_DOC_TYPES

    if content_type not in all_allowed:
        raise HTTPException(
            status_code=400,
            detail=f"File type not allowed. Allowed types: images, videos, PDFs"
        )

    # Read file content
    content = await file.read()

    # Check file size
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum size is {MAX_FILE_SIZE // (1024*1024)}MB"
        )

    # Generate unique filename
    ext = get_file_extension(content_type)
    unique_id = str(uuid.uuid4())
    date_dir = datetime.utcnow().strftime("%Y/%m/%d")
    filename = f"{unique_id}{ext}"

    # Create directory structure
    category_dir = UPLOAD_DIR / category / date_dir
    category_dir.mkdir(parents=True, exist_ok=True)

    # Save file
    file_path = category_dir / filename
    with open(file_path, "wb") as f:
        f.write(content)

    # Return URL (relative path for API access)
    relative_url = f"/uploads/{category}/{date_dir}/{filename}"

    return FileUploadResponse(
        url=relative_url,
        filename=filename,
        content_type=content_type,
        size=len(content)
    )


@router.post("/upload/signature", response_model=SignatureUploadResponse)
async def upload_signature(
    signature_data: SignatureUploadRequest,
    current_user: User = Depends(get_current_user)
):
    """Upload signature as base64 encoded image"""

    try:
        # Remove data URL prefix if present
        base64_string = signature_data.base64_data
        if "," in base64_string:
            base64_string = base64_string.split(",")[1]

        # Decode base64
        image_data = base64.b64decode(base64_string)
    except Exception as e:
        raise HTTPException(status_code=400, detail="Invalid base64 data")

    # Generate unique filename
    unique_id = str(uuid.uuid4())
    date_dir = datetime.utcnow().strftime("%Y/%m/%d")
    filename = f"sig_{unique_id}.png"

    # Create directory structure
    sig_dir = UPLOAD_DIR / "signatures" / date_dir
    sig_dir.mkdir(parents=True, exist_ok=True)

    # Save signature image
    file_path = sig_dir / filename
    with open(file_path, "wb") as f:
        f.write(image_data)

    # Return URL
    relative_url = f"/uploads/signatures/{date_dir}/{filename}"

    return SignatureUploadResponse(url=relative_url)


@router.post("/upload/multiple")
async def upload_multiple_files(
    files: list[UploadFile] = File(...),
    category: str = "general",
    current_user: User = Depends(get_current_user)
):
    """Upload multiple files at once"""

    results = []
    all_allowed = ALLOWED_IMAGE_TYPES | ALLOWED_VIDEO_TYPES | ALLOWED_DOC_TYPES

    for file in files:
        content_type = file.content_type

        if content_type not in all_allowed:
            results.append({
                "filename": file.filename,
                "success": False,
                "error": "File type not allowed"
            })
            continue

        content = await file.read()

        if len(content) > MAX_FILE_SIZE:
            results.append({
                "filename": file.filename,
                "success": False,
                "error": "File too large"
            })
            continue

        # Generate unique filename
        ext = get_file_extension(content_type)
        unique_id = str(uuid.uuid4())
        date_dir = datetime.utcnow().strftime("%Y/%m/%d")
        filename = f"{unique_id}{ext}"

        # Create directory structure
        category_dir = UPLOAD_DIR / category / date_dir
        category_dir.mkdir(parents=True, exist_ok=True)

        # Save file
        file_path = category_dir / filename
        with open(file_path, "wb") as f:
            f.write(content)

        relative_url = f"/uploads/{category}/{date_dir}/{filename}"

        results.append({
            "original_filename": file.filename,
            "success": True,
            "url": relative_url,
            "filename": filename,
            "content_type": content_type,
            "size": len(content)
        })

    return {"files": results}
