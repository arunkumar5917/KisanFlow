from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import datetime
from typing import List

from app.core.database import get_session
from app.models import Centre, Booking, QueueEvent
from app.schemas import QueueMetrics, CentreStatus, BookingStatus
from app.services import ai_engine

router = APIRouter(prefix="/queue", tags=["Queue"])


@router.get("/centre/{centre_id}", response_model=QueueMetrics)
async def get_centre_queue(centre_id: str, session: AsyncSession = Depends(get_session)):
    from app.models import Centre
    
    centre_result = await session.execute(select(Centre).where(Centre.id == centre_id))
    centre = centre_result.scalar_one_or_none()
    
    if not centre:
        raise HTTPException(status_code=404, detail="Centre not found")
    
    now_serving_result = await session.execute(
        select(func.min(Booking.queue_position)).where(
            Booking.centre_id == centre_id,
            Booking.status.in_([BookingStatus.ARRIVED, BookingStatus.QUALITY_CHECK, BookingStatus.WEIGHMENT]),
            Booking.check_in_time != None
        )
    )
    now_serving = now_serving_result.scalar() or 0
    
    waiting_result = await session.execute(
        select(func.count(Booking.id)).where(
            Booking.centre_id == centre_id,
            Booking.status.in_([BookingStatus.ARRIVED, BookingStatus.QUALITY_CHECK, BookingStatus.WEIGHMENT])
        )
    )
    total_waiting = waiting_result.scalar() or 0
    
    avg_processing = 8.0
    estimated_wait = int(total_waiting * avg_processing / max(centre.active_counters, 1))
    
    return QueueMetrics(
        centre_id=centre.id,
        centre_name=centre.name,
        now_serving=now_serving,
        total_waiting=total_waiting,
        active_counters=centre.active_counters,
        avg_processing_min=avg_processing,
        estimated_wait_min=estimated_wait,
        status=centre.status,
        updated_at=datetime.utcnow(),
    )


@router.get("/all", response_model=List[QueueMetrics])
async def get_all_queues(session: AsyncSession = Depends(get_session)):
    from app.models import Centre
    
    centres_result = await session.execute(
        select(Centre).where(Centre.status != CentreStatus.INACTIVE)
    )
    centres = centres_result.scalars().all()
    
    metrics = []
    for centre in centres:
        now_serving_result = await session.execute(
            select(func.min(Booking.queue_position)).where(
                Booking.centre_id == centre.id,
                Booking.status.in_([BookingStatus.ARRIVED, BookingStatus.QUALITY_CHECK, BookingStatus.WEIGHMENT]),
                Booking.check_in_time != None
            )
        )
        now_serving = now_serving_result.scalar() or 0
        
        waiting_result = await session.execute(
            select(func.count(Booking.id)).where(
                Booking.centre_id == centre.id,
                Booking.status.in_([BookingStatus.ARRIVED, BookingStatus.QUALITY_CHECK, BookingStatus.WEIGHMENT])
            )
        )
        total_waiting = waiting_result.scalar() or 0
        
        avg_processing = 8.0
        estimated_wait = int(total_waiting * avg_processing / max(centre.active_counters, 1))
        
        metrics.append(QueueMetrics(
            centre_id=centre.id,
            centre_name=centre.name,
            now_serving=now_serving,
            total_waiting=total_waiting,
            active_counters=centre.active_counters,
            avg_processing_min=avg_processing,
            estimated_wait_min=estimated_wait,
            status=centre.status,
            updated_at=datetime.utcnow(),
        ))
    
    return metrics


@router.post("/centre/{centre_id}/call-next")
async def call_next_token(centre_id: str, session: AsyncSession = Depends(get_session)):
    from app.models import Centre, QueueEvent
    
    centre_result = await session.execute(select(Centre).where(Centre.id == centre_id))
    centre = centre_result.scalar_one_or_none()
    if not centre:
        raise HTTPException(status_code=404, detail="Centre not found")
    
    next_booking_result = await session.execute(
        select(Booking).where(
            Booking.centre_id == centre_id,
            Booking.status.in_([BookingStatus.ARRIVED, BookingStatus.QUALITY_CHECK, BookingStatus.WEIGHMENT]),
            Booking.check_in_time != None
        ).order_by(Booking.check_in_time).limit(1)
    )
    next_booking = next_booking_result.scalar_one_or_none()
    
    if not next_booking:
        return {"message": "No farmers waiting"}
    
    queue_event = QueueEvent(
        booking_id=next_booking.id,
        centre_id=centre_id,
        event_type="CALLED",
        position=0,
        now_serving=next_booking.queue_position,
        wait_estimate_min=0,
        counter_number=1,
    )
    session.add(queue_event)
    await session.flush()
    
    return {
        "message": "Next token called",
        "token_number": next_booking.token_number,
        "booking_id": next_booking.id,
    }