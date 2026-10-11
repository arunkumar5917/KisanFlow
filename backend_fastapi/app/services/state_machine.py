from typing import Dict, List, Optional, Set
from enum import Enum

from app.schemas import BookingStatus
from app.core.config import get_plain_state


VALID_TRANSITIONS: Dict[BookingStatus, Set[BookingStatus]] = {
    BookingStatus.BOOKED: {BookingStatus.CONFIRMED, BookingStatus.CANCELLED},
    BookingStatus.CONFIRMED: {BookingStatus.ARRIVED, BookingStatus.CANCELLED, BookingStatus.NO_SHOW},
    BookingStatus.ARRIVED: {BookingStatus.QUALITY_CHECK, BookingStatus.CANCELLED},
    BookingStatus.QUALITY_CHECK: {BookingStatus.WEIGHMENT, BookingStatus.QUALITY_REJECTED, BookingStatus.CANCELLED},
    BookingStatus.WEIGHMENT: {BookingStatus.APPROVED, BookingStatus.WEIGHT_DISPUTE, BookingStatus.CANCELLED},
    BookingStatus.APPROVED: {BookingStatus.PROCUREMENT_COMPLETED, BookingStatus.CANCELLED},
    BookingStatus.PROCUREMENT_COMPLETED: {BookingStatus.PAYMENT_INITIATED, BookingStatus.CANCELLED},
    BookingStatus.PAYMENT_INITIATED: {BookingStatus.PAYMENT_PROCESSING, BookingStatus.PAYMENT_FAILED},
    BookingStatus.PAYMENT_PROCESSING: {BookingStatus.PAID, BookingStatus.PAYMENT_FAILED},
    BookingStatus.PAID: set(),
    BookingStatus.CANCELLED: set(),
    BookingStatus.NO_SHOW: set(),
    BookingStatus.QUALITY_REJECTED: {BookingStatus.CANCELLED},
    BookingStatus.WEIGHT_DISPUTE: {BookingStatus.CANCELLED, BookingStatus.WEIGHMENT},
    BookingStatus.PAYMENT_FAILED: {BookingStatus.PAYMENT_INITIATED},
}

TERMINAL_STATES = {
    BookingStatus.PAID,
    BookingStatus.CANCELLED,
    BookingStatus.NO_SHOW,
    BookingStatus.QUALITY_REJECTED,
    BookingStatus.PAYMENT_FAILED,
}

FARMER_VISIBLE_STATES = [
    BookingStatus.BOOKED,
    BookingStatus.CONFIRMED,
    BookingStatus.ARRIVED,
    BookingStatus.QUALITY_CHECK,
    BookingStatus.WEIGHMENT,
    BookingStatus.APPROVED,
    BookingStatus.PROCUREMENT_COMPLETED,
    BookingStatus.PAYMENT_INITIATED,
    BookingStatus.PAYMENT_PROCESSING,
    BookingStatus.PAID,
    BookingStatus.CANCELLED,
    BookingStatus.NO_SHOW,
    BookingStatus.QUALITY_REJECTED,
    BookingStatus.WEIGHT_DISPUTE,
    BookingStatus.PAYMENT_FAILED,
]


class StateMachine:
    @staticmethod
    def can_transition(current: BookingStatus, target: BookingStatus) -> bool:
        if current == target:
            return True
        return target in VALID_TRANSITIONS.get(current, set())

    @staticmethod
    def get_valid_next_states(current: BookingStatus) -> List[BookingStatus]:
        return list(VALID_TRANSITIONS.get(current, set()))

    @staticmethod
    def is_terminal(state: BookingStatus) -> bool:
        return state in TERMINAL_STATES

    @staticmethod
    def get_plain_language(state: BookingStatus, lang: str = "en") -> str:
        return get_plain_state(state.value, lang)

    @staticmethod
    def get_all_plain_states(lang: str = "en") -> Dict[str, str]:
        result = {}
        for status in FARMER_VISIBLE_STATES:
            result[status.value] = get_plain_state(status.value, lang)
        return result

    @staticmethod
    def validate_sequence(states: List[BookingStatus]) -> bool:
        for i in range(len(states) - 1):
            if not StateMachine.can_transition(states[i], states[i + 1]):
                return False
        return True

    @staticmethod
    def get_progress_percentage(current: BookingStatus) -> float:
        progress_map = {
            BookingStatus.BOOKED: 10,
            BookingStatus.CONFIRMED: 20,
            BookingStatus.ARRIVED: 30,
            BookingStatus.QUALITY_CHECK: 45,
            BookingStatus.WEIGHMENT: 60,
            BookingStatus.APPROVED: 75,
            BookingStatus.PROCUREMENT_COMPLETED: 85,
            BookingStatus.PAYMENT_INITIATED: 90,
            BookingStatus.PAYMENT_PROCESSING: 95,
            BookingStatus.PAID: 100,
            BookingStatus.CANCELLED: 0,
            BookingStatus.NO_SHOW: 0,
            BookingStatus.QUALITY_REJECTED: 0,
            BookingStatus.WEIGHT_DISPUTE: 50,
            BookingStatus.PAYMENT_FAILED: 85,
        }
        return progress_map.get(current, 0)

    @staticmethod
    def get_step_order() -> List[BookingStatus]:
        return [
            BookingStatus.BOOKED,
            BookingStatus.CONFIRMED,
            BookingStatus.ARRIVED,
            BookingStatus.QUALITY_CHECK,
            BookingStatus.WEIGHMENT,
            BookingStatus.APPROVED,
            BookingStatus.PROCUREMENT_COMPLETED,
            BookingStatus.PAYMENT_INITIATED,
            BookingStatus.PAYMENT_PROCESSING,
            BookingStatus.PAID,
        ]