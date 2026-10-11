from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime
from typing import List

from app.core.database import get_session
from app.models import Grievance, Farmer, Booking
from app.schemas import GrievanceCreate, GrievanceResponse, GrievanceStatus, GrievanceType

router = APIRouter(prefix="/grievances", tags=["Grievances"])


@router.post("/", response_model=GrievanceResponse, status_code=201)
async def create_grievance(grievance_data: GrievanceCreate, session: AsyncSession = Depends(get_session)):
    farmer_result = await session.execute(select(Farmer).where(Farmer.id == grievance_data.farmer_id))
    farmer = farmer_result.scalar_one_or_none()
    if not farmer:
        raise HTTPException(status_code=404, detail="Farmer not found")
    
    if grievance_data.booking_id:
        booking_result = await session.execute(select(Booking).where(Booking.id == grievance_data.booking_id))
        booking = booking_result.scalar_one_or_none()
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found")
    
    grievance = Grievance(
        farmer_id=grievance_data.farmer_id,
        booking_id=grievance_data.booking_id,
        type=grievance_data.type,
        title=grievance_data.title,
        description=grievance_data.description,
        status=GrievanceStatus.SUBMITTED,
    )
    session.add(grievance)
    await session.flush()
    
    return GrievanceResponse.model_validate(grievance)


@router.get("/farmer/{farmer_id}", response_model=List[GrievanceResponse])
async def get_farmer_grievances(farmer_id: str, session: AsyncSession = Depends(get_session)):
    result = await session.execute(
        select(Grievance).where(Grievance.farmer_id == farmer_id).order_by(Grievance.submitted_at.desc())
    )
    grievances = result.scalars().all()
    return [GrievanceResponse.model_validate(g) for g in grievances]


@router.get("/booking/{booking_id}", response_model=List[GrievanceResponse])
async def get_booking_grievances(booking_id: str, session: AsyncSession = Depends(get_session)):
    result = await session.execute(
        select(Grievance).where(Grievance.booking_id == booking_id).order_by(Grievance.submitted_at.desc())
    )
    grievances = result.scalars().all()
    return [GrievanceResponse.model_validate(g) for g in grievances]


@router.get("/{grievance_id}", response_model=GrievanceResponse)
async def get_grievance(grievance_id: str, session: AsyncSession = Depends(get_session)):
    result = await session.execute(select(Grievance).where(Grievance.id == grievance_id))
    grievance = result.scalar_one_or_none()
    
    if not grievance:
        raise HTTPException(status_code=404, detail="Grievance not found")
    
    return GrievanceResponse.model_validate(grievance)


@router.post("/{grievance_id}/resolve", response_model=GrievanceResponse)
async def resolve_grievance(grievance_id: str, resolution: str, session: AsyncSession = Depends(get_session)):
    result = await session.execute(select(Grievance).where(Grievance.id == grievance_id))
    grievance = result.scalar_one_or_none()
    
    if not grievance:
        raise HTTPException(status_code=404, detail="Grievance not found")
    
    grievance.status = GrievanceStatus.RESOLVED
    grievance.resolution = resolution
    grievance.resolved_at = datetime.utcnow()
    
    await session.flush()
    
    return GrievanceResponse.model_validate(grievance)