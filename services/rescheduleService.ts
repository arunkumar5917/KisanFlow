// Feature 2: Dynamic Slot Re-Scheduling Service
import { getSlots } from './procurementService';
import { predictCrowding } from './aiService';

export interface RescheduleOption {
  slotTime: string;
  hour: number;
  estimatedWait: number;
  crowdLevel: 'low' | 'moderate' | 'high';
  available: boolean;
}

export function findRescheduleOptions(
  currentCentreId: string,
  currentDate: string,
  currentSlotHour: number,
): RescheduleOption[] {
  const slots = getSlots(currentDate, 15);
  const now = new Date();
  const currentHour = now.getHours();

  return slots
    .filter(s => s.hour > currentHour && s.available > 0)
    .map(s => {
      const crowd = predictCrowding(currentCentreId, s.hour);
      return {
        slotTime: s.time,
        hour: s.hour,
        estimatedWait: crowd.expectedFarmers * 8,
        crowdLevel: crowd.risk,
        available: s.available > 0,
      };
    });
}

export function getRescheduleMessage(
  originalSlot: string,
  newSlot: string,
  lang: 'en' | 'ta',
): string {
  if (lang === 'ta') {
    return `உங்கள் ${originalSlot} ஸ்லாட்டை மாற்ற முடியும். அடுத்த கிடைக்கும் ஸ்லாட்: ${newSlot}. மாற்ற விரும்புகிறீர்களா?`;
  }
  return `Can't attend your ${originalSlot} slot? Reschedule to ${newSlot}.`;
}
