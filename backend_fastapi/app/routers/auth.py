from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timedelta
from typing import Optional

from app.core.database import get_session
from app.core.config import get_settings
from app.models import Farmer
from app.schemas import OTPRequest, OTPVerify, TokenResponse, Role, FarmerResponse, Language
from app.services.notifications import notification_service
from app.services.state_machine import StateMachine

router = APIRouter(prefix="/auth", tags=["Authentication"])
settings = get_settings()


@router.post("/request-otp", response_model=dict)
async def request_otp(request: OTPRequest, session: AsyncSession = Depends(get_session)):
    otp = notification_service.generate_otp()
    
    result = await session.execute(select(Farmer).where(Farmer.mobile == request.mobile))
    farmer = result.scalar_one_or_none()
    
    if not farmer:
        farmer = Farmer(
            mobile=request.mobile,
            name="New Farmer",
            language=Language.EN,
        )
        session.add(farmer)
        await session.flush()
    
    if not settings.DEBUG:
        logger.info(f"OTP for {request.mobile}: {otp}")
    
    await notification_service.log_notification(
        session, farmer.id, "SMS", "OTP", f"Your OTP is {otp}"
    )
    
    return {
        "message": "OTP sent",
        "demo_otp": settings.DEMO_OTP if settings.DEBUG else None,
        "mobile": request.mobile,
    }


@router.post("/verify-otp", response_model=TokenResponse)
async def verify_otp(request: OTPVerify, session: AsyncSession = Depends(get_session)):
    if not notification_service.validate_otp(request.mobile, request.otp):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid OTP")
    
    result = await session.execute(select(Farmer).where(Farmer.mobile == request.mobile))
    farmer = result.scalar_one_or_none()
    
    if not farmer:
        farmer = Farmer(
            mobile=request.mobile,
            name="New Farmer",
            language=Language.EN,
        )
        session.add(farmer)
        await session.flush()
    
    from jose import jwt
    payload = {
        "sub": farmer.id,
        "mobile": farmer.mobile,
        "role": Role.FARMER,
        "exp": datetime.utcnow() + timedelta(minutes=settings.JWT_EXPIRY_MINUTES),
    }
    token = jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    
    return TokenResponse(
        access_token=token,
        role=Role.FARMER,
        farmer_id=farmer.id,
    )


@router.post("/officer/login", response_model=TokenResponse)
async def officer_login(centre_code: str, session: AsyncSession = Depends(get_session)):
    from app.models import Centre
    result = await session.execute(select(Centre).where(Centre.code == centre_code))
    centre = result.scalar_one_or_none()
    
    if not centre:
        raise HTTPException(status_code=404, detail="Centre not found")
    
    from jose import jwt
    payload = {
        "sub": f"officer_{centre.id}",
        "centre_id": centre.id,
        "role": Role.OFFICER,
        "exp": datetime.utcnow() + timedelta(minutes=settings.JWT_EXPIRY_MINUTES),
    }
    token = jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    
    return TokenResponse(
        access_token=token,
        role=Role.OFFICER,
        centre_id=centre.id,
    )


@router.get("/me", response_model=FarmerResponse)
async def get_current_farmer(
    farmer_id: str,
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(select(Farmer).where(Farmer.id == farmer_id))
    farmer = result.scalar_one_or_none()
    
    if not farmer:
        raise HTTPException(status_code=404, detail="Farmer not found")
    
    return FarmerResponse.model_validate(farmer)