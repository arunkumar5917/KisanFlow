export enum Role {
  FARMER = 'FARMER',
  OFFICER = 'OFFICER',
  ADMIN = 'ADMIN',
}

export interface FarmerProfile {
  id: string;
  mobile: string;
  name: string;
  aadhaar?: string;
  district?: string;
  village?: string;
  bankAccount?: string;
  ifscCode?: string;
  language: string;
}

export interface Farm {
  id: string;
  farmerId: string;
  landAreaAcres: number;
  cropCode: string;
  variety?: string;
  estimatedQuantityQuintals: number;
  season?: string;
}

export interface Crop {
  code: string;
  name: string;
  mspPerQuintal: number;
  icon: string;
}

export interface Centre {
  id: string;
  code: string;
  name: string;
  district: string;
  state: string;
  address?: string;
  latitude: number;
  longitude: number;
  capacityPerSlot: number;
  activeCounters: number;
  status: CentreStatus;
  currentQueueLength?: number;
  estimatedWaitMin?: number;
  distanceKm?: number;
  availableSlotsToday?: number;
}

export enum CentreStatus {
  NORMAL = 'NORMAL',
  MODERATE = 'MODERATE',
  HEAVY = 'HEAVY',
  SEVERE = 'SEVERE',
  INACTIVE = 'INACTIVE',
}

export interface Slot {
  id: string;
  centreId: string;
  date: string;
  startTime: string;
  endTime: string;
  maxCapacity: number;
  bookedCount: number;
  isActive: boolean;
  remainingCapacity: number;
}

export interface Booking {
  id: string;
  farmerId: string;
  farmId?: string;
  centreId: string;
  slotId?: string;
  cropCode: string;
  variety?: string;
  quantityQuintals: number;
  date: string;
  timeSlot: string;
  tokenNumber: string;
  status: BookingStatus;
  qrCode?: string;
  checkInTime?: string;
  estimatedWaitMin: number;
  plainStatus: Record<string, string>;
}

export enum BookingStatus {
  BOOKED = 'BOOKED',
  CONFIRMED = 'CONFIRMED',
  ARRIVED = 'ARRIVED',
  QUALITY_CHECK = 'QUALITY_CHECK',
  WEIGHMENT = 'WEIGHMENT',
  APPROVED = 'APPROVED',
  PROCUREMENT_COMPLETED = 'PROCUREMENT_COMPLETED',
  PAYMENT_INITIATED = 'PAYMENT_INITIATED',
  PAYMENT_PROCESSING = 'PAYMENT_PROCESSING',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
  NO_SHOW = 'NO_SHOW',
  QUALITY_REJECTED = 'QUALITY_REJECTED',
  WEIGHT_DISPUTE = 'WEIGHT_DISPUTE',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
}

export interface Procurement {
  id: string;
  bookingId: string;
  cropCode: string;
  variety?: string;
  quantityQuintals: number;
  netWeightQuintals: number;
  qualityGrade?: string;
  mspRate: number;
  grossAmount: number;
  deductions: number;
  netAmount: number;
  receiptNumber: string;
  completedAt: string;
}

export interface QualityCheck {
  id: string;
  procurementId: string;
  moisturePercent: number;
  foreignMatterPercent: number;
  damagedGrainPercent: number;
  grade: string;
  result: QualityResult;
  notes?: string;
  checkedAt: string;
}

export enum QualityResult {
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
}

export interface Weighment {
  id: string;
  procurementId: string;
  grossWeightKg: number;
  tareWeightKg: number;
  netWeightKg: number;
  netWeightQuintals: number;
  declaredQuantityKg?: number;
  varianceKg: number;
  verified: boolean;
  weighedAt: string;
}

export interface Payment {
  id: string;
  bookingId: string;
  procurementId?: string;
  amount: number;
  mspRate: number;
  netWeightQuintals: number;
  status: PaymentStatus;
  transactionRef?: string;
  bankAccount?: string;
  ifscCode?: string;
  initiatedAt?: string;
  processedAt?: string;
  creditedAt?: string;
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  PAID = 'PAID',
  FAILED = 'FAILED',
}

export interface Grievance {
  id: string;
  farmerId: string;
  bookingId?: string;
  type: GrievanceType;
  title: string;
  description?: string;
  status: GrievanceStatus;
  resolution?: string;
  submittedAt: string;
  resolvedAt?: string;
}

export enum GrievanceType {
  WEIGHT_DISPUTE = 'WEIGHT_DISPUTE',
  QUALITY_ISSUE = 'QUALITY_ISSUE',
  PAYMENT_ISSUE = 'PAYMENT_ISSUE',
  TOKEN_ISSUE = 'TOKEN_ISSUE',
}

export enum GrievanceStatus {
  SUBMITTED = 'SUBMITTED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  RESOLVED = 'RESOLVED',
  REJECTED = 'REJECTED',
}