import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { useLanguage } from '../../context/LanguageContext';
import { Header } from '../../components/Header';
import { api } from '../../services/api';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const PROCUREMENT_STEPS = [
  { key: 'BOOKED', icon: 'calendar', labelKey: 'farmer.procurementSteps.booked' },
  { key: 'CONFIRMED', icon: 'checkmark-circle', labelKey: 'farmer.procurementSteps.confirmed' },
  { key: 'ARRIVED', icon: 'location', labelKey: 'farmer.procurementSteps.arrived' },
  { key: 'QUALITY_CHECK', icon: 'search', labelKey: 'farmer.procurementSteps.qualityCheck' },
  { key: 'WEIGHMENT', icon: 'scale', labelKey: 'farmer.procurementSteps.weighment' },
  { key: 'APPROVED', icon: 'checkmark-done-circle', labelKey: 'farmer.procurementSteps.approved' },
  { key: 'PROCUREMENT_COMPLETED', icon: 'bag-handle', labelKey: 'farmer.procurementSteps.procurementCompleted' },
  { key: 'PAYMENT_INITIATED', icon: 'card', labelKey: 'farmer.procurementSteps.paymentInitiated' },
  { key: 'PAYMENT_PROCESSING', icon: 'sync', labelKey: 'farmer.procurementSteps.paymentProcessing' },
  { key: 'PAID', icon: 'cash', labelKey: 'farmer.procurementSteps.paid' },
];

const STEP_ORDER = [
  'BOOKED', 'CONFIRMED', 'ARRIVED', 'QUALITY_CHECK', 'WEIGHMENT',
  'APPROVED', 'PROCUREMENT_COMPLETED', 'PAYMENT_INITIATED', 'PAYMENT_PROCESSING', 'PAID',
];

interface ProcurementTrackerScreenProps {
  tokenNumber: string;
  onBack: () => void;
}

