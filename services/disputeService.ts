// Feature 7: Dispute / Grievance Module Service
export type GrievanceType = 'wrong_weight' | 'quality_disagreement' | 'payment_delay' | 'token_issue' | 'procurement_rejection' | 'other';
export type GrievanceStatus = 'submitted' | 'under_review' | 'resolved' | 'rejected';

export interface Grievance {
  id: string;
  farmerId: string;
  farmerName: string;
  type: GrievanceType;
  description: string;
  bookingId?: string;
  centreId: string;
  status: GrievanceStatus;
  createdAt: string;
  updatedAt: string;
  officerNotes?: string;
  resolution?: string;
}

export interface GrievanceTypeConfig {
  label: string;
  labelTa: string;
  icon: string;
}

export const GRIEVANCE_TYPES: Record<GrievanceType, GrievanceTypeConfig> = {
  wrong_weight: { label: 'Wrong Weight', labelTa: 'தவறான எடை', icon: 'scale' },
  quality_disagreement: { label: 'Quality Disagreement', labelTa: 'தர கருத்து வேறுபாடு', icon: 'science' },
  payment_delay: { label: 'Payment Delay', labelTa: 'கட்டணம் தாமதம்', icon: 'payments' },
  token_issue: { label: 'Token Issue', labelTa: 'டோக்கன் சிக்கல்', icon: 'confirmation-number' },
  procurement_rejection: { label: 'Procurement Rejection', labelTa: 'கொள்முதல் நிராகரிப்பு', icon: 'cancel' },
  other: { label: 'Other', labelTa: 'மற்றவை', icon: 'help' },
};

export const GRIEVANCE_STATUS_CONFIG: Record<GrievanceStatus, { label: string; labelTa: string; color: string }> = {
  submitted: { label: 'Submitted', labelTa: 'சமர்ப்பிக்கப்பட்டது', color: '#42A5F5' },
  under_review: { label: 'Under Review', labelTa: 'மதிப்பாய்வில்', color: '#FFA726' },
  resolved: { label: 'Resolved', labelTa: 'தீர்க்கப்பட்டது', color: '#66BB6A' },
  rejected: { label: 'Rejected', labelTa: 'நிராகரிக்கப்பட்டது', color: '#EF5350' },
};

export function generateGrievanceId(): string {
  const date = new Date();
  const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
  const num = Math.floor(Math.random() * 9000) + 1000;
  return `PRC-${dateStr}-${num}`;
}

export function createGrievance(
  data: Omit<Grievance, 'id' | 'status' | 'createdAt' | 'updatedAt'>,
): Grievance {
  return {
    ...data,
    id: generateGrievanceId(),
    status: 'submitted',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
