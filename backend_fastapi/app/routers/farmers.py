from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List, Optional
from datetime import datetime

from app.core.database import get_session
from app.models import Farmer, Farm
from app.schemas import FarmerCreate, FarmerResponse, FarmCreate, FarmResponse, Language
from app.services.notifications import notification_service

router = APIRouter(prefix="/farmers", tags=["Farmers"])


@router.post("/", response_model=FarmerResponse, status_code=201)
async def create_farmer(farmer_data: FarmerCreate, session: AsyncSession = Depends(get_session)):
    result = await session.execute(select(Farmer).where(Farmer.mobile == farmer_data.mobile))
    existing = result.scalar_one_or_none()
    
    if existing:
        for key, value in farmer_data.model_dump(exclude_unset=True).items():
            setattr(existing, key, value)
        await session.flush()
        return FarmerResponse.model_validate(existing)
    
    farmer = Farmer(**farmer_data.model_dump())
    session.add(farmer)
    await session.flush()
    return FarmerResponse.model_validate(farmer)


@router.get("/{farmer_id}", response_model=FarmerResponse)
async def get_farmer(farmer_id: str, session: AsyncSession = Depends(get_session)):
    result = await session.execute(select(Farmer).where(Farmer.id == farmer_id))
    farmer = result.scalar_one_or_none()
    
    if not farmer:
        raise HTTPException(status_code=404, detail="Farmer not found")
    
    return FarmerResponse.model_validate(farmer)


@router.put("/{farmer_id}", response_model=FarmerResponse)
async def update_farmer(farmer_id: str, farmer_data: FarmerCreate, session: AsyncSession = Depends(get_session)):
    result = await session.execute(select(Farmer).where(Farmer.id == farmer_id))
    farmer = result.scalar_one_or_none()
    
    if not farmer:
        raise HTTPException(status_code=404, detail="Farmer not found")
    
    for key, value in farmer_data.model_dump(exclude_unset=True).items():
        setattr(farmer, key, value)
    
    await session.flush()
    return FarmerResponse.model_validate(farmer)


@router.post("/{farmer_id}/farms", response_model=FarmResponse, status_code=201)
async def create_farm(farmer_id: str, farm_data: FarmCreate, session: AsyncSession = Depends(get_session)):
    result = await session.execute(select(Farmer).where(Farmer.id == farmer_id))
    farmer = result.scalar_one_or_none()
    
    if not farmer:
        raise HTTPException(status_code=404, detail="Farmer not found")
    
    farm = Farm(farmer_id=farmer_id, **farm_data.model_dump())
    session.add(farm)
    await session.flush()
    return FarmResponse.model_validate(farm)


@router.get("/{farmer_id}/farms", response_model=List[FarmResponse])
async def get_farms(farmer_id: str, session: AsyncSession = Depends(get_session)):
    result = await session.execute(select(Farm).where(Farm.farmer_id == farmer_id))
    farms = result.scalars().all()
    return [FarmResponse.model_validate(f) for f in farms]


@router.get("/{farmer_id}/bookings", response_model=List[dict])
async def get_farmer_bookings(farmer_id: str, session: AsyncSession = Depends(get_session)):
    from app.models import Booking
    from app.schemas import BookingStatus
    from app.core.config import get_plain_state
    
    result = await session.execute(
        select(Booking).where(Booking.farmer_id == farmer_id).order_by(Booking.created_at.desc())
    )
    bookings = result.scalars().all()
    
    return [
        {
            "id": b.id,
            "token_number": b.token_number,
            "centre_id": b.centre_id,
            "crop_code": b.crop_code,
            "quantity_quintals": b.quantity_quintals,
            "date": b.date,
            "time_slot": b.time_slot,
            "status": b.status.value,
            "plain_status": {lang: get_plain_state(b.status.value, lang) for lang in ["en", "hi", "pa"]},
            "qr_code": b.qr_code,
            "created_at": b.created_at,
        }
        for b in bookings
    ]