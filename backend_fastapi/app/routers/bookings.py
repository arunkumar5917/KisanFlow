from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import datetime
from typing import List, Optional
import qrcode
import io
import base64

from app.core.database import get_session
from app.core.config import get_settings, get_plain_state, get_crop_info
from app.models import Booking, Farmer, Farm, Centre, Slot, QueueEvent
from app.schemas import (
    BookingCreate, BookingResponse, BookingStatus, BookingTimelineEvent, Language
)
from app.services.state_machine import StateMachine
from app.services.notifications import notification_service

router = APIRouter(prefix="/bookings", tags=["Bookings"])
settings = get_settings()


def generate_token_number() -> str:
    today = datetime.now().strftime("%Y%m%d")
    import random
    return f"TK-{today}-{random.randint(100, 999)}"


def generate_qr_code(data: str) -> str:
    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(data)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return base64.b64encode(buf.getvalue()).decode()


@router.post("/", response_model=BookingResponse, status_code=201)
async def create_booking(booking_data: BookingCreate, session: AsyncSession = Depends(get_session)):
    farmer_result = await session.execute(select(Farmer).where(Farmer.id == booking_data.farmer_id))
    farmer = farmer_result.scalar_one_or_none()
    if not farmer:
        raise HTTPException(status_code=404, detail="Farmer not found")
    
    farm_result = await session.execute(select(Farm).where(Farm.id == booking_data.farm_id))
    farm = farm_result.scalar_one_or_none()
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")
    
    centre_result = await session.execute(select(Centre).where(Centre.id == booking_data.centre_id))
    centre = centre_result.scalar_one_or_none()
    if not centre:
        raise HTTPException(status_code=404, detail="Centre not found")
    
    slot_result = await session.execute(select(Slot).where(Slot.id == booking_data.slot_id))
    slot = slot_result.scalar_one_or_none()
    if not slot:
        raise HTTPException(status_code=404, detail="Slot not found")
    
    if slot.booked_count >= slot.max_capacity:
        raise HTTPException(status_code=400, detail="Slot is full")
    
    token_number = generate_token_number()
    qr_data = f"TOKEN:{token_number}|CENTRE:{centre.id}|DATE:{booking_data.date.isoformat()}|SLOT:{slot.start_time}-{slot.end_time}"
    qr_code = generate_qr_code(qr_data)
    
    existing_count = await session.execute(
        select(func.count(Booking.id)).where(Booking.slot_id == booking_data.slot_id)
    )
    position = existing_count.scalar() + 1
    
    avg_processing = 8.0
    estimated_wait = int(position * avg_processing / max(centre.active_counters, 1))
    
    booking = Booking(
        farmer_id=booking_data.farmer_id,
        farm_id=booking_data.farm_id,
        centre_id=booking_data.centre_id,
        slot_id=booking_data.slot_id,
        crop_code=booking_data.crop_code,
        variety=booking_data.variety,
        quantity_quintals=booking_data.quantity_quintals,
        date=booking_data.date,
        time_slot=f"{slot.start_time}-{slot.end_time}",
        token_number=token_number,
        status=BookingStatus.BOOKED,
        qr_code=qr_code,
        queue_position=position,
        estimated_wait_min=estimated_wait,
    )
    session.add(booking)
    
    slot.booked_count += 1
    
    queue_event = QueueEvent(
        booking_id=booking.id,
        centre_id=centre.id,
        event_type="BOOKED",
        position=position,
        now_serving=0,
        wait_estimate_min=estimated_wait,
    )
    session.add(queue_event)
    
    await session.flush()
    
    await notification_service.send_booking_confirmation(session, farmer, booking)
    
    return await _build_booking_response(session, booking, farmer.language)


@router.get("/{booking_id}", response_model=BookingResponse)
async def get_booking(booking_id: str, session: AsyncSession = Depends(get_session)):
    result = await session.execute(select(Booking).where(Booking.id == booking_id))
    booking = result.scalar_one_or_none()
    
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    farmer_result = await session.execute(select(Farmer).where(Farmer.id == booking.farmer_id))
    farmer = farmer_result.scalar_one_or_none()
    
    return await _build_booking_response(session, booking, farmer.language if farmer else "en")


