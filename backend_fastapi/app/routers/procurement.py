from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime
import uuid

from app.core.database import get_session
from app.core.config import get_crop_info
from app.models import Booking, Procurement, QualityCheck, Weighment
from app.schemas import ProcurementResponse, BookingStatus
from app.services.state_machine import StateMachine

router = APIRouter(prefix="/procurement", tags=["Procurement"])


def generate_receipt_number() -> str:
    today = datetime.now().strftime("%Y%m%d")
    return f"RCP-{today}-{str(uuid.uuid4())[:8].upper()}"


@router.post("/booking/{booking_id}", response_model=ProcurementResponse)
async def complete_procurement(booking_id: str, session: AsyncSession = Depends(get_session)):
    booking_result = await session.execute(select(Booking).where(Booking.id == booking_id))
    booking = booking_result.scalar_one_or_none()
    
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    if not StateMachine.can_transition(booking.status, BookingStatus.PROCUREMENT_COMPLETED):
        raise HTTPException(status_code=400, detail=f"Cannot complete procurement from {booking.status.value}")
    
    procurement_result = await session.execute(select(Procurement).where(Procurement.booking_id == booking_id))
    procurement = procurement_result.scalar_one_or_none()
    
    if not procurement:
        raise HTTPException(status_code=400, detail="Procurement record not found. Complete quality and weighment first.")
    
    quality_result = await session.execute(select(QualityCheck).where(QualityCheck.procurement_id == procurement.id))
    quality = quality_result.scalar_one_or_none()
    
    weighment_result = await session.execute(select(Weighment).where(Weighment.procurement_id == procurement.id))
    weighment = weighment_result.scalar_one_or_none()
    
    if not quality or not weighment:
        raise HTTPException(status_code=400, detail="Quality check and weighment must be completed first")
    
    crop_info = get_crop_info(procurement.crop_code)
    msp_rate = crop_info["msp_per_quintal"]
    
    gross_amount = procurement.net_weight_quintals * msp_rate
    deductions = 0
    net_amount = gross_amount - deductions
    
    procurement.msp_rate = msp_rate
    procurement.gross_amount = gross_amount
    procurement.deductions = deductions
    procurement.net_amount = net_amount
    procurement.receipt_number = generate_receipt_number()
    procurement.completed_at = datetime.utcnow()
    
    booking.status = BookingStatus.PROCUREMENT_COMPLETED
    
    queue_event = Procurement(
        booking_id=booking.id,
        centre_id=booking.centre_id,
        event_type="PROCUREMENT_COMPLETED",
        position=0,
        now_serving=0,
        wait_estimate_min=0,
    )
    session.add(queue_event)
    
    await session.flush()
    
    return ProcurementResponse.model_validate(procurement)


@router.get("/booking/{booking_id}", response_model=ProcurementResponse)
async def get_procurement(booking_id: str, session: AsyncSession = Depends(get_session)):
    result = await session.execute(select(Procurement).where(Procurement.booking_id == booking_id))
    procurement = result.scalar_one_or_none()
    
    if not procurement:
        raise HTTPException(status_code=404, detail="Procurement not found")
    
    return ProcurementResponse.model_validate(procurement)


@router.get("/receipt/{receipt_number}", response_model=ProcurementResponse)
async def get_procurement_by_receipt(receipt_number: str, session: AsyncSession = Depends(get_session)):
    result = await session.execute(select(Procurement).where(Procurement.receipt_number == receipt_number))
    procurement = result.scalar_one_or_none()
    
    if not procurement:
        raise HTTPException(status_code=404, detail="Receipt not found")
    
    return ProcurementResponse.model_validate(procurement)