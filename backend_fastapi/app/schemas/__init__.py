from pydantic import BaseModel, Field, EmailStr, field_validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


class Language(str, Enum):
    EN = "en"
    HI = "hi"
    PA = "pa"


class Role(str, Enum):
    FARMER = "FARMER"
    OFFICER = "OFFICER"
    ADMIN = "ADMIN"


class BookingStatus(str, Enum):
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


class CentreStatus(str, Enum):
    NORMAL = "NORMAL"
    MODERATE = "MODERATE"
    HEAVY = "HEAVY"
    SEVERE = "SEVERE"
    INACTIVE = "INACTIVE"


class QualityResult(str, Enum):
    ACCEPTED = "ACCEPTED"
    REJECTED = "REJECTED"


class PaymentStatus(str, Enum):
    PENDING = "PENDING"
    PROCESSING = "PROCESSING"
    PAID = "PAID"
    FAILED = "FAILED"


class GrievanceType(str, Enum):
    WEIGHT_DISPUTE = "WEIGHT_DISPUTE"
    QUALITY_ISSUE = "QUALITY_ISSUE"
    PAYMENT_ISSUE = "PAYMENT_ISSUE"
    TOKEN_ISSUE = "TOKEN_ISSUE"


class GrievanceStatus(str, Enum):
    SUBMITTED = "SUBMITTED"
    UNDER_REVIEW = "UNDER_REVIEW"
    RESOLVED = "RESOLVED"
    REJECTED = "REJECTED"


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: Role
    farmer_id: Optional[str] = None
    centre_id: Optional[str] = None


class OTPRequest(BaseModel):
    mobile: str = Field(..., pattern=r"^\+?[1-9]\d{9,14}$")


class OTPVerify(BaseModel):
    mobile: str
    otp: str = Field(..., min_length=4, max_length=6)


class FarmerCreate(BaseModel):
    mobile: str = Field(..., pattern=r"^\+?[1-9]\d{9,14}$")
    name: str = Field(..., min_length=2, max_length=100)
    aadhaar: Optional[str] = Field(None, pattern=r"^\d{12}$")
    district: Optional[str] = None
    village: Optional[str] = None
    bank_account: Optional[str] = None
    ifsc_code: Optional[str] = Field(None, pattern=r"^[A-Z]{4}0[A-Z0-9]{6}$")
    language: Language = Language.EN


class FarmerResponse(BaseModel):
    id: str
    mobile: str
    name: str
    aadhaar: Optional[str]
    district: Optional[str]
    village: Optional[str]
    bank_account: Optional[str]
    ifsc_code: Optional[str]
    language: Language
    created_at: datetime

    class Config:
        from_attributes = True


class FarmCreate(BaseModel):
    land_area_acres: float = Field(..., gt=0)
    crop_code: str
    variety: Optional[str] = None
    estimated_quantity_quintals: float = Field(..., gt=0)
    season: Optional[str] = None


class FarmResponse(BaseModel):
    id: str
    farmer_id: str
    land_area_acres: float
    crop_code: str
    variety: Optional[str]
    estimated_quantity_quintals: float
    season: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class CropInfo(BaseModel):
    code: str
    name: str
    msp_per_quintal: int
    icon: str


class CentreResponse(BaseModel):
    id: str
    code: str
    name: str
    district: str
    state: str
    address: Optional[str]
    latitude: float
    longitude: float
    capacity_per_slot: int
    active_counters: int
    status: CentreStatus
    operating_hours_start: str
    operating_hours_end: str
    contact_phone: Optional[str]

    class Config:
        from_attributes = True


class CentreWithQueue(CentreResponse):
    current_queue_length: int = 0
    estimated_wait_min: int = 0
    distance_km: Optional[float] = None
    available_slots_today: int = 0


class SlotCreate(BaseModel):
    centre_id: str
    date: datetime
    start_time: str = Field(..., pattern=r"^\d{2}:\d{2}$")
    end_time: str = Field(..., pattern=r"^\d{2}:\d{2}$")
    max_capacity: int = Field(20, gt=0)


class SlotResponse(BaseModel):
    id: str
    centre_id: str
    date: datetime
    start_time: str
    end_time: str
    max_capacity: int
    booked_count: int
    is_active: bool
    remaining_capacity: int

    class Config:
        from_attributes = True


class BookingCreate(BaseModel):
    farmer_id: str
    farm_id: str
    centre_id: str
    slot_id: str
    crop_code: str
    variety: Optional[str] = None
    quantity_quintals: float = Field(..., gt=0)


class BookingResponse(BaseModel):
    id: str
    farmer_id: str
    farm_id: Optional[str]
    centre_id: str
    slot_id: Optional[str]
    crop_code: str
    variety: Optional[str]
    quantity_quintals: float
    date: datetime
    time_slot: str
    token_number: str
    status: BookingStatus
    qr_code: Optional[str]
    check_in_time: Optional[datetime]
    estimated_wait_min: int
    plain_status: Dict[str, str]

    class Config:
        from_attributes = True


class BookingTimelineEvent(BaseModel):
    status: BookingStatus
    plain_status: Dict[str, str]
    timestamp: datetime
    notes: Optional[str] = None


