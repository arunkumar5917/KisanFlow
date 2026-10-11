from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime
import uuid

from app.core.database import get_session
from app.core.config import get_plain_state
from app.models import Booking, Procurement, Payment, Farmer
from app.schemas import PaymentResponse, PaymentBreakdown, PaymentStatus, BookingStatus
from app.services.state_machine import StateMachine
from app.services.notifications import notification_service

router = APIRouter(prefix="/payments", tags=["Payments"])


def generate_transaction_ref() -> str:
    return f"TXN-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:10].upper()}"


@router.post("/procurement/{procurement_id}", response_model=PaymentResponse)
async def initiate_payment(procurement_id: str, session: AsyncSession = Depends(get_session)):
    procurement_result = await session.execute(select(Procurement).where(Procurement.id == procurement_id))
    procurement = procurement_result.scalar_one_or_none()
    
    if not procurement:
        raise HTTPException(status_code=404, detail="Procurement not found")
    
    booking_result = await session.execute(select(Booking).where(Booking.id == procurement.booking_id))
    booking = booking_result.scalar_one_or_none()
    
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    if not StateMachine.can_transition(booking.status, BookingStatus.PAYMENT_INITIATED):
        raise HTTPException(status_code=400, detail=f"Cannot initiate payment from {booking.status.value}")
    
    farmer_result = await session.execute(select(Farmer).where(Farmer.id == booking.farmer_id))
    farmer = farmer_result.scalar_one_or_none()
    
    existing_payment = await session.execute(select(Payment).where(Payment.procurement_id == procurement_id))
    payment = existing_payment.scalar_one_or_none()
    
    if not payment:
        payment = Payment(
            booking_id=booking.id,
            procurement_id=procurement.id,
            farmer_id=farmer.id if farmer else None,
            amount=procurement.net_amount,
            msp_rate=procurement.msp_rate,
            net_weight_quintals=procurement.net_weight_quintals,
            status=PaymentStatus.PENDING,
            transaction_ref=generate_transaction_ref(),
            bank_account=farmer.bank_account if farmer else None,
            ifsc_code=farmer.ifsc_code if farmer else None,
        )
        session.add(payment)
    
    payment.status = PaymentStatus.PROCESSING
    payment.initiated_at = datetime.utcnow()
    booking.status = BookingStatus.PAYMENT_INITIATED
    
    queue_event = Payment(
        booking_id=booking.id,
        centre_id=booking.centre_id,
        event_type="PAYMENT_INITIATED",
        position=0,
        now_serving=0,
        wait_estimate_min=0,
    )
    session.add(queue_event)
    
    await session.flush()
    
    if farmer:
        await notification_service.send_payment_notification(session, farmer, booking, payment.amount, "PAYMENT_INITIATED")
    
    return PaymentResponse.model_validate(payment)


@router.post("/{payment_id}/process", response_model=PaymentResponse)
async def process_payment(payment_id: str, session: AsyncSession = Depends(get_session)):
    result = await session.execute(select(Payment).where(Payment.id == payment_id))
    payment = result.scalar_one_or_none()
    
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    booking_result = await session.execute(select(Booking).where(Booking.id == payment.booking_id))
    booking = booking_result.scalar_one_or_none()
    
    if not StateMachine.can_transition(booking.status, BookingStatus.PAYMENT_PROCESSING):
        raise HTTPException(status_code=400, detail=f"Cannot process payment from {booking.status.value}")
    
    payment.status = PaymentStatus.PROCESSING
    payment.processed_at = datetime.utcnow()
    booking.status = BookingStatus.PAYMENT_PROCESSING
    
    await session.flush()
    
    farmer_result = await session.execute(select(Farmer).where(Farmer.id == payment.farmer_id))
    farmer = farmer_result.scalar_one_or_none()
    if farmer:
        await notification_service.send_payment_notification(session, farmer, booking, payment.amount, "PAYMENT_PROCESSING")
    
    return PaymentResponse.model_validate(payment)


@router.post("/{payment_id}/complete", response_model=PaymentResponse)
async def complete_payment(payment_id: str, session: AsyncSession = Depends(get_session)):
    result = await session.execute(select(Payment).where(Payment.id == payment_id))
    payment = result.scalar_one_or_none()
    
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    booking_result = await session.execute(select(Booking).where(Booking.id == payment.booking_id))
    booking = booking_result.scalar_one_or_none()
    
    if not StateMachine.can_transition(booking.status, BookingStatus.PAID):
        raise HTTPException(status_code=400, detail=f"Cannot complete payment from {booking.status.value}")
    
    payment.status = PaymentStatus.PAID
    payment.credited_at = datetime.utcnow()
    booking.status = BookingStatus.PAID
    
    await session.flush()
    
    farmer_result = await session.execute(select(Farmer).where(Farmer.id == payment.farmer_id))
    farmer = farmer_result.scalar_one_or_none()
    if farmer:
        await notification_service.send_payment_notification(session, farmer, booking, payment.amount, "PAID")
    
    return PaymentResponse.model_validate(payment)


@router.get("/booking/{booking_id}", response_model=PaymentBreakdown)
async def get_payment_breakdown(booking_id: str, session: AsyncSession = Depends(get_session)):
    booking_result = await session.execute(select(Booking).where(Booking.id == booking_id))
    booking = booking_result.scalar_one_or_none()
    
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    procurement_result = await session.execute(select(Procurement).where(Procurement.booking_id == booking_id))
    procurement = procurement_result.scalar_one_or_none()
    
    payment_result = await session.execute(select(Payment).where(Payment.booking_id == booking_id))
    payment = payment_result.scalar_one_or_none()
    
    if not procurement:
        raise HTTPException(status_code=404, detail="Procurement not found")
    
    farmer_result = await session.execute(select(Farmer).where(Farmer.id == booking.farmer_id))
    farmer = farmer_result.scalar_one_or_none()
    lang = farmer.language if farmer else "en"
    
    status_text = payment.status.value if payment else "PENDING"
    plain_status = {l: get_plain_state(status_text, l) for l in ["en", "hi", "pa"]}
    
    return PaymentBreakdown(
        accepted_weight_quintals=procurement.net_weight_quintals,
        msp_rate_per_quintal=procurement.msp_rate,
        gross_amount=procurement.gross_amount,
        deductions=procurement.deductions,
        net_payment=procurement.net_amount,
        payment_status=status_text,
        plain_status=plain_status,
    )