import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import type { QueueStatus } from '../constants/config';
import type { Grievance, GrievanceType, GrievanceStatus } from '../services/disputeService';
import { generateGrievanceId } from '../services/disputeService';

export interface CropRegistration {
  id: string;
  farmerId: string;
  cropId: string;
  variety: string;
  quantity: number;
  harvestDate: string;
  centreId: string;
  season: string;
  createdAt: string;
}

export interface SlotBooking {
  id: string;
  farmerId: string;
  cropRegistrationId: string;
  centreId: string;
  date: string;
  timeSlot: string;
  tokenNumber: string;
  queuePosition: number;
  status: QueueStatus;
  createdAt: string;
}

export interface WeighmentData {
  grossWeight: number;
  tareWeight: number;
  netWeight: number;
  recordedAt: string;
}

export interface QualityData {
  moisture: number;
  foreignMatter: number;
  damagedGrain: number;
  grade: string;
  result: 'accepted' | 'rejected';
  notes?: string;
  checkedAt: string;
}

export interface PaymentRecord {
  id: string;
  bookingId: string;
  farmerId: string;
  amount: number;
  mspRate: number;
  netWeight: number;
  status: 'pending' | 'bill_generated' | 'submitted' | 'bank_processing' | 'credited';
  transactionRef?: string;
  updatedAt: string;
}

export interface ProcurementRecord {
  bookingId: string;
  weighment?: WeighmentData;
  quality?: QualityData;
  payment?: PaymentRecord;
  procurementId?: string;
}

export interface ReceiptRecord {
  id: string;
  bookingId: string;
  farmerId: string;
  centreId: string;
  cropName: string;
  variety: string;
  quantity: number;
  netWeight: number;
  qualityGrade: string;
  mspRate: number;
  amount: number;
  date: string;
  status: 'generated' | 'submitted' | 'processing' | 'credited';
}

export interface ProcurementContextType {
  crops: CropRegistration[];
  bookings: SlotBooking[];
  procurements: Record<string, ProcurementRecord>;
  grievances: Grievance[];
  receipts: ReceiptRecord[];
  registerCrop: (data: Omit<CropRegistration, 'id' | 'createdAt'>) => string;
  bookSlot: (data: Omit<SlotBooking, 'id' | 'createdAt' | 'tokenNumber' | 'queuePosition'>) => string;
  updateBookingStatus: (bookingId: string, status: QueueStatus) => void;
  recordWeighment: (bookingId: string, data: WeighmentData) => void;
  recordQuality: (bookingId: string, data: QualityData) => void;
  updatePayment: (bookingId: string, status: PaymentRecord['status'], ref?: string) => void;
  getBookingsByFarmer: (farmerId: string) => SlotBooking[];
  getBookingsByCentre: (centreId: string) => SlotBooking[];
  getProcurement: (bookingId: string) => ProcurementRecord | undefined;
  rescheduleBooking: (bookingId: string, newSlot: string, newDate: string) => void;
  fileGrievance: (grievance: Omit<Grievance, 'id' | 'status' | 'createdAt' | 'updatedAt'>) => string;
  updateGrievanceStatus: (grievanceId: string, status: GrievanceStatus, notes?: string) => void;
  getGrievancesByFarmer: (farmerId: string) => Grievance[];
  getReceiptsByFarmer: (farmerId: string) => ReceiptRecord[];
  getProcurementStats: (farmerId: string) => { totalQty: number; totalBills: number; completed: number; pending: number };
}

const ProcurementContext = createContext<ProcurementContextType | undefined>(undefined);

// Mock initial bookings for demo
const MOCK_BOOKINGS: SlotBooking[] = [
  {
    id: 'bk001', farmerId: 'f001', cropRegistrationId: 'cr001', centreId: 'c2',
    date: '2026-09-01', timeSlot: '10:00 - 11:00 AM', tokenNumber: 'PDC-2026-08231',
    queuePosition: 18, status: 'booked', createdAt: new Date().toISOString(),
  },
];

