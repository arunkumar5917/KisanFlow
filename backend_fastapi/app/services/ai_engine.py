import random
import math
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from dataclasses import dataclass

from app.schemas import (
    CentreRecommendation,
    DemandForecast,
    CongestionPrediction,
    CongestionPredictionWithReasoning,
    AIReasoningStep,
    CentreStatus,
)
from app.models import Centre, Slot, Booking
from app.core.config import CROPS, get_quality_norms


@dataclass
class CentreMetrics:
    centre_id: str
    name: str
    latitude: float
    longitude: float
    active_counters: int
    capacity_per_slot: int
    current_queue: int
    status: CentreStatus
    slots_today: List[Slot]
    bookings_today: List[Booking]


class AIEngine:
    def __init__(self):
        self.random_seed = 42
        random.seed(self.random_seed)

    def _haversine_distance(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        R = 6371
        dlat = math.radians(lat2 - lat1)
        dlon = math.radians(lon2 - lon1)
        a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon/2)**2
        return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))

    def forecast_demand(
        self,
        centre: Centre,
        days_ahead: int = 7,
        historical_arrivals: Optional[List[int]] = None,
        weather_alert: bool = False,
        harvest_surge: bool = False,
    ) -> List[DemandForecast]:
        results = []
        base_arrivals = historical_arrivals or [random.randint(30, 80) for _ in range(7)]
        
        for i in range(days_ahead):
            date = datetime.now() + timedelta(days=i)
            day_base = base_arrivals[i % len(base_arrivals)]
            
            multiplier = 1.0
            if date.weekday() >= 5:
                multiplier *= 0.7
            if weather_alert:
                multiplier *= 0.5
            if harvest_surge:
                multiplier *= 1.5
            
            predicted_farmers = int(day_base * multiplier * random.uniform(0.8, 1.2))
            predicted_qty = predicted_farmers * random.uniform(20, 60)
            confidence = random.uniform(0.7, 0.95)
            
            results.append(DemandForecast(
                centre_id=centre.id,
                date=date,
                predicted_farmers=predicted_farmers,
                predicted_quantity_quintals=round(predicted_qty, 1),
                confidence=round(confidence, 2),
            ))
        return results

    def predict_wait_time(
        self,
        queue_ahead: int,
        avg_processing_min: float,
        active_counters: int,
    ) -> int:
        if active_counters <= 0:
            active_counters = 1
        wait = (queue_ahead * avg_processing_min) / active_counters
        return max(0, int(wait * random.uniform(0.9, 1.1)))

    def recommend_centres(
        self,
        farmer_lat: float,
        farmer_lon: float,
        crop_code: str,
        centres: List[CentreMetrics],
        max_distance_km: float = 50,
    ) -> List[CentreRecommendation]:
        recommendations = []
        
        for centre in centres:
            distance = self._haversine_distance(farmer_lat, farmer_lon, centre.latitude, centre.longitude)
            if distance > max_distance_km:
                continue
            
            avg_processing = 8.0
            wait_time = self.predict_wait_time(centre.current_queue, avg_processing, centre.active_counters)
            
            congestion_score = {
                CentreStatus.NORMAL: 1,
                CentreStatus.MODERATE: 2,
                CentreStatus.HEAVY: 3,
                CentreStatus.SEVERE: 4,
                CentreStatus.INACTIVE: 5,
            }.get(centre.status, 3)
            
            score = (
                0.4 * (distance / max_distance_km) +
                0.35 * (wait_time / 60) +
                0.25 * (congestion_score / 5)
            )
            
            reasoning = (
                f"Distance: {distance:.1f}km (weight 40%), "
                f"Wait: {wait_time}min (weight 35%), "
                f"Congestion: {centre.status.value} (weight 25%)"
            )
            
            recommendations.append(CentreRecommendation(
                centre_id=centre.id,
                centre_name=centre.name,
                distance_km=round(distance, 1),
                current_queue_length=centre.current_queue,
                estimated_wait_min=wait_time,
                congestion_risk=centre.status,
                score=round(score, 3),
                reasoning=reasoning,
            ))
        
        recommendations.sort(key=lambda x: x.score)
        return recommendations

    def predict_congestion(
        self,
        centre: Centre,
        expected_arrivals: int,
        date: datetime,
    ) -> CongestionPredictionWithReasoning:
        slot_capacity = centre.capacity_per_slot * len(centre.slots_today) if hasattr(centre, 'slots_today') and centre.slots_today else centre.capacity_per_slot * 4
        overload_risk = expected_arrivals > slot_capacity * 1.15
        risk_score = min(100, int((expected_arrivals / max(slot_capacity, 1)) * 100))
        
        reasoning_steps = [
            AIReasoningStep(
                step=1,
                description="Input Parameters Collection",
                input_data={
                    "current_registrations": expected_arrivals,
                    "slot_capacity": slot_capacity,
                    "active_counters": centre.active_counters,
                    "weather_alert": False,
                    "harvest_surge": False,
                },
                output={"capacity_utilization_pct": round((expected_arrivals / max(slot_capacity, 1)) * 100, 1)}
            ),
            AIReasoningStep(
                step=2,
                description="Algorithmic Processing - Overload Detection",
                input_data={
                    "threshold": "115% of slot capacity",
                    "expected_arrivals": expected_arrivals,
                    "capacity_threshold": int(slot_capacity * 1.15),
                },
                output={
                    "overload_detected": overload_risk,
                    "risk_score": risk_score,
                }
            ),
            AIReasoningStep(
                step=3,
                description="Output Conclusion - Redistribution Recommendation",
                input_data={"overload_risk": overload_risk, "nearby_centres": []},
                output={
                    "recommendation": "Redistribute to nearby centres" if overload_risk else "No action needed",
                    "disclaimer": "Simulated synthetic data for demonstration",
                }
            ),
        ]
        
        suggestion = "No action needed"
        transfer_centre = None
        transfer_name = None
        wait_savings = None
        
        if overload_risk:
            suggestion = f"Divert {int(expected_arrivals - slot_capacity)} farmers to nearby under-utilized centres"
            transfer_centre = "NEARBY_CENTRE_001"
            transfer_name = "Nearby Under-utilized Centre"
            wait_savings = int((expected_arrivals - slot_capacity) * 8 / centre.active_counters)
        
        return CongestionPredictionWithReasoning(
            centre_id=centre.id,
            centre_name=centre.name,
            date=date,
            expected_arrivals=expected_arrivals,
            slot_capacity=slot_capacity,
            overload_risk=overload_risk,
            risk_score=risk_score,
            recommendation=suggestion,
            suggested_transfer_centre=transfer_centre,
            suggested_transfer_centre_name=transfer_name,
            wait_time_savings_min=wait_savings,
            reasoning_chain=[
                "Input Parameters: Current registrations, weather alerts, harvest surge data collected",
                "Processing: Applied capacity utilization formula (Expected/Capacity * 100)",
                f"Output: Overload risk={'YES' if overload_risk else 'NO'}, Risk score={risk_score}",
                "Disclaimer: Simulated synthetic data for demonstration",
            ],
            reasoning_trace=reasoning_steps,
        )

    def generate_demand_forecast(
        self,
        centres: List[Centre],
        days: int = 7,
    ) -> Dict[str, List[DemandForecast]]:
        result = {}
        for centre in centres:
            result[centre.id] = self.forecast_demand(centre, days)
        return result

    def get_wait_time_estimate(self, centre: Centre, position: int) -> int:
        avg_processing = 8.0
        return self.predict_wait_time(position, avg_processing, centre.active_counters)


ai_engine = AIEngine()