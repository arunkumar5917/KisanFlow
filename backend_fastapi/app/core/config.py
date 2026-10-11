import os
from functools import lru_cache
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    APP_NAME: str = "Smart Agricultural Procurement Platform"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True

    DATABASE_URL: Optional[str] = os.getenv("DATABASE_URL")
    SQLITE_FALLBACK: str = "sqlite+aiosqlite:///./platform.db"

    REDIS_URL: Optional[str] = os.getenv("REDIS_URL")

    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "dev-secret-change-in-production")
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRY_MINUTES: int = 60 * 24 * 7

    OTP_LENGTH: int = 6
    OTP_EXPIRY_MINUTES: int = 10
    DEMO_OTP: str = "123456"

    CORS_ORIGINS: list[str] = ["*"]

    MOCK_SMS_ENABLED: bool = True
    MOCK_FCM_ENABLED: bool = True

    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache
def get_settings() -> Settings:
    return Settings()


PLAIN_LANGUAGE_STATES = {
    "BOOKED": {"en": "Slot Reserved", "hi": "स्लॉट आरक्षित", "pa": "ਸਲਾਟ ਰਿਜ਼ਰਵਡ"},
    "CONFIRMED": {"en": "Appointment Confirmed", "hi": "अपॉइंटमेंट पुष्टि", "pa": "ਅਪੌਇੰਟਮੈਂਟ ਪੁਸ਼ਟੀ"},
    "ARRIVED": {"en": "Arrived at Centre", "hi": "केंद्र पर पहुंचे", "pa": "ਕੇਂਦਰ 'ਤੇ ਪਹੁੰਚੇ"},
    "QUALITY_CHECK": {"en": "Quality Inspection", "hi": "गुणवत्ता जांच", "pa": "ਗੁਣਵੱਤਾ ਜਾਂਚ"},
    "WEIGHMENT": {"en": "Produce Weighment", "hi": "उपज तोल", "pa": "ਫ਼ਸਲ ਤੌਲ"},
    "APPROVED": {"en": "Approved", "hi": "स्वीकृत", "pa": "ਮਨਜ਼ੂਰ"},
    "PROCUREMENT_COMPLETED": {"en": "Procurement Completed", "hi": "खरीद पूर्ण", "pa": "ਖਰੀਦ ਪੂਰੀ"},
    "PAYMENT_INITIATED": {"en": "Payment Order Created", "hi": "भुगतान ऑर्डर बना", "pa": "ਭੁਗਤਾਨ ਆਰਡਰ ਬਣਿਆ"},
    "PAYMENT_PROCESSING": {"en": "Bank Transfer in Progress", "hi": "बैंक ट्रांसफर जारी", "pa": "ਬੈਂਕ ਟ੍ਰਾਂਸਫ਼ਰ ਜਾਰੀ"},
    "PAID": {"en": "Paid to Bank Account", "hi": "बैंक खाते में जमा", "pa": "ਬੈਂਕ ਖਾਤੇ ਵਿੱਚ ਜਮਾ"},
    "CANCELLED": {"en": "Cancelled", "hi": "रद्द", "pa": "ਰੱਦ"},
    "NO_SHOW": {"en": "Did Not Arrive", "hi": "नहीं पहुंचे", "pa": "ਨਹੀਂ ਪਹੁੰਚੇ"},
    "QUALITY_REJECTED": {"en": "Quality Rejected", "hi": "गुणवत्ता अस्वीकृत", "pa": "ਗੁਣਵੱਤਾ ਅਸਵੀਕ੍ਰਿਤ"},
    "WEIGHT_DISPUTE": {"en": "Weight Dispute", "hi": "वजन विवाद", "pa": "ਵਜ਼ਨ ਵਿਵਾਦ"},
    "PAYMENT_FAILED": {"en": "Payment Failed", "hi": "भुगतान विफल", "pa": "ਭੁਗਤਾਨ ਅਸਫਲ"},
}

CROPS = [
    {"code": "WHEAT", "name_en": "Wheat", "name_hi": "गेहूं", "name_pa": "ਕਣਕ", "msp_per_quintal": 2275, "icon": "🌾"},
    {"code": "PADDY", "name_en": "Paddy", "name_hi": "धान", "name_pa": "ਧਾਨ", "msp_per_quintal": 2183, "icon": "🌾"},
    {"code": "MUSTARD", "name_en": "Mustard", "name_hi": "सरसों", "name_pa": "ਸਰਸੋਂ", "msp_per_quintal": 5650, "icon": "🌿"},
    {"code": "GRAM", "name_en": "Gram", "name_hi": "चना", "name_pa": "ਚਨਾ", "msp_per_quintal": 5335, "icon": "🌱"},
    {"code": "MAIZE", "name_en": "Maize", "name_hi": "मक्का", "name_pa": "ਮੱਕੀ", "msp_per_quintal": 2090, "icon": "🌽"},
]

QUALITY_NORMS = {
    "WHEAT": {"moisture_max": 12.0, "foreign_matter_max": 0.75, "damaged_max": 2.0},
    "PADDY": {"moisture_max": 17.0, "foreign_matter_max": 1.0, "damaged_max": 3.0},
    "MUSTARD": {"moisture_max": 8.0, "foreign_matter_max": 1.0, "damaged_max": 2.0},
    "GRAM": {"moisture_max": 12.0, "foreign_matter_max": 1.0, "damaged_max": 2.0},
    "MAIZE": {"moisture_max": 14.0, "foreign_matter_max": 1.0, "damaged_max": 3.0},
}


def get_plain_state(state: str, lang: str = "en") -> str:
    return PLAIN_LANGUAGE_STATES.get(state, {}).get(lang, state)


def get_crop_info(crop_code: str, lang: str = "en") -> dict:
    for crop in CROPS:
        if crop["code"] == crop_code:
            name_key = f"name_{lang}"
            return {
                "code": crop["code"],
                "name": crop.get(name_key, crop["name_en"]),
                "msp_per_quintal": crop["msp_per_quintal"],
                "icon": crop["icon"],
            }
    return {"code": crop_code, "name": crop_code, "msp_per_quintal": 0, "icon": "🌾"}


def get_quality_norms(crop_code: str) -> dict:
    return QUALITY_NORMS.get(crop_code, {"moisture_max": 12.0, "foreign_matter_max": 1.0, "damaged_max": 2.0})