const MOCK_CENTRE_BOOKINGS: SlotBooking[] = [
  { id: 'bk002', farmerId: 'f002', cropRegistrationId: 'cr002', centreId: 'c2', date: '2026-09-01', timeSlot: '09:00 - 10:00 AM', tokenNumber: 'PDC-2026-08220', queuePosition: 5, status: 'called', createdAt: new Date().toISOString() },
  { id: 'bk003', farmerId: 'f003', cropRegistrationId: 'cr003', centreId: 'c2', date: '2026-09-01', timeSlot: '09:00 - 10:00 AM', tokenNumber: 'PDC-2026-08221', queuePosition: 6, status: 'weighment', createdAt: new Date().toISOString() },
  { id: 'bk004', farmerId: 'f004', cropRegistrationId: 'cr004', centreId: 'c2', date: '2026-09-01', timeSlot: '09:00 - 10:00 AM', tokenNumber: 'PDC-2026-08222', queuePosition: 7, status: 'quality_check', createdAt: new Date().toISOString() },
  { id: 'bk005', farmerId: 'f005', cropRegistrationId: 'cr005', centreId: 'c2', date: '2026-09-01', timeSlot: '09:00 - 10:00 AM', tokenNumber: 'PDC-2026-08223', queuePosition: 8, status: 'arrived', createdAt: new Date().toISOString() },
  { id: 'bk006', farmerId: 'f006', cropRegistrationId: 'cr006', centreId: 'c2', date: '2026-09-01', timeSlot: '10:00 - 11:00 AM', tokenNumber: 'PDC-2026-08224', queuePosition: 9, status: 'booked', createdAt: new Date().toISOString() },
  { id: 'bk007', farmerId: 'f007', cropRegistrationId: 'cr007', centreId: 'c2', date: '2026-09-01', timeSlot: '10:00 - 11:00 AM', tokenNumber: 'PDC-2026-08225', queuePosition: 10, status: 'waiting', createdAt: new Date().toISOString() },
  { id: 'bk008', farmerId: 'f008', cropRegistrationId: 'cr008', centreId: 'c2', date: '2026-09-01', timeSlot: '10:00 - 11:00 AM', tokenNumber: 'PDC-2026-08226', queuePosition: 11, status: 'accepted', createdAt: new Date().toISOString() },
  { id: 'bk009', farmerId: 'f009', cropRegistrationId: 'cr009', centreId: 'c2', date: '2026-09-01', timeSlot: '10:00 - 11:00 AM', tokenNumber: 'PDC-2026-08227', queuePosition: 12, status: 'completed', createdAt: new Date().toISOString() },
  { id: 'bk010', farmerId: 'f010', cropRegistrationId: 'cr010', centreId: 'c2', date: '2026-09-01', timeSlot: '10:00 - 11:00 AM', tokenNumber: 'PDC-2026-08228', queuePosition: 13, status: 'payment_pending', createdAt: new Date().toISOString() },
  { id: 'bk011', farmerId: 'f011', cropRegistrationId: 'cr011', centreId: 'c2', date: '2026-09-01', timeSlot: '10:00 - 11:00 AM', tokenNumber: 'PDC-2026-08229', queuePosition: 14, status: 'paid', createdAt: new Date().toISOString() },
];

const MOCK_CROPS: CropRegistration[] = [
  { id: 'cr001', farmerId: 'f001', cropId: 'paddy', variety: 'BPT 5204', quantity: 850, harvestDate: '2026-08-25', centreId: 'c2', season: 'Kharif 2026', createdAt: new Date().toISOString() },
];

const MOCK_FARMER_NAMES: Record<string, string> = {
  f002: 'Arun Kumar', f003: 'Selvam R', f004: 'Priya M', f005: 'Bala S',
  f006: 'Ravi T', f007: 'Mani V', f008: 'Gopi K', f009: 'Vijay N',
  f010: 'Murugan P', f011: 'Kannan L',
};

