// Feature 1: Smart Leave-Home Alert Service
import { predictWaitingTime, WaitPredictionInput } from './aiService';
import { CENTRES } from '../constants/config';

export interface LeaveHomeAlert {
  tokenNumber: string;
  queuePosition: number;
  estimatedProcessingTime: number; // minutes
  travelTimeEstimate: number; // minutes
  leaveHomeTime: Date;
  centreName: string;
  message: string;
  messageTa: string;
}

function estimateTravelTime(
  farmerLat: number,
  farmerLng: number,
  centreLat: number,
  centreLng: number,
): number {
  const R = 6371;
  const dLat = ((centreLat - farmerLat) * Math.PI) / 180;
  const dLng = ((centreLng - farmerLng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((farmerLat * Math.PI) / 180) *
      Math.cos((centreLat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distanceKm = R * c;
  const avgSpeedKmH = 30; // rural India average
  return Math.ceil((distanceKm / avgSpeedKmH) * 60);
}

export function calculateLeaveHomeTime(
  tokenNumber: string,
  queuePosition: number,
  centreId: string,
  cropId: string,
  quantityKg: number,
  farmerLocation: { lat: number; lng: number },
): LeaveHomeAlert {
  const centre = CENTRES.find(c => c.id === centreId) || CENTRES[0];
  const now = new Date();
  const hour = now.getHours();

  const waitInput: WaitPredictionInput = {
    farmersAhead: Math.max(0, queuePosition - 1),
    activeCounters: 3,
    avgProcessingTime: 11,
    quantityKg,
    cropId,
    timeOfDay: hour,
    centreLoad: centre.status as 'normal' | 'moderate' | 'high',
  };

  const processingTime = predictWaitingTime(waitInput);
  const travelTime = estimateTravelTime(
    farmerLocation.lat,
    farmerLocation.lng,
    centre.location.lat,
    centre.location.lng,
  );

  const bufferTime = 10;
  const totalMinutesBeforeSlot = processingTime + bufferTime;
  const leaveTime = new Date(now.getTime() + totalMinutesBeforeSlot * 60000);

  const timeStr = leaveTime.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const timeStrTa = leaveTime.toLocaleTimeString('ta-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  return {
    tokenNumber,
    queuePosition,
    estimatedProcessingTime: processingTime,
    travelTimeEstimate: travelTime,
    leaveHomeTime: leaveTime,
    centreName: centre.name,
    message: `Your token is ${queuePosition}. Estimated processing time: ${processingTime} min. Leave home at ${timeStr}.`,
    messageTa: `உங்கள் டோக்கன் ${queuePosition}. மதிப்பீட்டு செயலாக்க நேரம்: ${processingTime} நிமிடம். ${timeStrTa} மணிக்கு வீட்டை விடுங்கள்.`,
  };
}
