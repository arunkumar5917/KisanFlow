// Feature 8: AI Anomaly Detection Service
export interface AnomalyAlert {
  id: string;
  type: 'processing_time' | 'weight_pattern' | 'rejection_rate' | 'counter_activity';
  severity: 'low' | 'medium' | 'high';
  title: string;
  titleTa: string;
  description: string;
  descriptionTa: string;
  centreId: string;
  counterId?: number;
  detectedAt: string;
  value: number;
  expected: number;
  deviation: number;
}

function generateAnomalyId(): string {
  return `ANM-${Date.now().toString(36).toUpperCase()}`;
}

export function detectAnomalies(centreId: string): AnomalyAlert[] {
  const now = new Date();
  const hour = now.getHours();
  const anomalies: AnomalyAlert[] = [];

  const counterTimes = [12, 8, 22, 7, 9, 11];
  counterTimes.forEach((time, idx) => {
    if (time > 15) {
      anomalies.push({
        id: generateAnomalyId(),
        type: 'processing_time',
        severity: time > 20 ? 'high' : 'medium',
        title: `Counter ${idx + 1}: High Processing Time`,
        titleTa: `கவுன்டர் ${idx + 1}: அதிக செயலாக்க நேரம்`,
        description: `Processing time is ${time} min (avg: 11 min). ${Math.round(((time - 11) / 11) * 100)}% above normal.`,
        descriptionTa: `செயலாக்க நேரம் ${time} நிமிடம் (சராசரி: 11 நிமிடம்). சாதாரணத்தை விட ${Math.round(((time - 11) / 11) * 100)}% அதிகம்.`,
        centreId,
        counterId: idx + 1,
        detectedAt: now.toISOString(),
        value: time,
        expected: 11,
        deviation: Math.round(((time - 11) / 11) * 100),
      });
    }
  });

  if (hour >= 10 && hour <= 14) {
    const rejectionRate = 18 + Math.random() * 10;
    if (rejectionRate > 22) {
      anomalies.push({
        id: generateAnomalyId(),
        type: 'rejection_rate',
        severity: rejectionRate > 28 ? 'high' : 'medium',
        title: 'High Rejection Rate Detected',
        titleTa: 'அதிக நிராகரிப்பு விகிதம் கண்டறியப்பட்டது',
        description: `Rejection rate: ${rejectionRate.toFixed(1)}% (normal: 8-12%). Possible quality control issue.`,
        descriptionTa: `நிராகரிப்பு விகிதம்: ${rejectionRate.toFixed(1)}% (சாதாரணம்: 8-12%). தரக் கட்டுப்பாட்டு சிக்கல் இருக்கலாம்.`,
        centreId,
        detectedAt: now.toISOString(),
        value: Math.round(rejectionRate * 10) / 10,
        expected: 10,
        deviation: Math.round(rejectionRate - 10),
      });
    }
  }

  return anomalies;
}

export function getSeverityColor(severity: 'low' | 'medium' | 'high'): string {
  switch (severity) {
    case 'low': return '#FFA726';
    case 'medium': return '#FF7043';
    case 'high': return '#EF5350';
  }
}

export function getAnomalyIcon(type: AnomalyAlert['type']): string {
  switch (type) {
    case 'processing_time': return 'timer';
    case 'weight_pattern': return 'scale';
    case 'rejection_rate': return 'cancel';
    case 'counter_activity': return 'people';
  }
}