const MOCK_RECEIPTS: ReceiptRecord[] = [
  { id: 'rc001', bookingId: 'bk009', farmerId: 'f009', centreId: 'c2', cropName: 'Groundnut', variety: 'TMV 2', quantity: 540, netWeight: 510, qualityGrade: 'A', mspRate: 5850, amount: 2983500, date: '2026-09-01', status: 'credited' },
  { id: 'rc002', bookingId: 'bk011', farmerId: 'f011', centreId: 'c2', cropName: 'Wheat', variety: 'HD 2967', quantity: 420, netWeight: 405, qualityGrade: 'A', mspRate: 2275, amount: 921375, date: '2026-09-01', status: 'credited' },
  { id: 'rc003', bookingId: 'bk010', farmerId: 'f010', centreId: 'c2', cropName: 'Paddy', variety: 'BPT 5204', quantity: 680, netWeight: 650, qualityGrade: 'B', mspRate: 2183, amount: 1418950, date: '2026-09-01', status: 'processing' },
];

export function ProcurementProvider({ children }: { children: ReactNode }) {
  const [crops, setCrops] = useState<CropRegistration[]>(MOCK_CROPS);
  const [bookings, setBookings] = useState<SlotBooking[]>([...MOCK_BOOKINGS, ...MOCK_CENTRE_BOOKINGS]);
  const [procurements, setProcurements] = useState<Record<string, ProcurementRecord>>({
    bk003: {
      bookingId: 'bk003',
      weighment: { grossWeight: 920, tareWeight: 70, netWeight: 850, recordedAt: new Date().toISOString() },
    },
    bk004: {
      bookingId: 'bk004',
      weighment: { grossWeight: 650, tareWeight: 50, netWeight: 600, recordedAt: new Date().toISOString() },
    },
  });
  const [grievances, setGrievances] = useState<Grievance[]>([]);
  const [receipts, setReceipts] = useState<ReceiptRecord[]>(MOCK_RECEIPTS);

  const registerCrop = useCallback((data: Omit<CropRegistration, 'id' | 'createdAt'>): string => {
    const id = `cr${Date.now()}`;
    const newCrop: CropRegistration = { ...data, id, createdAt: new Date().toISOString() };
    setCrops(prev => [...prev, newCrop]);
    return id;
  }, []);

  const bookSlot = useCallback((data: Omit<SlotBooking, 'id' | 'createdAt' | 'tokenNumber' | 'queuePosition'>): string => {
    const id = `bk${Date.now()}`;
    const tokenNum = Math.floor(Math.random() * 90000) + 10000;
    const tokenNumber = `PDC-2026-${tokenNum}`;
    const queuePosition = Math.floor(Math.random() * 15) + 5;
    const newBooking: SlotBooking = { ...data, id, tokenNumber, queuePosition, createdAt: new Date().toISOString() };
    setBookings(prev => [...prev, newBooking]);
    return id;
  }, []);

  const updateBookingStatus = useCallback((bookingId: string, status: QueueStatus) => {
    setBookings(prev =>
      prev.map(b => b.id === bookingId ? { ...b, status } : b)
    );
  }, []);

  const recordWeighment = useCallback((bookingId: string, data: WeighmentData) => {
    setProcurements(prev => ({
      ...prev,
      [bookingId]: { ...(prev[bookingId] || { bookingId }), bookingId, weighment: data },
    }));
  }, []);

  const recordQuality = useCallback((bookingId: string, data: QualityData) => {
    setProcurements(prev => ({
      ...prev,
      [bookingId]: { ...(prev[bookingId] || { bookingId }), bookingId, quality: data },
    }));
  }, []);

  const updatePayment = useCallback((bookingId: string, status: PaymentRecord['status'], ref?: string) => {
    setProcurements(prev => {
      const existing = prev[bookingId];
      const oldPayment = existing?.payment;
      const proc = existing?.weighment;
      const cropReg = crops.find(c => {
        const bk = bookings.find(b => b.id === bookingId);
        return bk && c.id === bk.cropRegistrationId;
      });
      const mspRate = 2183;
      const netWeight = proc?.netWeight || 850;
      const newPayment: PaymentRecord = {
        id: oldPayment?.id || `pay${Date.now()}`,
        bookingId,
        farmerId: bookings.find(b => b.id === bookingId)?.farmerId || '',
        amount: Math.round(netWeight * mspRate),
        mspRate,
        netWeight,
        status,
        transactionRef: ref || oldPayment?.transactionRef,
        updatedAt: new Date().toISOString(),
      };
      return { ...prev, [bookingId]: { ...(prev[bookingId] || { bookingId }), bookingId, payment: newPayment } };
    });
  }, [crops, bookings]);

  const getBookingsByFarmer = useCallback((farmerId: string) =>
    bookings.filter(b => b.farmerId === farmerId), [bookings]);

  const getBookingsByCentre = useCallback((centreId: string) =>
    bookings.filter(b => b.centreId === centreId), [bookings]);

  const getProcurement = useCallback((bookingId: string) =>
    procurements[bookingId], [procurements]);

  const rescheduleBooking = useCallback((bookingId: string, newSlot: string, newDate: string) => {
    setBookings(prev =>
      prev.map(b => b.id === bookingId ? { ...b, timeSlot: newSlot, date: newDate, status: 'booked' as QueueStatus } : b)
    );
  }, []);

  const fileGrievance = useCallback((data: Omit<Grievance, 'id' | 'status' | 'createdAt' | 'updatedAt'>): string => {
    const id = generateGrievanceId();
    const newGrievance: Grievance = {
      ...data,
      id,
      status: 'submitted',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setGrievances(prev => [...prev, newGrievance]);
    return id;
  }, []);

  const updateGrievanceStatus = useCallback((grievanceId: string, status: GrievanceStatus, notes?: string) => {
    setGrievances(prev =>
      prev.map(g => g.id === grievanceId ? { ...g, status, officerNotes: notes || g.officerNotes, updatedAt: new Date().toISOString() } : g)
    );
  }, []);

  const getGrievancesByFarmer = useCallback((farmerId: string) =>
    grievances.filter(g => g.farmerId === farmerId), [grievances]);

  const getReceiptsByFarmer = useCallback((farmerId: string) =>
    receipts.filter(r => r.farmerId === farmerId), [receipts]);

  const getProcurementStats = useCallback((farmerId: string) => {
    const farmerReceipts = receipts.filter(r => r.farmerId === farmerId);
    return {
      totalQty: farmerReceipts.reduce((sum, r) => sum + r.netWeight, 0),
      totalBills: farmerReceipts.length,
      completed: farmerReceipts.filter(r => r.status === 'credited').length,
      pending: farmerReceipts.filter(r => r.status !== 'credited').length,
    };
  }, [receipts]);

  return (
    <ProcurementContext.Provider value={{
      crops, bookings, procurements, grievances, receipts,
      registerCrop, bookSlot, updateBookingStatus,
      recordWeighment, recordQuality, updatePayment,
      getBookingsByFarmer, getBookingsByCentre, getProcurement,
      rescheduleBooking, fileGrievance, updateGrievanceStatus,
      getGrievancesByFarmer, getReceiptsByFarmer, getProcurementStats,
    }}>
      {children}
    </ProcurementContext.Provider>
  );
}

export function useProcurement() {
  const ctx = useContext(ProcurementContext);
  if (!ctx) throw new Error('useProcurement must be within ProcurementProvider');
  return ctx;
}

export { MOCK_FARMER_NAMES };
