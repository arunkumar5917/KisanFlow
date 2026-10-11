from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from app.core.database import get_session
from app.models import NotificationLog, Farmer
from app.schemas import Language

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("/farmer/{farmer_id}")
async def get_farmer_notifications(
    farmer_id: str,
    limit: int = 50,
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(select(Farmer).where(Farmer.id == farmer_id))
    farmer = result.scalar_one_or_none()
    
    if not farmer:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Farmer not found")
    
    notif_result = await session.execute(
        select(NotificationLog)
        .where(NotificationLog.farmer_id == farmer_id)
        .order_by(NotificationLog.sent_at.desc())
        .limit(limit)
    )
    notifications = notif_result.scalars().all()
    
    return {
        "farmer_id": farmer_id,
        "notifications": [
            {
                "id": n.id,
                "channel": n.channel,
                "template": n.template,
                "message": n.message,
                "status": n.status,
                "sent_at": n.sent_at,
            }
            for n in notifications
        ]
    }


@router.get("/booking/{booking_id}")
async def get_booking_notifications(
    booking_id: str,
    session: AsyncSession = Depends(get_session),
):
    notif_result = await session.execute(
        select(NotificationLog)
        .where(NotificationLog.booking_id == booking_id)
        .order_by(NotificationLog.sent_at.desc())
    )
    notifications = notif_result.scalars().all()
    
    return {
        "booking_id": booking_id,
        "notifications": [
            {
                "id": n.id,
                "channel": n.channel,
                "template": n.template,
                "message": n.message,
                "status": n.status,
                "sent_at": n.sent_at,
            }
            for n in notifications
        ]
    }