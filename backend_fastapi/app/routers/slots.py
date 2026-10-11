from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, date
from typing import List

from app.core.database import get_session
from app.models import Slot, Centre
from app.schemas import SlotCreate, SlotResponse

router = APIRouter(prefix="/slots", tags=["Slots"])


@router.get("/", response_model=List[SlotResponse])
async def list_slots(
    centre_id: str = None,
    date: date = None,
    session: AsyncSession = Depends(get_session),
):
    query = select(Slot).where(Slot.is_active == True)
    
    if centre_id:
        query = query.where(Slot.centre_id == centre_id)
    if date:
        start = datetime.combine(date, datetime.min.time())
        end = datetime.combine(date, datetime.max.time())
        query = query.where(Slot.date >= start, Slot.date <= end)
    
    query = query.order_by(Slot.date, Slot.start_time)
    result = await session.execute(query)
    slots = result.scalars().all()
    
    return [
        SlotResponse(
            **SlotResponse.model_validate(s).model_dump(),
            remaining_capacity=s.max_capacity - s.booked_count,
        )
        for s in slots
    ]


@router.get("/{slot_id}", response_model=SlotResponse)
async def get_slot(slot_id: str, session: AsyncSession = Depends(get_session)):
    result = await session.execute(select(Slot).where(Slot.id == slot_id))
    slot = result.scalar_one_or_none()
    
    if not slot:
        raise HTTPException(status_code=404, detail="Slot not found")
    
    s = SlotResponse.model_validate(slot)
    return SlotResponse(**s.model_dump(), remaining_capacity=s.max_capacity - s.booked_count)


@router.post("/", response_model=SlotResponse, status_code=201)
async def create_slot(slot_data: SlotCreate, session: AsyncSession = Depends(get_session)):
    centre_result = await session.execute(select(Centre).where(Centre.id == slot_data.centre_id))
    centre = centre_result.scalar_one_or_none()
    if not centre:
        raise HTTPException(status_code=404, detail="Centre not found")
    
    slot = Slot(**slot_data.model_dump())
    session.add(slot)
    await session.flush()
    
    s = SlotResponse.model_validate(slot)
    return SlotResponse(**s.model_dump(), remaining_capacity=s.max_capacity - s.booked_count)