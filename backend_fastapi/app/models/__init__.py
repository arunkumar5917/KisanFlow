from sqlalchemy import Column, String, Integer, Float, DateTime, Boolean, ForeignKey, Enum, Text, Index, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.dialects.sqlite import TEXT as SQLITE_TEXT
import uuid
from datetime import datetime
from enum import Enum as PyEnum

from app.core.database import Base


class Role(PyEnum):
    FARMER = "FARMER"
    OFFICER = "OFFICER"
    ADMIN = "ADMIN"


class BookingStatus(PyEnum):
    BOOKED = "BOOKED"
    CONFIRMED = "CONFIRMED"
    ARRIVED = "ARRIVED"
    QUALITY_CHECK = "QUALITY_CHECK"
    WEIGHMENT = "WEIGHMENT"
    APPROVED = "APPROVED"
    PROCUREMENT_COMPLETED = "PROCUREMENT_COMPLETED"
    PAYMENT_INITIATED = "PAYMENT_INITIATED"
    PAYMENT_PROCESSING = "PAYMENT_PROCESSING"
    PAID = "PAID"
    CANCELLED = "CANCELLED"
    NO_SHOW = "NO_SHOW"
    QUALITY_REJECTED = "QUALITY_REJECTED"
    WEIGHT_DISPUTE = "WEIGHT_DISPUTE"
    PAYMENT_FAILED = "PAYMENT_FAILED"


class CentreStatus(PyEnum):
    NORMAL = "NORMAL"
    MODERATE = "MODERATE"
    HEAVY = "HEAVY"
    SEVERE = "SEVERE"
    INACTIVE = "INACTIVE"


class QualityResult(PyEnum):
    ACCEPTED = "ACCEPTED"
    REJECTED = "REJECTED"


class PaymentStatus(PyEnum):
    PENDING = "PENDING"
    PROCESSING = "PROCESSING"
    PAID = "PAID"
    FAILED = "FAILED"


class GrievanceType(PyEnum):
    WEIGHT_DISPUTE = "WEIGHT_DISPUTE"
    QUALITY_ISSUE = "QUALITY_ISSUE"
    PAYMENT_ISSUE = "PAYMENT_ISSUE"
    TOKEN_ISSUE = "TOKEN_ISSUE"


class GrievanceStatus(PyEnum):
    SUBMITTED = "SUBMITTED"
    UNDER_REVIEW = "UNDER_REVIEW"
    RESOLVED = "RESOLVED"
    REJECTED = "REJECTED"


def generate_uuid() -> str:
    return str(uuid.uuid4())


class Farmer(Base):
    __tablename__ = "farmers"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    mobile = Column(String(15), unique=True, nullable=False, index=True)
    name = Column(String(100), nullable=False)
    aadhaar = Column(String(14), unique=True, nullable=True, index=True)
    district = Column(String(50), nullable=True)
    village = Column(String(100), nullable=True)
    bank_account = Column(String(20), nullable=True)
    ifsc_code = Column(String(11), nullable=True)
    language = Column(String(5), default="en")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    farms = relationship("Farm", back_populates="farmer", cascade="all, delete-orphan")
    bookings = relationship("Booking", back_populates="farmer", cascade="all, delete-orphan")
    grievances = relationship("Grievance", back_populates="farmer", cascade="all, delete-orphan")
    notifications = relationship("NotificationLog", back_populates="farmer", cascade="all, delete-orphan")


