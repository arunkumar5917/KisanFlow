from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, date, timedelta
from typing import List, Optional

from app.core.database import get_session
from app.models import Centre, Booking, Slot
from app.schemas import (
    CentreRecommendation, DemandForecast, CongestionPredictionWithReasoning,
    CentreStatus, BookingStatus
)
from app.services.ai_engine import ai_engine

router = APIRouter(prefix="/ai", tags=["AI Engine"])


@router.get("/recommend-centres", response_model=List[CentreRecommendation])
async def recommend_centres(
    latitude: float = Query(..., ge=-90, le=90),
    longitude: float = Query(..., ge=-180, le=180),
    crop_code: str = Query(...),
    max_distance: float = Query(50, gt=0),
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(
        select(Centre).where(Centre.status != CentreStatus.INACTIVE)
    )
    centres = result.scalars().all()
    
    today = datetime.now().date()
    
    centre_metrics = []
    for centre in centres:
        slot_result = await session.execute(
            select(Slot).where(Slot.centre_id == centre.id, Slot.date >= today, Slot.is_active == True)
        )
        slots = slot_result.scalars().all()
        
        booking_result = await session.execute(
            select(func.count(Booking.id)).where(
                Booking.centre_id == centre.id,
                Booking.date >= today,
                Booking.status.in_([BookingStatus.ARRIVED, BookingStatus.QUALITY_CHECK, BookingStatus.WEIGHMENT]),
            )
        )
        from sqlalchemy import func
        current_queue = booking_result.scalar() or 0
        
        class MockCentre:
            def __init__(self, c, slots, queue):
                self.id = c.id
                self.name = c.name
                self.latitude = c.latitude
                self.longitude = c.longitude
                self.active_counters = c.active_counters
                self.capacity_per_slot = c.capacity_per_slot
                self.status = c.status
                self.slots_today = slots
                self.current_queue = queue
        
        centre_metrics.append(MockCentre(centre, slots, current_queue))
    
    return ai_engine.recommend_centres(latitude, longitude, crop_code, centre_metrics, max_distance)


@router.get("/demand-forecast", response_model=Dict[str, List[DemandForecast]])
async def get_demand_forecast(
    days: int = Query(7, ge=1, le=30),
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(select(Centre).where(Centre.status != CentreStatus.INACTIVE))
    centres = result.scalars().all()
    
    return ai_engine.generate_demand_forecast(centres, days)


@router.get("/congestion-prediction", response_model=List[CongestionPredictionWithReasoning])
async def get_congestion_predictions(
    days: int = Query(7, ge=1, le=14),
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(select(Centre).where(Centre.status != CentreStatus.INACTIVE))
    centres = result.scalars().all()
    
    predictions = []
    for centre in centres:
        slot_result = await session.execute(
            select(Slot).where(Slot.centre_id == centre.id, Slot.is_active == True)
        )
        slots = slot_result.scalars().all()
        slot_capacity = sum(s.max_capacity for s in slots)
        
        booking_result = await session.execute(
            select(func.count(Booking.id)).where(
                Booking.centre_id == centre.id,
                Booking.status.in_([BookingStatus.BOOKED, BookingStatus.CONFIRMED, BookingStatus.ARRIVED]),
            )
        )
        from sqlalchemy import func
        expected = booking_result.scalar() or 0
        
        class MockCentre:
            def __init__(self, c, slots):
                self.id = c.id
                self.name = c.name
                self.active_counters = c.active_counters
                self.capacity_per_slot = c.capacity_per_slot
                self.slots_today = slots
        
        mock = MockCentre(centre, slots)
        for i in range(days):
            pred_date = datetime.now() + timedelta(days=i)
            daily_expected = expected + int(random.uniform(-10, 20))
            prediction = ai_engine.predict_congestion(mock, max(0, daily_expected), pred_date)
            predictions.append(prediction)
    
    import random
    return predictions


@router.get("/centre/{centre_id}/congestion", response_model=CongestionPredictionWithReasoning)
async def get_centre_congestion(
    centre_id: str,
    date: Optional[date] = None,
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(select(Centre).where(Centre.id == centre_id))
    centre = result.scalar_one_or_none()
    
    if not centre:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Centre not found")
    
    if not date:
        date = datetime.now().date()
    
    slot_result = await session.execute(
        select(Slot).where(Slot.centre_id == centre.id, Slot.is_active == True)
    )
    slots = slot_result.scalars().all()
    slot_capacity = sum(s.max_capacity for s in slots)
    
    booking_result = await session.execute(
        select(func.count(Booking.id)).where(
            Booking.centre_id == centre.id,
            Booking.status.in_([BookingStatus.BOOKED, BookingStatus.CONFIRMED, BookingStatus.ARRIVED]),
        )
    )
    from sqlalchemy import func
    expected = booking_result.scalar() or 0
    
    class MockCentre:
        def __init__(self, c, slots):
            self.id = c.id
            self.name = c.name
            self.active_counters = c.active_counters
            self.capacity_per_slot = c.capacity_per_slot
            self.slots_today = slots
    
    mock = MockCentre(centre, slots)
    return ai_engine.predict_congestion(mock, expected, datetime.combine(date, datetime.min.time()))