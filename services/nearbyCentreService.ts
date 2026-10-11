// Feature 5: Nearby Centre Recommendation Service
import { CENTRES } from '../constants/config';

export interface NearbyCentre {
  centreId: string;
  name: string;
  district: string;
  distance: number; // km
  estimatedWait: number; // minutes
  waitingCount: number;
  load: 'normal' | 'moderate' | 'high';
  recommended: boolean;
  reason: string;
  reasonTa: string;
}

function haversineDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 1) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export function getNearbyCentres(
  farmerLat: number,
  farmerLng: number,
  excludeCentreId?: string,
): NearbyCentre[] {
  const centres = CENTRES.filter(c => c.id !== excludeCentreId);
  const scored = centres.map(c => {
    const distance = haversineDistance(farmerLat, farmerLng, c.location.lat, c.location.lng);
    const estimatedWait = c.waitingCount * 8;
    const load = c.status as 'normal' | 'moderate' | 'high';
    return {
      centreId: c.id,
      name: c.name,
      district: c.district,
      distance,
      estimatedWait,
      waitingCount: c.waitingCount,
      load,
      recommended: false,
      reason: '',
      reasonTa: '',
    };
  });

  const bestIdx = scored.reduce((best, c, i) => {
    const score = c.estimatedWait + c.distance * 5;
    const bestScore = scored[best].estimatedWait + scored[best].distance * 5;
    return score < bestScore ? i : best;
  }, 0);

  scored[bestIdx].recommended = true;
  scored[bestIdx].reason = `Recommended — estimated waiting time ${scored[bestIdx].estimatedWait} min, ${scored[bestIdx].distance} km away.`;
  scored[bestIdx].reasonTa = `பரிந்துரைக்கப்படுகிறது — மதிப்பீட்டு காத்திருப்பு நேரம் ${scored[bestIdx].estimatedWait} நிமிடம், ${scored[bestIdx].distance} கி.மீ. தொலைவில்.`;

  return scored.sort((a, b) => a.estimatedWait - b.estimatedWait);
}