class Farm(Base):
    __tablename__ = "farms"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    farmer_id = Column(String(36), ForeignKey("farmers.id", ondelete="CASCADE"), nullable=False, index=True)
    land_area_acres = Column(Float, nullable=False)
    crop_code = Column(String(20), nullable=False)
    variety = Column(String(50), nullable=True)
    estimated_quantity_quintals = Column(Float, nullable=False)
    season = Column(String(20), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    farmer = relationship("Farmer", back_populates="farms")


class Centre(Base):
    __tablename__ = "centres"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    code = Column(String(20), unique=True, nullable=False, index=True)
    name = Column(String(100), nullable=False)
    district = Column(String(50), nullable=False, index=True)
    state = Column(String(50), default="Punjab")
    address = Column(Text, nullable=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    capacity_per_slot = Column(Integer, default=20)
    active_counters = Column(Integer, default=3)
    status = Column(Enum(CentreStatus), default=CentreStatus.NORMAL, index=True)
    operating_hours_start = Column(String(5), default="09:00")
    operating_hours_end = Column(String(5), default="17:00")
    contact_phone = Column(String(15), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    slots = relationship("Slot", back_populates="centre", cascade="all, delete-orphan")
    bookings = relationship("Booking", back_populates="centre")
    queue_events = relationship("QueueEvent", back_populates="centre")


class Slot(Base):
    __tablename__ = "slots"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    centre_id = Column(String(36), ForeignKey("centres.id", ondelete="CASCADE"), nullable=False, index=True)
    date = Column(DateTime, nullable=False, index=True)
    start_time = Column(String(5), nullable=False)
    end_time = Column(String(5), nullable=False)
    max_capacity = Column(Integer, default=20)
    booked_count = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    centre = relationship("Centre", back_populates="slots")
    bookings = relationship("Booking", back_populates="slot")

    __table_args__ = (
        UniqueConstraint("centre_id", "date", "start_time", name="uq_centre_date_time"),
        Index("ix_slots_centre_date", "centre_id", "date"),
    )


class Booking(Base):
    __tablename__ = "bookings"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    farmer_id = Column(String(36), ForeignKey("farmers.id", ondelete="CASCADE"), nullable=False, index=True)
    farm_id = Column(String(36), ForeignKey("farms.id", ondelete="SET NULL"), nullable=True)
    centre_id = Column(String(36), ForeignKey("centres.id", ondelete="CASCADE"), nullable=False, index=True)
    slot_id = Column(String(36), ForeignKey("slots.id", ondelete="SET NULL"), nullable=True)
    crop_code = Column(String(20), nullable=False)
    variety = Column(String(50), nullable=True)
    quantity_quintals = Column(Float, nullable=False)
    date = Column(DateTime, nullable=False, index=True)
    time_slot = Column(String(11), nullable=False)
    token_number = Column(String(20), unique=True, nullable=False, index=True)
    status = Column(Enum(BookingStatus), default=BookingStatus.BOOKED, index=True)
    qr_code = Column(Text, nullable=True)
    check_in_time = Column(DateTime, nullable=True)
    estimated_wait_min = Column(Integer, default=0)
    actual_wait_min = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    farmer = relationship("Farmer", back_populates="bookings")
    farm = relationship("Farm")
    centre = relationship("Centre", back_populates="bookings")
    slot = relationship("Slot", back_populates="bookings")
    procurement = relationship("Procurement", back_populates="booking", uselist=False, cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="booking", cascade="all, delete-orphan")
    grievances = relationship("Grievance", back_populates="booking", cascade="all, delete-orphan")
    queue_events = relationship("QueueEvent", back_populates="booking", cascade="all, delete-orphan")


class QueueEvent(Base):
    __tablename__ = "queue_events"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    booking_id = Column(String(36), ForeignKey("bookings.id", ondelete="CASCADE"), nullable=False, index=True)
    centre_id = Column(String(36), ForeignKey("centres.id", ondelete="CASCADE"), nullable=False, index=True)
    event_type = Column(String(30), nullable=False)
    position = Column(Integer, default=0)
    now_serving = Column(Integer, default=0)
    wait_estimate_min = Column(Integer, default=0)
    counter_number = Column(Integer, nullable=True)
    metadata = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    booking = relationship("Booking", back_populates="queue_events")
    centre = relationship("Centre", back_populates="queue_events")


class Procurement(Base):
    __tablename__ = "procurements"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    booking_id = Column(String(36), ForeignKey("bookings.id", ondelete="CASCADE"), unique=True, nullable=False)
    crop_code = Column(String(20), nullable=False)
    variety = Column(String(50), nullable=True)
    quantity_quintals = Column(Float, nullable=False)
    net_weight_quintals = Column(Float, nullable=False)
    quality_grade = Column(String(10), nullable=True)
    msp_rate = Column(Integer, nullable=False)
    gross_amount = Column(Float, nullable=False)
    deductions = Column(Float, default=0)
    net_amount = Column(Float, nullable=False)
    receipt_number = Column(String(30), unique=True, nullable=False, index=True)
    completed_at = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)

    booking = relationship("Booking", back_populates="procurement")
    quality_check = relationship("QualityCheck", back_populates="procurement", uselist=False, cascade="all, delete-orphan")
    weighment = relationship("Weighment", back_populates="procurement", uselist=False, cascade="all, delete-orphan")


class QualityCheck(Base):
    __tablename__ = "quality_checks"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    procurement_id = Column(String(36), ForeignKey("procurements.id", ondelete="CASCADE"), unique=True, nullable=False)
    moisture_percent = Column(Float, nullable=False)
    foreign_matter_percent = Column(Float, nullable=False)
    damaged_grain_percent = Column(Float, default=0)
    grade = Column(String(10), nullable=False)
    result = Column(Enum(QualityResult), nullable=False)
    notes = Column(Text, nullable=True)
    checked_at = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)

    procurement = relationship("Procurement", back_populates="quality_check")


class Weighment(Base):
    __tablename__ = "weighments"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    procurement_id = Column(String(36), ForeignKey("procurements.id", ondelete="CASCADE"), unique=True, nullable=False)
    gross_weight_kg = Column(Float, nullable=False)
    tare_weight_kg = Column(Float, nullable=False)
    net_weight_kg = Column(Float, nullable=False)
    net_weight_quintals = Column(Float, nullable=False)
    declared_quantity_kg = Column(Integer, nullable=True)
    variance_kg = Column(Float, default=0)
    verified = Column(Boolean, default=False)
    weighed_at = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)

    procurement = relationship("Procurement", back_populates="weighment")


