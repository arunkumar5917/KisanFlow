from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List, Optional
from datetime import datetime, date
from math import radians, sin, cos, sqrt, atan2

from app.core.database import get_session
from app.core.config import get_settings
from app.models import Centre, Slot, Booking, QueueEvent
from app.schemas import CentreResponse, CentreWithQueue, CentreStatus, SlotResponse
from app.services.ai_engine import ai_engine

router = APIRouter(prefix="/centres", tags=["Centres"])
settings = get_settings()


def haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371
    dlat = radians(lat2 - lat1)
    dlon = radians(lon2 - lon1)
    a = sin(dlat/2)**2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon/2)**2
    return R * 2 * atan2(sqrt(a), sqrt(1-a))


@router.get("/", response_model=List[CentreResponse])
async def list_centres(
    district: Optional[str] = None,
    status: Optional[CentreStatus] = None,
    session: AsyncSession = Depends(get_session),
):
    query = select(Centre).where(Centre.status != CentreStatus.INACTIVE)
    
    if district:
        query = query.where(Centre.district.ilike(f"%{district}%"))
    if status:
        query = query.where(Centre.status == status)
    
    query = query.order_by(Centre.name)
    result = await session.execute(query)
    centres = result.scalars().all()
    return [CentreResponse.model_validate(c) for c in centres]


@router.get("/nearby", response_model=List[CentreWithQueue])
async def nearby_centres(
    latitude: float = Query(..., ge=-90, le=90),
    longitude: float = Query(..., ge=-180, le=180),
    crop_code: Optional[str] = None,
    max_distance: float = Query(50, gt=0),
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(
        select(Centre).where(Centre.status != CentreStatus.INACTIVE)
    )
    centres = result.scalars().all()
    
    today = datetime.now().date()
    
    centres_with_queue = []
    for centre in centres:
        distance = haversine(latitude, longitude, centre.latitude, centre.longitude)
        if distance > max_distance:
            continue
        
        slot_result = await session.execute(
            select(Slot).where(
                Slot.centre_id == centre.id,
                Slot.date >= today,
                Slot.is_active == True
            )
        )
        slots = slot_result.scalars().all()
        
        booking_result = await session.execute(
            select(func.count(Booking.id)).where(
                Booking.centre_id == centre.id,
                Booking.date >= today,
                Booking.status.in_([
                    "BOOKED", "CONFIRMED", "ARRIVED", "QUALITY_CHECK", "WEIGHMENT", "APPROVED"
                ])
            )
        )
        current_queue = booking_result.scalar() or 0
        
        available_slots = sum(s.max_capacity - s.booked_count for s in slots if s.date == today)
        
        wait_time = ai_engine.get_wait_time_estimate(centre, current_queue)
        
        centres_with_queue.append(CentreWithQueue(
            **CentreResponse.model_validate(centre).model_dump(),
            current_queue_length=current_queue,
            estimated_wait_min=wait_time,
            distance_km=round(distance, 1),
            available_slots_today=available_slots,
        ))
    
    centres_with_queue.sort(key=lambda c: c.distance_km)
    return centres_with_queue


@router.get("/{centre_id}", response_model=CentreResponse)
async def get_centre(centre_id: str, session: AsyncSession = Depends(get_session)):
    result = await session.execute(select(Centre).where(Centre.id == centre_id))
    centre = result.scalar_one_or_none()
    
    if not centre:
        raise HTTPException(status_code=404, detail="Centre not found")
    
    return CentreResponse.model_validate(centre)


@router.get("/{centre_id}/slots", response_model=List[SlotResponse])
async def get_centre_slots(
    centre_id: str,
    date: Optional[date] = None,
    session: AsyncSession = Depends(get_session),
):
    if not date:
        date = datetime.now().date()
    
    start = datetime.combine(date, datetime.min.time())
    end = datetime.combine(date, datetime.max.time())
    
    result = await session.execute(
        select(Slot).where(
            Slot.centre_id == centre_id,
            Slot.date >= start,
            Slot.date <= end,
            Slot.is_active == True
        ).order_by(Slot.start_time)
    )
    slots = result.scalars().all()
    
    return [
        SlotResponse(
            **SlotResponse.model_validate(s).model_dump(),
            remaining_capacity=s.max_capacity - s.booked_count,
        )
        for s in slots
    ]


@router.post("/{centre_id}/slots", response_model=SlotResponse, status_code=201)
async def create_slot(centre_id: str, slot_data: dict, session: AsyncSession = Depends(get_session)):
    from app.schemas import SlotCreate
    from app.models import Centre
    
    centre_result = await session.execute(select(Centre).where(Centre.id == centre_id))
    centre = centre_result.scalar_one_or_none()
    if not centre:
        raise HTTPException(status_code=404, detail="Centre not found")
    
    slot = Slot(centre_id=centre_id, **slot_data)
    session.add(slot)
    await session.flush()
    
    s = SlotResponse.model_validate(slot)
    return SlotResponse(**s.model_dump(), remaining_capacity=s.max_capacity - s.booked_count)