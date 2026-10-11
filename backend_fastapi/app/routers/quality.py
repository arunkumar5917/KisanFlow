from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime
from typing import Optional

from app.core.database import get_session
from app.core.config import get_plain_state, get_quality_norms
from app.models import Booking, Procurement, QualityCheck, Centre
from app.schemas import QualityCheckCreate, QualityCheckResponse, QualityResult, BookingStatus
from app.services.state_machine import StateMachine
from app.services.notifications import notification_service

router = APIRouter(prefix="/quality", tags=["Quality Inspection"])


def determine_grade(crop_code: str, moisture: float, foreign_matter: float, damaged: float) -> tuple[str, QualityResult]:
    norms = get_quality_norms(crop_code)
    grade = "A"
    accepted = True
    
    if moisture > norms["moisture_max"]:
        accepted = False
    if foreign_matter > norms["foreign_matter_max"]:
        accepted = False
    if damaged > norms["damaged_max"]:
        accepted = False
    
    if not accepted:
        grade = "REJECTED"
    elif moisture <= norms["moisture_max"] * 0.8 and foreign_matter <= norms["foreign_matter_max"] * 0.5:
        grade = "A+"
    elif moisture <= norms["moisture_max"] and foreign_matter <= norms["foreign_matter_max"]:
        grade = "A"
    else:
        grade = "B"
    
    return grade, QualityResult.ACCEPTED if accepted else QualityResult.REJECTED


@router.post("/booking/{booking_id}", response_model=QualityCheckResponse)
async def record_quality_check(
    booking_id: str,
    quality_data: QualityCheckCreate,
    session: AsyncSession = Depends(get_session),
):
    booking_result = await session.execute(select(Booking).where(Booking.id == booking_id))
    booking = booking_result.scalar_one_or_none()
    
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    if not StateMachine.can_transition(booking.status, BookingStatus.QUALITY_CHECK):
        raise HTTPException(status_code=400, detail=f"Cannot perform quality check from {booking.status.value}")
    
    procurement_result = await session.execute(select(Procurement).where(Procurement.booking_id == booking_id))
    procurement = procurement_result.scalar_one_or_none()
    
    if not procurement:
        procurement = Procurement(
            booking_id=booking.id,
            crop_code=booking.crop_code,
            variety=booking.variety,
            quantity_quintals=booking.quantity_quintals,
            net_weight_quintals=0,
            quality_grade="",
            msp_rate=0,
            gross_amount=0,
            deductions=0,
            net_amount=0,
            receipt_number="",
        )
        session.add(procurement)
        await session.flush()
    
    grade, result = determine_grade(
        booking.crop_code,
        quality_data.moisture_percent,
        quality_data.foreign_matter_percent,
        quality_data.damaged_grain_percent,
    )
    
    quality_check = QualityCheck(
        procurement_id=procurement.id,
        moisture_percent=quality_data.moisture_percent,
        foreign_matter_percent=quality_data.foreign_matter_percent,
        damaged_grain_percent=quality_data.damaged_grain_percent,
        grade=grade,
        result=result,
        notes=quality_data.notes,
    )
    session.add(quality_check)
    
    if result == QualityResult.ACCEPTED:
        booking.status = BookingStatus.WEIGHMENT
        procurement.quality_grade = grade
    else:
        booking.status = BookingStatus.QUALITY_REJECTED
    
    queue_event = QueueEvent(
        booking_id=booking.id,
        centre_id=booking.centre_id,
        event_type="QUALITY_CHECK",
        position=0,
        now_serving=0,
        wait_estimate_min=0,
    )
    session.add(queue_event)
    
    await session.flush()
    
    farmer_result = await session.execute(select(Booking).where(Booking.id == booking_id))
    farmer_result = await session.execute(
        select(Booking).join(Procurement).where(Booking.id == booking_id)
    )
    
    return QualityCheckResponse.model_validate(quality_check)


@router.get("/procurement/{procurement_id}", response_model=QualityCheckResponse)
async def get_quality_check(procurement_id: str, session: AsyncSession = Depends(get_session)):
    result = await session.execute(select(QualityCheck).where(QualityCheck.procurement_id == procurement_id))
    quality_check = result.scalar_one_or_none()
    
    if not quality_check:
        raise HTTPException(status_code=404, detail="Quality check not found")
    
    return QualityCheckResponse.model_validate(quality_check)