class Payment(Base):
    __tablename__ = "payments"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    booking_id = Column(String(36), ForeignKey("bookings.id", ondelete="CASCADE"), nullable=False, index=True)
    procurement_id = Column(String(36), ForeignKey("procurements.id", ondelete="CASCADE"), nullable=True)
    amount = Column(Float, nullable=False)
    msp_rate = Column(Integer, nullable=False)
    net_weight_quintals = Column(Float, nullable=False)
    status = Column(Enum(PaymentStatus), default=PaymentStatus.PENDING, index=True)
    transaction_ref = Column(String(50), unique=True, nullable=True, index=True)
    bank_account = Column(String(20), nullable=True)
    ifsc_code = Column(String(11), nullable=True)
    initiated_at = Column(DateTime, nullable=True)
    processed_at = Column(DateTime, nullable=True)
    credited_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    booking = relationship("Booking", back_populates="payments")


class Grievance(Base):
    __tablename__ = "grievances"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    farmer_id = Column(String(36), ForeignKey("farmers.id", ondelete="CASCADE"), nullable=False, index=True)
    booking_id = Column(String(36), ForeignKey("bookings.id", ondelete="CASCADE"), nullable=True, index=True)
    type = Column(Enum(GrievanceType), nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(Enum(GrievanceStatus), default=GrievanceStatus.SUBMITTED, index=True)
    resolution = Column(Text, nullable=True)
    submitted_at = Column(DateTime, default=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    farmer = relationship("Farmer", back_populates="grievances")
    booking = relationship("Booking", back_populates="grievances")


class NotificationLog(Base):
    __tablename__ = "notification_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    farmer_id = Column(String(36), ForeignKey("farmers.id", ondelete="CASCADE"), nullable=False, index=True)
    booking_id = Column(String(36), ForeignKey("bookings.id", ondelete="SET NULL"), nullable=True)
    channel = Column(String(10), nullable=False)
    template = Column(String(50), nullable=False)
    message = Column(Text, nullable=False)
    status = Column(String(20), default="SENT")
    sent_at = Column(DateTime, default=datetime.utcnow)

    farmer = relationship("Farmer", back_populates="notifications")