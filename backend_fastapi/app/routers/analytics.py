from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import datetime, date, timedelta
from typing import List, Dict, Optional

from app.core.database import get_session
from app.models import Centre, Booking, Procurement, Payment, QualityCheck
from app.schemas import AnalyticsSummary, CentreStatus, BookingStatus, PaymentStatus
from app.services.ai_engine import ai_engine

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/summary", response_model=AnalyticsSummary)
async def get_analytics_summary(
    district: Optional[str] = None,
    session: AsyncSession = Depends(get_session),
):
    query = select(Centre)
    if district:
        query = query.where(Centre.district.ilike(f"%{district}%"))
    query = query.where(Centre.status != CentreStatus.INACTIVE)
    
    result = await session.execute(query)
    centres = result.scalars().all()
    
    today = datetime.now().date()
    start_today = datetime.combine(today, datetime.min.time())
    end_today = datetime.combine(today, datetime.max.time())
    
    bookings_today = await session.execute(
        select(func.count(Booking.id)).where(
            Booking.date >= start_today,
            Booking.date <= end_today,
        )
    )
    total_bookings = bookings_today.scalar() or 0
    
    procured = await session.execute(
        select(func.sum(Procurement.net_weight_quintals)).where(
            Procurement.completed_at >= start_today,
            Procurement.completed_at <= end_today,
        )
    )
    total_procured = procured.scalar() or 0
    
    wait_times = await session.execute(
        select(func.avg(Booking.estimated_wait_min)).where(
            Booking.date >= start_today,
            Booking.date <= end_today,
            Booking.status.in_([BookingStatus.ARRIVED, BookingStatus.QUALITY_CHECK, BookingStatus.WEIGHMENT]),
        )
    )
    avg_wait = wait_times.scalar() or 0
    
    completed = await session.execute(
        select(func.count(Booking.id)).where(
            Booking.date >= start_today,
            Booking.date <= end_today,
            Booking.status == BookingStatus.PROCUREMENT_COMPLETED,
        )
    )
    total_completed = completed.scalar() or 0
    
    no_show = await session.execute(
        select(func.count(Booking.id)).where(
            Booking.date >= start_today,
            Booking.date <= end_today,
            Booking.status == BookingStatus.NO_SHOW,
        )
    )
    no_show_count = no_show.scalar() or 0
    no_show_rate = (no_show_count / max(total_bookings, 1)) * 100
    
    rejected = await session.execute(
        select(func.count(QualityCheck.id)).where(
            QualityCheck.checked_at >= start_today,
            QualityCheck.checked_at <= end_today,
            QualityCheck.result == "REJECTED",
        )
    )
    rejected_count = rejected.scalar() or 0
    total_quality = await session.execute(
        select(func.count(QualityCheck.id)).where(
            QualityCheck.checked_at >= start_today,
            QualityCheck.checked_at <= end_today,
        )
    )
    total_quality_count = total_quality.scalar() or 1
    rejection_rate = (rejected_count / max(total_quality_count, 1)) * 100
    
    centre_utilization = {}
    for centre in centres:
        slots = await session.execute(
            select(func.sum(Slot.max_capacity)).where(Slot.centre_id == centre.id, Slot.date == today)
        )
        capacity = slots.scalar() or 0
        booked = await session.execute(
            select(func.count(Booking.id)).where(
                Booking.centre_id == centre.id,
                Booking.date >= start_today,
                Booking.date <= end_today,
            )
        )
        booked_count = booked.scalar() or 0
        centre_utilization[centre.name] = (booked_count / max(capacity, 1)) * 100
    
    return AnalyticsSummary(
        total_centres=len(centres),
        total_bookings_today=total_bookings,
        total_procured_quintals=round(total_procured, 2),
        avg_wait_time_min=round(avg_wait, 1),
        avg_turnaround_time_min=round(avg_wait * 2, 1),
        no_show_rate=round(no_show_rate, 1),
        rejection_rate=round(rejection_rate, 1),
        centre_utilization=centre_utilization,
    )


@router.get("/centre/{centre_id}/wait-time-heatmap")
async def get_wait_time_heatmap(
    centre_id: str,
    days: int = Query(7, ge=1, le=30),
    session: AsyncSession = Depends(get_session),
):
    heatmap = []
    for i in range(days):
        d = datetime.now().date() - timedelta(days=i)
        start = datetime.combine(d, datetime.min.time())
        end = datetime.combine(d, datetime.max.time())
        
        result = await session.execute(
            select(func.avg(Booking.estimated_wait_min)).where(
                Booking.centre_id == centre_id,
                Booking.date >= start,
                Booking.date <= end,
            )
        )
        avg_wait = result.scalar() or 0
        
        heatmap.append({
            "date": d.isoformat(),
            "avg_wait_min": round(avg_wait, 1),
        })
    
    return {"centre_id": centre_id, "heatmap": list(reversed(heatmap))}


@router.get("/turnaround-by-crop")
async def get_turnaround_by_crop(session: AsyncSession = Depends(get_session)):
    result = await session.execute(
        select(
            Procurement.crop_code,
            func.avg(Procurement.net_weight_quintals).label("avg_weight"),
            func.count(Procurement.id).label("count"),
        ).group_by(Procurement.crop_code)
    )
    rows = result.all()
    
    return {
        "turnaround_by_crop": [
            {
                "crop_code": r.crop_code,
                "avg_weight_quintals": round(r.avg_weight, 2),
                "procurements": r.count,
            }
            for r in rows
        ]
    }


@router.get("/utilization")
async def get_utilization(session: AsyncSession = Depends(get_session)):
    result = await session.execute(select(Centre).where(Centre.status != CentreStatus.INACTIVE))
    centres = result.scalars().all()
    
    today = datetime.now().date()
    start = datetime.combine(today, datetime.min.time())
    end = datetime.combine(today, datetime.max.time())
    
    utilization = []
    for centre in centres:
        slots_result = await session.execute(
            select(func.sum(Slot.max_capacity)).where(Slot.centre_id == centre.id, Slot.date == today)
        )
        from app.models import Slot
        capacity = slots_result.scalar() or 0
        
        booked_result = await session.execute(
            select(func.count(Booking.id)).where(
                Booking.centre_id == centre.id,
                Booking.date >= start,
                Booking.date <= end,
            )
        )
        booked = booked_result.scalar() or 0
        
        completed_result = await session.execute(
            select(func.count(Booking.id)).where(
                Booking.centre_id == centre.id,
                Booking.date >= start,
                Booking.date <= end,
                Booking.status == BookingStatus.PROCUREMENT_COMPLETED,
            )
        )
        completed = completed_result.scalar() or 0
        
        utilization.append({
            "centre_id": centre.id,
            "centre_name": centre.name,
            "capacity": capacity,
            "booked": booked,
            "completed": completed,
            "utilization_pct": round((booked / max(capacity, 1)) * 100, 1),
            "completion_rate": round((completed / max(booked, 1)) * 100, 1),
        })
    
    return {"utilization": utilization}