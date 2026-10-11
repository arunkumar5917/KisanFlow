// Feature 4: AI Overload Prediction Service
import { CENTRES } from '../constants/config';

export interface OverloadPrediction {
  centreId: string;
  centreName: string;
  predictedOverloadHour: number;
  predictedOverloadEnd: number;
  currentLoad: 'normal' | 'moderate' | 'high';
  riskScore: number;
  recommendation: string;
  recommendationTa: string;
  suggestedTransferCount: number;
  suggestedTransferCentre?: string;
}

const HOURLY_DEMAND: Record<number, number[]> = {
  c1: [2, 1, 1, 1, 2, 5, 18, 38, 52, 60, 55, 48, 40, 48, 55, 50, 38, 25, 15, 8, 4, 3, 2, 1],
  c2: [3, 2, 1, 1, 2, 6, 22, 42, 58, 68, 62, 52, 42, 50, 58, 55, 40, 28, 16, 9, 5, 4, 3, 2],
  c3: [1, 1, 1, 1, 1, 4, 14, 30, 42, 50, 45, 38, 32, 38, 45, 42, 30, 20, 12, 6, 3, 2, 1, 1],
  c4: [2, 1, 1, 1, 2, 5, 16, 34, 48, 56, 50, 42, 36, 44, 52, 48, 35, 22, 14, 7, 4, 3, 2, 1],
  c5: [1, 1, 1, 1, 1, 3, 10, 22, 32, 38, 35, 30, 25, 30, 35, 32, 24, 16, 10, 5, 3, 2, 1, 1],
};

export function predictOverload(centreId: string): OverloadPrediction {
  const centre = CENTRES.find(c => c.id === centreId) || CENTRES[0];
  const demand = HOURLY_DEMAND[centreId] || HOURLY_DEMAND.c2;
  const capacity = centre.capacity * 3;

  let overloadStart = -1;
  let overloadEnd = -1;
  let maxRisk = 0;

  for (let h = 6; h < 18; h++) {
    const ratio = demand[h] / capacity;
    if (ratio > 1.0) {
      if (overloadStart === -1) overloadStart = h;
      overloadEnd = h;
      maxRisk = Math.max(maxRisk, ratio);
    }
  }

  const currentHour = new Date().getHours();
  const currentDemand = demand[currentHour] || 0;
  const currentRatio = currentDemand / capacity;
  const currentLoad = currentRatio > 1.2 ? 'high' : currentRatio > 0.85 ? 'moderate' : 'normal';

  const riskScore = Math.min(100, Math.round(maxRisk * 60));

  let recommendation = '';
  let recommendationTa = '';
  let suggestedTransferCount = 0;
  let suggestedTransferCentre = '';

  if (overloadStart !== -1) {
    const overloadWindow = overloadEnd - overloadStart + 1;
    suggestedTransferCount = Math.round((maxRisk - 1) * 20);

    const otherCentres = CENTRES.filter(c => c.id !== centreId && c.status === 'normal');
    if (otherCentres.length > 0) {
      const best = otherCentres.sort((a, b) => a.waitingCount - b.waitingCount)[0];
      suggestedTransferCentre = best.name;
    }

    const startStr = `${overloadStart}:00`;
    const endStr = `${overloadEnd + 1}:00`;
    recommendation = `This centre is likely to become overloaded between ${startStr}–${endStr}. Consider moving ${suggestedTransferCount} bookings to ${suggestedTransferCentre || 'a nearby centre'}.`;
    recommendationTa = `இந்த மையம் ${startStr}–${endStr} இடையே அதிக சுமையாக மாற வாய்ப்புள்ளது. ${suggestedTransferCount} முன்பதிவுகளை ${suggestedTransferCentre || 'அருகிலுள்ள மையத்திற்கு'} மாற்றுங்கள்.`;
  } else {
    recommendation = 'No overload predicted for today. Operations within normal capacity.';
    recommendationTa = 'இன்று அதிக சுமை கணிக்கப்படவில்லை. சாதாரண திறனில் செயல்படுகிறது.';
  }

  return {
    centreId,
    centreName: centre.name,
    predictedOverloadHour: overloadStart,
    predictedOverloadEnd: overloadEnd,
    currentLoad,
    riskScore,
    recommendation,
    recommendationTa,
    suggestedTransferCount,
    suggestedTransferCentre,
  };
}

export function getCentreLoads(): Array<{
  centreId: string;
  name: string;
  load: 'normal' | 'moderate' | 'high';
  currentDemand: number;
  capacity: number;
  riskScore: number;
}> {
  const currentHour = new Date().getHours();
  return CENTRES.map(c => {
    const demand = HOURLY_DEMAND[c.id] || HOURLY_DEMAND.c2;
    const currentDemand = demand[currentHour] || 0;
    const capacity = c.capacity * 3;
    const ratio = currentDemand / capacity;
    const load = ratio > 1.2 ? 'high' : ratio > 0.85 ? 'moderate' : 'normal';
    return {
      centreId: c.id,
      name: c.name,
      load,
      currentDemand,
      capacity,
      riskScore: Math.min(100, Math.round(ratio * 60)),
    };
  });
}