@router.get("/token/{token_number}", response_model=BookingResponse)
async def get_booking_by_token(token_number: str, session: AsyncSession = Depends(get_session)):
    result = await session.execute(select(Booking).where(Booking.token_number == token_number))
    booking = result.scalar_one_or_none()
    
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    farmer_result = await session.execute(select(Farmer).where(Farmer.id == booking.farmer_id))
    farmer = farmer_result.scalar_one_or_none()
    
    return await _build_booking_response(session, booking, farmer.language if farmer else "en")


@router.post("/{booking_id}/cancel", response_model=BookingResponse)
async def cancel_booking(booking_id: str, session: AsyncSession = Depends(get_session)):
    result = await session.execute(select(Booking).where(Booking.id == booking_id))
    booking = result.scalar_one_or_none()
    
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    if not StateMachine.can_transition(booking.status, BookingStatus.CANCELLED):
        raise HTTPException(status_code=400, detail=f"Cannot cancel from {booking.status.value}")
    
    booking.status = BookingStatus.CANCELLED
    
    if booking.slot_id:
        slot_result = await session.execute(select(Slot).where(Slot.id == booking.slot_id))
        slot = slot_result.scalar_one_or_none()
        if slot:
            slot.booked_count = max(0, slot.booked_count - 1)
    
    queue_event = QueueEvent(
        booking_id=booking.id,
        centre_id=booking.centre_id,
        event_type="CANCELLED",
        position=0,
        now_serving=0,
        wait_estimate_min=0,
    )
    session.add(queue_event)
    
    await session.flush()
    
    farmer_result = await session.execute(select(Farmer).where(Farmer.id == booking.farmer_id))
    farmer = farmer_result.scalar_one_or_none()
    if farmer:
        await notification_service.send_status_change(session, farmer, booking, BookingStatus.CANCELLED)
    
    return await _build_booking_response(session, booking, farmer.language if farmer else "en")


@router.get("/{booking_id}/timeline", response_model=List[BookingTimelineEvent])
async def get_booking_timeline(booking_id: str, session: AsyncSession = Depends(get_session)):
    result = await session.execute(select(Booking).where(Booking.id == booking_id))
    booking = result.scalar_one_or_none()
    
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    queue_result = await session.execute(
        select(QueueEvent).where(QueueEvent.booking_id == booking_id).order_by(QueueEvent.created_at)
    )
    events = queue_result.scalars().all()
    
    farmer_result = await session.execute(select(Farmer).where(Farmer.id == booking.farmer_id))
    farmer = farmer_result.scalar_one_or_none()
    lang = farmer.language if farmer else "en"
    
    timeline = []
    for event in events:
        status = BookingStatus(event.event_type) if event.event_type in [s.value for s in BookingStatus] else booking.status
        timeline.append(BookingTimelineEvent(
            status=status,
            plain_status={l: get_plain_state(status.value, l) for l in ["en", "hi", "pa"]},
            timestamp=event.created_at,
            notes=f"Position: {event.position}, Now serving: {event.now_serving}" if event.position else None,
        ))
    
    return timeline


async def _build_booking_response(session: AsyncSession, booking: Booking, lang: str) -> BookingResponse:
    centre_result = await session.execute(select(Centre).where(Centre.id == booking.centre_id))
    centre = centre_result.scalar_one_or_none()
    
    crop_info = get_crop_info(booking.crop_code, lang)
    
    plain_status = {l: get_plain_state(booking.status.value, l) for l in ["en", "hi", "pa"]}
    
    return BookingResponse(
        id=booking.id,
        farmer_id=booking.farmer_id,
        farm_id=booking.farm_id,
        centre_id=booking.centre_id,
        slot_id=booking.slot_id,
        crop_code=booking.crop_code,
        variety=booking.variety,
        quantity_quintals=booking.quantity_quintals,
        date=booking.date,
        time_slot=booking.time_slot,
        token_number=booking.token_number,
        status=booking.status,
        qr_code=booking.qr_code,
        check_in_time=booking.check_in_time,
        estimated_wait_min=booking.estimated_wait_min,
        plain_status=plain_status,
    )