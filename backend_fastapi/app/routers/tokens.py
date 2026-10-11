from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import datetime
from typing import Optional

from app.core.database import get_session
from app.core.config import get_plain_state
from app.models import Booking, QueueEvent, Centre
from app.schemas import TokenGenerateResponse, TokenStatusResponse, BookingStatus, LiveQueueUpdate, Language
from app.services.state_machine import StateMachine
from app.services import ai_engine

router = APIRouter(prefix="/tokens", tags=["Tokens"])


@router.get("/{token_number}", response_model=TokenStatusResponse)
async def get_token_status(token_number: str, session: AsyncSession = Depends(get_session)):
    result = await session.execute(select(Booking).where(Booking.token_number == token_number))
    booking = result.scalar_one_or_none()
    
    if not booking:
        raise HTTPException(status_code=404, detail="Token not found")
    
    queue_result = await session.execute(
        select(QueueEvent)
        .where(QueueEvent.booking_id == booking.id)
        .order_by(QueueEvent.created_at.desc())
        .limit(1)
    )
    latest_event = queue_result.scalar_one_or_none()
    
    centre_result = await session.execute(select(Centre).where(Centre.id == booking.centre_id))
    centre = centre_result.scalar_one_or_none()
    
    position = latest_event.position if latest_event else booking.queue_position
    now_serving = latest_event.now_serving if latest_event else 0
    wait_estimate = latest_event.wait_estimate_min if latest_event else booking.estimated_wait_min
    
    plain_status = {l: get_plain_state(booking.status.value, l) for l in ["en", "hi", "pa"]}
    
    return TokenStatusResponse(
        token_number=booking.token_number,
        status=booking.status,
        plain_status=plain_status,
        position=position,
        now_serving=now_serving,
        estimated_wait_min=wait_estimate,
        centre_name=centre.name if centre else "Unknown",
        updated_at=latest_event.created_at if latest_event else booking.updated_at,
    )


@router.post("/{token_number}/checkin", response_model=TokenStatusResponse)
async def checkin_token(token_number: str, session: AsyncSession = Depends(get_session)):
    result = await session.execute(select(Booking).where(Booking.token_number == token_number))
    booking = result.scalar_one_or_none()
    
    if not booking:
        raise HTTPException(status_code=404, detail="Token not found")
    
    if not StateMachine.can_transition(booking.status, BookingStatus.ARRIVED):
        raise HTTPException(status_code=400, detail=f"Cannot check-in from {booking.status.value}")
    
    booking.status = BookingStatus.ARRIVED
    booking.check_in_time = datetime.utcnow()
    
    centre_result = await session.execute(select(Centre).where(Centre.id == booking.centre_id))
    centre = centre_result.scalar_one_or_none()
    
    waiting_result = await session.execute(
        select(func.count(Booking.id)).where(
            Booking.centre_id == booking.centre_id,
            Booking.status.in_([BookingStatus.ARRIVED, BookingStatus.QUALITY_CHECK, BookingStatus.WEIGHMENT]),
            Booking.id != booking.id
        )
    )
    waiting_count = waiting_result.scalar() or 0
    
    now_serving_result = await session.execute(
        select(func.count(Booking.id)).where(
            Booking.centre_id == booking.centre_id,
            Booking.status.in_([BookingStatus.ARRIVED, BookingStatus.QUALITY_CHECK, BookingStatus.WEIGHMENT]),
            Booking.check_in_time != None
        ).order_by(Booking.check_in_time)
    )
    bookings_ahead = now_serving_result.scalars().all()
    position = len([b for b in bookings_ahead if b.check_in_time and b.check_in_time < booking.check_in_time]) + 1
    
    queue_event = QueueEvent(
        booking_id=booking.id,
        centre_id=booking.centre_id,
        event_type="ARRIVED",
        position=position,
        now_serving=0,
        wait_estimate_min=ai_engine.get_wait_time_estimate(centre, position) if centre else 0,
    )
    session.add(queue_event)
    
    await session.flush()
    
    return await get_token_status(token_number, session)


@router.get("/{token_number}/live", response_model=LiveQueueUpdate)
async def get_live_queue(token_number: str, session: AsyncSession = Depends(get_session)):
    result = await session.execute(select(Booking).where(Booking.token_number == token_number))
    booking = result.scalar_one_or_none()
    
    if not booking:
        raise HTTPException(status_code=404, detail="Token not found")
    
    queue_result = await session.execute(
        select(QueueEvent)
        .where(QueueEvent.booking_id == booking.id)
        .order_by(QueueEvent.created_at.desc())
        .limit(1)
    )
    latest_event = queue_result.scalar_one_or_none()
    
    plain_status = {l: get_plain_state(booking.status.value, l) for l in ["en", "hi", "pa"]}
    
    return LiveQueueUpdate(
        token_number=booking.token_number,
        position=latest_event.position if latest_event else booking.queue_position,
        now_serving=latest_event.now_serving if latest_event else 0,
        estimated_wait_min=latest_event.wait_estimate_min if latest_event else booking.estimated_wait_min,
        status=booking.status,
        plain_status=plain_status,
    )