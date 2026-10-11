import random
import logging
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models import NotificationLog, Farmer, Booking
from app.core.config import get_settings, get_plain_state
from app.schemas import BookingStatus

logger = logging.getLogger(__name__)
settings = get_settings()


class NotificationService:
    def __init__(self):
        self.demo_mode = True

    def generate_otp(self) -> str:
        return settings.DEMO_OTP if self.demo_mode else str(random.randint(100000, 999999))

    def validate_otp(self, mobile: str, otp: str) -> bool:
        if self.demo_mode and otp == settings.DEMO_OTP:
            return True
        return False

    async def log_notification(
        self,
        session: AsyncSession,
        farmer_id: str,
        channel: str,
        template: str,
        message: str,
        booking_id: Optional[str] = None,
    ) -> NotificationLog:
        log = NotificationLog(
            farmer_id=farmer_id,
            booking_id=booking_id,
            channel=channel,
            template=template,
            message=message,
            status="SENT",
            sent_at=datetime.utcnow(),
        )
        session.add(log)
        await session.flush()
        return log

    async def send_booking_confirmation(
        self,
        session: AsyncSession,
        farmer: Farmer,
        booking: Booking,
    ) -> None:
        plain_status = get_plain_state(booking.status.value, farmer.language)
        message = (
            f"Your slot is confirmed at {booking.centre.name} on "
            f"{booking.date.strftime('%d %b %Y')} at {booking.time_slot}. "
            f"Token: {booking.token_number}. Status: {plain_status}"
        )
        
        if settings.MOCK_SMS_ENABLED:
            await self.log_notification(session, farmer.id, "SMS", "BOOKING_CONFIRMED", message, booking.id)
            logger.info(f"[MOCK SMS] To {farmer.mobile}: {message}")
        
        if settings.MOCK_FCM_ENABLED:
            await self.log_notification(session, farmer.id, "FCM", "BOOKING_CONFIRMED", message, booking.id)
            logger.info(f"[MOCK FCM] To {farmer.id}: {message}")

    async def send_queue_update(
        self,
        session: AsyncSession,
        farmer: Farmer,
        booking: Booking,
        position: int,
        now_serving: int,
        estimated_wait: int,
    ) -> None:
        plain_status = get_plain_state(booking.status.value, farmer.language)
        message = (
            f"Queue Update: Token {booking.token_number} - "
            f"{position} farmers ahead. Now serving: {now_serving}. "
            f"Estimated wait: {estimated_wait} min. Status: {plain_status}"
        )
        
        if settings.MOCK_SMS_ENABLED:
            await self.log_notification(session, farmer.id, "SMS", "QUEUE_UPDATE", message, booking.id)
            logger.info(f"[MOCK SMS] To {farmer.mobile}: {message}")
        
        if settings.MOCK_FCM_ENABLED:
            await self.log_notification(session, farmer.id, "FCM", "QUEUE_UPDATE", message, booking.id)
            logger.info(f"[MOCK FCM] To {farmer.id}: {message}")

    async def send_status_change(
        self,
        session: AsyncSession,
        farmer: Farmer,
        booking: Booking,
        new_status: BookingStatus,
    ) -> None:
        plain_status = get_plain_state(new_status.value, farmer.language)
        message = f"Status Update: Token {booking.token_number} - {plain_status}"
        
        if settings.MOCK_SMS_ENABLED:
            await self.log_notification(session, farmer.id, "SMS", "STATUS_CHANGE", message, booking.id)
            logger.info(f"[MOCK SMS] To {farmer.mobile}: {message}")
        
        if settings.MOCK_FCM_ENABLED:
            await self.log_notification(session, farmer.id, "FCM", "STATUS_CHANGE", message, booking.id)
            logger.info(f"[MOCK FCM] To {farmer.id}: {message}")

    async def send_payment_notification(
        self,
        session: AsyncSession,
        farmer: Farmer,
        booking: Booking,
        amount: float,
        status: str,
    ) -> None:
        plain_status = get_plain_state(status, farmer.language) if status in [s.value for s in BookingStatus] else status
        message = (
            f"Payment Update: ₹{amount:,.2f} for token {booking.token_number}. "
            f"Status: {plain_status}. Will be credited to your bank account."
        )
        
        if settings.MOCK_SMS_ENABLED:
            await self.log_notification(session, farmer.id, "SMS", "PAYMENT_UPDATE", message, booking.id)
            logger.info(f"[MOCK SMS] To {farmer.mobile}: {message}")
        
        if settings.MOCK_FCM_ENABLED:
            await self.log_notification(session, farmer.id, "FCM", "PAYMENT_UPDATE", message, booking.id)
            logger.info(f"[MOCK FCM] To {farmer.id}: {message}")

    async def send_quality_result(
        self,
        session: AsyncSession,
        farmer: Farmer,
        booking: Booking,
        grade: str,
        accepted: bool,
    ) -> None:
        result_text = "ACCEPTED" if accepted else "REJECTED"
        message = f"Quality Check: Token {booking.token_number} - Grade {grade} ({result_text})"
        
        if settings.MOCK_SMS_ENABLED:
            await self.log_notification(session, farmer.id, "SMS", "QUALITY_RESULT", message, booking.id)
            logger.info(f"[MOCK SMS] To {farmer.mobile}: {message}")
        
        if settings.MOCK_FCM_ENABLED:
            await self.log_notification(session, farmer.id, "FCM", "QUALITY_RESULT", message, booking.id)
            logger.info(f"[MOCK FCM] To {farmer.id}: {message}")

    async def send_weighment_complete(
        self,
        session: AsyncSession,
        farmer: Farmer,
        booking: Booking,
        net_weight_quintals: float,
    ) -> None:
        message = f"Weighment Complete: Token {booking.token_number} - Net weight: {net_weight_quintals:.2f} quintals"
        
        if settings.MOCK_SMS_ENABLED:
            await self.log_notification(session, farmer.id, "SMS", "WEIGHMENT_COMPLETE", message, booking.id)
            logger.info(f"[MOCK SMS] To {farmer.mobile}: {message}")
        
        if settings.MOCK_FCM_ENABLED:
            await self.log_notification(session, farmer.id, "FCM", "WEIGHMENT_COMPLETE", message, booking.id)
            logger.info(f"[MOCK FCM] To {farmer.id}: {message}")


notification_service = NotificationService()