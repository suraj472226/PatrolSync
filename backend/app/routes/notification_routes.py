from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, desc
from typing import Optional
from datetime import datetime, date

from ..database.connection import get_db
from ..core.dependencies import get_current_user
from ..models.user import User, UserRole
from ..models.notification import Notification, NotificationType


router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("/")
def get_notifications(
    offset: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    is_read: Optional[bool] = None,
    notification_type: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get notifications for current user (admin only)"""
    # Only admins can view notifications
    if current_user.role != UserRole.ADMIN:
        return {"items": [], "total": 0, "offset": 0, "limit": limit, "unread_count": 0}

    query = db.query(Notification).options(joinedload(Notification.user))

    # Apply filters
    if is_read is not None:
        query = query.filter(Notification.is_read == is_read)

    if notification_type:
        try:
            nt = NotificationType(notification_type)
            query = query.filter(Notification.type == nt)
        except ValueError:
            pass

    # Get total and unread count
    total = query.count()
    unread_count = db.query(func.count(Notification.id)).filter(
        Notification.is_read == False
    ).scalar()

    # Get paginated notifications
    notifications = query.order_by(desc(Notification.created_at)).offset(offset).limit(limit).all()

    items = []
    for notif in notifications:
        items.append({
            "id": notif.id,
            "type": notif.type.value,
            "title": notif.title,
            "message": notif.message,
            "user_id": notif.user_id,
            "employee_id": notif.user.employee_id if notif.user else None,
            "reference_id": notif.reference_id,
            "reference_type": notif.reference_type,
            "is_read": notif.is_read,
            "created_at": notif.created_at.isoformat() if notif.created_at else None,
            "read_at": notif.read_at.isoformat() if notif.read_at else None
        })

    return {
        "items": items,
        "total": total,
        "offset": offset,
        "limit": limit,
        "unread_count": unread_count
    }


@router.patch("/{notification_id}/read")
def mark_notification_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Mark a notification as read"""
    if current_user.role != UserRole.ADMIN:
        return {"success": False, "message": "Not authorized"}

    notification = db.query(Notification).filter(Notification.id == notification_id).first()
    if not notification:
        return {"success": False, "message": "Notification not found"}

    notification.is_read = True
    notification.read_at = datetime.utcnow()
    db.commit()

    return {"success": True, "message": "Notification marked as read"}


@router.post("/mark-all-read")
def mark_all_notifications_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Mark all notifications as read"""
    if current_user.role != UserRole.ADMIN:
        return {"success": False, "message": "Not authorized"}

    db.query(Notification).filter(Notification.is_read == False).update({
        "is_read": True,
        "read_at": datetime.utcnow()
    })
    db.commit()

    return {"success": True, "message": "All notifications marked as read"}


@router.get("/unread-count")
def get_unread_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get count of unread notifications"""
    if current_user.role != UserRole.ADMIN:
        return {"count": 0}

    count = db.query(func.count(Notification.id)).filter(
        Notification.is_read == False
    ).scalar()

    return {"count": count}
