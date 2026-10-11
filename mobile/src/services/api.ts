import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { useAuth } from '../context/AuthContext';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.client.interceptors.request.use((config: InternalAxiosRequestConfig) => {
      return config;
    });

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('API Error:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  setAuthToken(token: string | null) {
    if (token) {
      this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete this.client.defaults.headers.common['Authorization'];
    }
  }

  async requestOtp(mobile: string) {
    return this.client.post('/auth/request-otp', { mobile });
  }

  async verifyOtp(mobile: string, otp: string) {
    return this.client.post('/auth/verify-otp', { mobile, otp });
  }

  async officerLogin(centreCode: string) {
    return this.client.post('/auth/officer/login', { centre_code: centreCode });
  }

  async getFarmer(farmerId: string) {
    return this.client.get(`/farmers/${farmerId}`);
  }

  async createFarmer(data: any) {
    return this.client.post('/farmers', data);
  }

  async updateFarmer(farmerId: string, data: any) {
    return this.client.put(`/farmers/${farmerId}`, data);
  }

  async createFarm(farmerId: string, data: any) {
    return this.client.post(`/farmers/${farmerId}/farms`, data);
  }

  async getFarms(farmerId: string) {
    return this.client.get(`/farmers/${farmerId}/farms`);
  }

  async getFarmerBookings(farmerId: string) {
    return this.client.get(`/farmers/${farmerId}/bookings`);
  }

  async getCrops(lang: string = 'en') {
    return this.client.get('/crops', { params: { lang } });
  }

  async getCrop(cropCode: string, lang: string = 'en') {
    return this.client.get(`/crops/${cropCode}`, { params: { lang } });
  }

  async getNearbyCentres(lat: number, lon: number, cropCode?: string, maxDistance: number = 50) {
    return this.client.get('/centres/nearby', {
      params: { latitude: lat, longitude: lon, crop_code: cropCode, max_distance: maxDistance },
    });
  }

  async getCentre(centreId: string) {
    return this.client.get(`/centres/${centreId}`);
  }

  async getCentreSlots(centreId: string, date?: string) {
    return this.client.get(`/centres/${centreId}/slots`, { params: { date } });
  }

  async createBooking(data: any) {
    return this.client.post('/bookings', data);
  }

  async getBooking(bookingId: string) {
    return this.client.get(`/bookings/${bookingId}`);
  }

  async getBookingByToken(tokenNumber: string) {
    return this.client.get(`/bookings/token/${tokenNumber}`);
  }

  async cancelBooking(bookingId: string) {
    return this.client.post(`/bookings/${bookingId}/cancel`);
  }

  async getBookingTimeline(bookingId: string) {
    return this.client.get(`/bookings/${bookingId}/timeline`);
  }

  async getTokenStatus(tokenNumber: string) {
    return this.client.get(`/tokens/${tokenNumber}`);
  }

  async checkinToken(tokenNumber: string) {
    return this.client.post(`/tokens/${tokenNumber}/checkin`);
  }

  async getLiveQueue(tokenNumber: string) {
    return this.client.get(`/tokens/${tokenNumber}/live`);
  }

  async getCentreQueue(centreId: string) {
    return this.client.get(`/queue/centre/${centreId}`);
  }

  async getAllQueues() {
    return this.client.get('/queue/all');
  }

  async callNextToken(centreId: string) {
    return this.client.post(`/queue/centre/${centreId}/call-next`);
  }

  async recordQualityCheck(bookingId: string, data: any) {
    return this.client.post(`/quality/booking/${bookingId}`, data);
  }

  async getQualityCheck(procurementId: string) {
    return this.client.get(`/quality/procurement/${procurementId}`);
  }

  async recordWeighment(procurementId: string, data: any) {
    return this.client.post(`/weighments/procurement/${procurementId}`, data);
  }

  async getWeighment(procurementId: string) {
    return this.client.get(`/weighments/procurement/${procurementId}`);
  }

  async completeProcurement(bookingId: string) {
    return this.client.post(`/procurement/booking/${bookingId}`);
  }

  async getProcurement(bookingId: string) {
    return this.client.get(`/procurement/booking/${bookingId}`);
  }

  async getProcurementByReceipt(receiptNumber: string) {
    return this.client.get(`/procurement/receipt/${receiptNumber}`);
  }

  async initiatePayment(procurementId: string) {
    return this.client.post(`/payments/procurement/${procurementId}`);
  }

  async processPayment(paymentId: string) {
    return this.client.post(`/payments/${paymentId}/process`);
  }

  async completePayment(paymentId: string) {
    return this.client.post(`/payments/${paymentId}/complete`);
  }

  async getPaymentBreakdown(bookingId: string) {
    return this.client.get(`/payments/booking/${bookingId}`);
  }

  async createGrievance(data: any) {
    return this.client.post('/grievances', data);
  }

  async getFarmerGrievances(farmerId: string) {
    return this.client.get(`/grievances/farmer/${farmerId}`);
  }

  async getBookingGrievances(bookingId: string) {
    return this.client.get(`/grievances/booking/${bookingId}`);
  }

  async getGrievance(grievanceId: string) {
    return this.client.get(`/grievances/${grievanceId}`);
  }

  async resolveGrievance(grievanceId: string, resolution: string) {
    return this.client.post(`/grievances/${grievanceId}/resolve`, { resolution });
  }

  async getAnalyticsSummary(district?: string) {
    return this.client.get('/analytics/summary', { params: { district } });
  }

  async getWaitTimeHeatmap(centreId: string, days: number = 7) {
    return this.client.get(`/analytics/centre/${centreId}/wait-time-heatmap`, { params: { days } });
  }

  async getTurnaroundByCrop() {
    return this.client.get('/analytics/turnaround-by-crop');
  }

  async getUtilization() {
    return this.client.get('/analytics/utilization');
  }

  async recommendCentres(lat: number, lon: number, cropCode: string, maxDistance: number = 50) {
    return this.client.get('/ai/recommend-centres', {
      params: { latitude: lat, longitude: lon, crop_code: cropCode, max_distance: maxDistance },
    });
  }

  async getDemandForecast(days: number = 7) {
    return this.client.get('/ai/demand-forecast', { params: { days } });
  }

  async getCongestionPredictions(days: number = 7) {
    return this.client.get('/ai/congestion-prediction', { params: { days } });
  }

  async getCentreCongestion(centreId: string, date?: string) {
    return this.client.get(`/ai/centre/${centreId}/congestion`, { params: { date } });
  }

  async getFarmerNotifications(farmerId: string, limit: number = 50) {
    return this.client.get(`/notifications/farmer/${farmerId}`, { params: { limit } });
  }

  async getBookingNotifications(bookingId: string) {
    return this.client.get(`/notifications/booking/${bookingId}`);
  }
}

export const api = new ApiService();

export function useApi() {
  const { token } = useAuth();
  
  // This would need to be called when token changes
  // For now, we'll use the global api instance
  return api;
}