export const ProcurementTrackerScreen = ({ tokenNumber, onBack }: ProcurementTrackerScreenProps) => {
  const { t, language } = useLanguage();
  const [booking, setBooking] = useState<any>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [tokenNumber]);

  const loadData = async () => {
    try {
      const bookingResponse = await api.getBookingByToken(tokenNumber);
      setBooking(bookingResponse.data);
      
      const timelineResponse = await api.getBookingTimeline(bookingResponse.data.id);
      setTimeline(timelineResponse.data);
    } catch (error) {
      // Mock data
      setBooking({
        token_number: tokenNumber,
        status: 'QUALITY_CHECK',
        crop_code: 'WHEAT',
        quantity_quintals: 45,
      });
      setTimeline([
        { status: 'BOOKED', plain_status: { en: 'Slot Reserved', hi: 'स्लॉट आरक्षित', pa: 'ਸਲਾਟ ਰਿਜ਼ਰਵਡ' }, timestamp: new Date(Date.now() - 86400000).toISOString() },
        { status: 'CONFIRMED', plain_status: { en: 'Appointment Confirmed', hi: 'अपॉइंटमेंट पुष्टि', pa: 'ਅਪੌਇੰਟਮੈਂਟ ਪੁਸ਼ਟੀ' }, timestamp: new Date(Date.now() - 82800000).toISOString() },
        { status: 'ARRIVED', plain_status: { en: 'Arrived at Centre', hi: 'केंद्र पर पहुंचे', pa: 'ਕੇਂਦਰ ਤੇ ਪਹੁੰਚੇ' }, timestamp: new Date(Date.now() - 7200000).toISOString() },
        { status: 'QUALITY_CHECK', plain_status: { en: 'Quality Inspection', hi: 'गुणवत्ता जांच', pa: 'ਗੁਣਵੱਤਾ ਜਾਂਚ' }, timestamp: new Date().toISOString() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getStepStatus = (stepKey: string): 'completed' | 'current' | 'pending' => {
    if (!booking) return 'pending';
    const currentIndex = STEP_ORDER.indexOf(booking.status);
    const stepIndex = STEP_ORDER.indexOf(stepKey);
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'current';
    return 'pending';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>{t('common.loading')}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Header title={t('farmer.procurementTracker')} showBack onBack={onBack} />
      
      <View style={styles.headerCard}>
        <View style={styles.headerInfo}>
          <Text style={styles.headerToken}>{tokenNumber}</Text>
          <Text style={styles.headerCrop}>{booking?.crop_code} - {booking?.quantity_quintals} quintals</Text>
        </View>
        <View style={styles.headerProgress}>
          <Text style={styles.progressLabel}>{t('common.progress')}</Text>
          <Text style={styles.progressValue}>
            {STEP_ORDER.indexOf(booking?.status) + 1} / {STEP_ORDER.length}
          </Text>
        </View>
      </View>

      <View style={styles.stepsContainer}>
        {PROCUREMENT_STEPS.map((step, index) => {
          const status = getStepStatus(step.key);
          const isLast = index === PROCUREMENT_STEPS.length - 1;
          
          return (
            <View key={step.key} style={styles.stepContainer}>
              <View style={styles.stepRow}>
                <View style={styles.stepConnector}>
                  {!isLast && (
                    <View style={[
                      styles.connectorLine,
                      status === 'completed' && styles.connectorCompleted,
                    ]} />
                  )}
                  <View style={[
                    styles.stepCircle,
                    status === 'completed' && styles.stepCircleCompleted,
                    status === 'current' && styles.stepCircleCurrent,
                  ]}>
                    {status === 'completed' && (
                      <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                    )}
                    {status === 'current' && (
                      <View style={styles.pulseDot} />
                    )}
                    {status === 'pending' && (
                      <Ionicons name={step.icon} size={20} color="#94A3B8" />
                    )}
                  </View>
                </View>
                <View style={styles.stepContent}>
                  <Text style={[
                    styles.stepLabel,
                    status === 'completed' && styles.stepLabelCompleted,
                    status === 'current' && styles.stepLabelCurrent,
                  ]}>
                    {t(step.labelKey)}
                  </Text>
                  {timeline.find((t: any) => t.status === step.key) && (
                    <Text style={styles.stepTime}>
                      {new Date(timeline.find((t: any) => t.status === step.key).timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  )}
                </View>
              </View>
            </View>
          );
        })}
      </View>

      <View style={styles.currentStatusCard}>
        <Text style={styles.currentStatusTitle}>
          <Ionicons name="information-circle" size={20} color="#1B4F72" />
          {t('common.currentStatus')}
        </Text>
        <Text style={styles.currentStatusValue}>
          {booking?.plain_status?.[language] || booking?.plain_status?.en || 'Processing...'}
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  headerInfo: {
    flex: 1,
  },
  headerToken: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1B4F72',
    fontFamily: 'monospace',
  },
  headerCrop: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
  },
  headerProgress: {
    alignItems: 'flex-end',
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  progressValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1B4F72',
  },
  stepsContainer: {
    marginHorizontal: 16,
  },
  stepContainer: {
    marginBottom: 8,
  },
  stepRow: {
    flexDirection: 'row',
    gap: 16,
  },
  stepConnector: {
    alignItems: 'center',
    width: 40,
  },
  connectorLine: {
    width: 2,
    height: 40,
    backgroundColor: '#E2E8F0',
  },
  connectorCompleted: {
    backgroundColor: '#22C55E',
  },
  stepCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleCompleted: {
    backgroundColor: '#22C55E',
    borderColor: '#22C55E',
  },
  stepCircleCurrent: {
    backgroundColor: '#1B4F72',
    borderColor: '#1B4F72',
    borderWidth: 3,
  },
  pulseDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
  },
  stepContent: {
    flex: 1,
    paddingVertical: 4,
  },
  stepLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#94A3B8',
  },
  stepLabelCompleted: {
    color: '#1E293B',
    fontWeight: '600',
  },
  stepLabelCurrent: {
    color: '#1B4F72',
    fontWeight: '700',
  },
  stepTime: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  currentStatusCard: {
    marginHorizontal: 16,
    marginTop: 24,
    padding: 20,
    backgroundColor: '#E8F0FE',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1B4F72',
  },
  currentStatusTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1B4F72',
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  currentStatusValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
  },
});