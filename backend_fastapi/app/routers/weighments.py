from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime

from app.core.database import get_session
from app.models import Booking, Procurement, Weighment
from app.schemas import WeighmentCreate, WeighmentResponse, BookingStatus
from app.services.state_machine import StateMachine

router = APIRouter(prefix="/weighments", tags=["Weighment"])


@router.post("/procurement/{procurement_id}", response_model=WeighmentResponse)
async def record_weighment(
    procurement_id: str,
    weighment_data: WeighmentCreate,
    session: AsyncSession = Depends(get_session),
):
    procurement_result = await session.execute(select(Procurement).where(Procurement.id == procurement_id))
    procurement = procurement_result.scalar_one_or_none()
    
    if not procurement:
        raise HTTPException(status_code=404, detail="Procurement not found")
    
    booking_result = await session.execute(select(Booking).where(Booking.id == procurement.booking_id))
    booking = booking_result.scalar_one_or_none()
    
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    if not StateMachine.can_transition(booking.status, BookingStatus.WEIGHMENT):
        raise HTTPException(status_code=400, detail=f"Cannot perform weighment from {booking.status.value}")
    
    net_weight_kg = weighment_data.gross_weight_kg - weighment_data.tare_weight_kg
    net_weight_quintals = net_weight_quintals = net_weight_kg / 100
    
    declared_qty_kg = weighment_data.declared_quantity_kg or int(booking.quantity_quintals * 100)
    variance_kg = net_weight_kg - declared_qty_kg
    
    weighment = Weighment(
        procurement_id=procurement.id,
        gross_weight_kg=weighment_data.gross_weight_kg,
        tare_weight_kg=weighment_data.tare_weight_kg,
        net_weight_kg=net_weight_kg,
        net_weight_quintals=net_weight_quintals,
        declared_quantity_kg=declared_qty_kg,
        variance_kg=variance_kg,
        verified=True,
    )
    session.add(weighment)
    
    procurement.net_weight_quintals = net_weight_quintals
    booking.status = BookingStatus.APPROVED
    
    queue_event = Weighment(
        booking_id=booking.id,
        centre_id=booking.centre_id,
        event_type="WEIGHMENT",
        position=0,
        now_serving=0,
        wait_estimate_min=0,
    )
    session.add(queue_event)
    
    await session.flush()
    
    return WeighmentResponse.model_validate(weighment)


@router.get("/procurement/{procurement_id}", response_model=WeighmentResponse)
async def get_weighment(procurement_id: str, session: AsyncSession = Depends(get_session)):
    result = await session.execute(select(Weighment).where(Weighment.procurement_id == procurement_id))
    weighment = result.scalar_one_or_none()
    
    if not weighment:
        raise HTTPException(status_code=404, detail="Weighment not found")
    
    return WeighmentResponse.model_validate(weighment)