class TokenGenerateResponse(BaseModel):
    token_number: str
    qr_code: str
    booking_id: str
    centre_name: str
    centre_address: str
    appointed_slot: str
    date: datetime


class TokenStatusResponse(BaseModel):
    token_number: str
    status: BookingStatus
    plain_status: Dict[str, str]
    position: int
    now_serving: int
    estimated_wait_min: int
    centre_name: str
    updated_at: datetime


class QueueMetrics(BaseModel):
    centre_id: str
    centre_name: str
    now_serving: int
    total_waiting: int
    active_counters: int
    avg_processing_min: float
    estimated_wait_min: int
    status: CentreStatus
    updated_at: datetime


class LiveQueueUpdate(BaseModel):
    token_number: str
    position: int
    now_serving: int
    estimated_wait_min: int
    status: BookingStatus
    plain_status: Dict[str, str]


class QualityCheckCreate(BaseModel):
    moisture_percent: float = Field(..., ge=0, le=30)
    foreign_matter_percent: float = Field(..., ge=0, le=10)
    damaged_grain_percent: float = Field(0, ge=0, le=20)
    notes: Optional[str] = None


class QualityCheckResponse(BaseModel):
    id: str
    procurement_id: str
    moisture_percent: float
    foreign_matter_percent: float
    damaged_grain_percent: float
    grade: str
    result: QualityResult
    notes: Optional[str]
    checked_at: datetime

    class Config:
        from_attributes = True


class WeighmentCreate(BaseModel):
    gross_weight_kg: float = Field(..., gt=0)
    tare_weight_kg: float = Field(..., ge=0)
    declared_quantity_kg: Optional[int] = None


class WeighmentResponse(BaseModel):
    id: str
    procurement_id: str
    gross_weight_kg: float
    tare_weight_kg: float
    net_weight_kg: float
    net_weight_quintals: float
    declared_quantity_kg: Optional[int]
    variance_kg: float
    verified: bool
    weighed_at: datetime

    class Config:
        from_attributes = True


class ProcurementResponse(BaseModel):
    id: str
    booking_id: str
    crop_code: str
    variety: Optional[str]
    quantity_quintals: float
    net_weight_quintals: float
    quality_grade: Optional[str]
    msp_rate: int
    gross_amount: float
    deductions: float
    net_amount: float
    receipt_number: str
    completed_at: datetime

    class Config:
        from_attributes = True


class PaymentResponse(BaseModel):
    id: str
    booking_id: str
    amount: float
    msp_rate: int
    net_weight_quintals: float
    status: PaymentStatus
    transaction_ref: Optional[str]
    bank_account: Optional[str]
    ifsc_code: Optional[str]
    initiated_at: Optional[datetime]
    processed_at: Optional[datetime]
    credited_at: Optional[datetime]

    class Config:
        from_attributes = True


class PaymentBreakdown(BaseModel):
    accepted_weight_quintals: float
    msp_rate_per_quintal: int
    gross_amount: float
    deductions: float
    net_payment: float
    payment_status: str
    plain_status: Dict[str, str]


class GrievanceCreate(BaseModel):
    farmer_id: str
    booking_id: Optional[str] = None
    type: GrievanceType
    title: str = Field(..., min_length=5, max_length=200)
    description: Optional[str] = None


class GrievanceResponse(BaseModel):
    id: str
    farmer_id: str
    booking_id: Optional[str]
    type: GrievanceType
    title: str
    description: Optional[str]
    status: GrievanceStatus
    resolution: Optional[str]
    submitted_at: datetime
    resolved_at: Optional[datetime]

    class Config:
        from_attributes = True


class CentreRecommendation(BaseModel):
    centre_id: str
    centre_name: str
    distance_km: float
    current_queue_length: int
    estimated_wait_min: int
    congestion_risk: CentreStatus
    score: float
    reasoning: str


class DemandForecast(BaseModel):
    centre_id: str
    date: datetime
    predicted_farmers: int
    predicted_quantity_quintals: float
    confidence: float


class CongestionPrediction(BaseModel):
    centre_id: str
    centre_name: str
    date: datetime
    expected_arrivals: int
    slot_capacity: int
    overload_risk: bool
    risk_score: int
    recommendation: str
    suggested_transfer_centre: Optional[str] = None
    suggested_transfer_centre_name: Optional[str] = None
    wait_time_savings_min: Optional[int] = None
    reasoning_chain: List[str]


class AIReasoningStep(BaseModel):
    step: int
    description: str
    input_data: Dict[str, Any]
    output: Dict[str, Any]


class CongestionPredictionWithReasoning(CongestionPrediction):
    reasoning_trace: List[AIReasoningStep]


class AnalyticsSummary(BaseModel):
    total_centres: int
    total_bookings_today: int
    total_procured_quintals: float
    avg_wait_time_min: float
    avg_turnaround_time_min: float
    no_show_rate: float
    rejection_rate: float
    centre_utilization: Dict[str, float]


class DemoStep(BaseModel):
    step: int
    title: str
    description: str
    actor: str
    api_endpoint: str
    expected_result: str