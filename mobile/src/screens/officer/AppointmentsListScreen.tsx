import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { Header } from '../../components/Header';
import { api } from '../../services/api';
import { Ionicons } from '@expo/vector-icons';

interface Appointment {
  id: string;
  token_number: string;
  farmer_name: string;
  crop_code: string;
  quantity_quintals: number;
  time_slot: string;
  status: string;
  plain_status: Record<string, string>;
}

export const AppointmentsListScreen = () => {
  const { t, language } = useLanguage();
  const { centreId } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'scheduled' | 'arrived' | 'in_progress' | 'completed'>('all');

  useEffect(() => {
    loadAppointments();
  }, [centreId]);

  const loadAppointments = async () => {
    try {
      // Mock data for demo
      setAppointments([
        { id: '1', token_number: 'TK-20260117-123', farmer_name: 'Harpreet Singh', crop_code: 'WHEAT', quantity_quintals: 45, time_slot: '09:00-11:00', status: 'ARRIVED', plain_status: { en: 'Arrived at Centre', hi: 'केंद्र पर पहुंचे', pa: 'ਕੇਂਦਰ ਤੇ ਪਹੁੰਚੇ' } },
        { id: '2', token_number: 'TK-20260117-124', farmer_name: 'Gurmeet Kaur', crop_code: 'PADDY', quantity_quintals: 38, time_slot: '09:00-11:00', status: 'CONFIRMED', plain_status: { en: 'Appointment Confirmed', hi: 'अपॉइंटमेंट पुष्टि', pa: 'ਅਪੌਇੰਟਮੈਂਟ ਪੁਸ਼ਟੀ' } },
        { id: '3', token_number: 'TK-20260117-125', farmer_name: 'Baljinder Singh', crop_code: 'WHEAT', quantity_quintals: 52, time_slot: '11:00-13:00', status: 'BOOKED', plain_status: { en: 'Slot Reserved', hi: 'स्लॉट आरक्षित', pa: 'ਸਲਾਟ ਰਿਜ਼ਰਵਡ' } },
        { id: '4', token_number: 'TK-20260117-126', farmer_name: 'Rajinder Kaur', crop_code: 'MUSTARD', quantity_quintals: 28, time_slot: '11:00-13:00', status: 'QUALITY_CHECK', plain_status: { en: 'Quality Inspection', hi: 'गुणवत्ता जांच', pa: 'ਗੁਣਵੱਤਾ ਜਾਂਚ' } },
        { id: '5', token_number: 'TK-20260117-127', farmer_name: 'Sukhdev Singh', crop_code: 'WHEAT', quantity_quintals: 41, time_slot: '13:00-15:00', status: 'BOOKED', plain_status: { en: 'Slot Reserved', hi: 'स्लॉट आरक्षित', pa: 'ਸਲਾਟ ਰਿਜ਼ਰਵਡ' } },
      ]);
    } catch (error) {
      Alert.alert(t('common.error'), 'Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  const filteredAppointments = appointments.filter((apt) => {
    if (filter === 'all') return true;
    if (filter === 'scheduled') return ['BOOKED', 'CONFIRMED'].includes(apt.status);
    if (filter === 'arrived') return apt.status === 'ARRIVED';
    if (filter === 'in_progress') return ['QUALITY_CHECK', 'WEIGHMENT'].includes(apt.status);
    if (filter === 'completed') return ['PROCUREMENT_COMPLETED', 'PAID'].includes(apt.status);
    return true;
  });

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'BOOKED': return { color: '#64748B', icon: 'calendar' };
      case 'CONFIRMED': return { color: '#1B4F72', icon: 'checkmark-circle' };
      case 'ARRIVED': return { color: '#22C55E', icon: 'location' };
      case 'QUALITY_CHECK': return { color: '#F59E0B', icon: 'search' };
      case 'WEIGHMENT': return { color: '#8B5CF6', icon: 'scale' };
      case 'APPROVED': return { color: '#06B6D4', icon: 'checkmark-done-circle' };
      case 'PROCUREMENT_COMPLETED': return { color: '#8B5CF6', icon: 'bag-handle' };
      case 'PAID': return { color: '#22C55E', icon: 'cash' };
      default: return { color: '#64748B', icon: 'help-circle' };
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>{t('common.loading')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title={t('officer.appointments')} />
      
      <View style={styles.filterBar}>
        {['all', 'scheduled', 'arrived', 'in_progress', 'completed'].map((f) => (
          <TouchableOpacity
            key={f}
            style={[
              styles.filterButton,
              filter === f && styles.filterButtonActive,
            ]}
            onPress={() => setFilter(f)}
          >
            <Text style={[
              styles.filterText,
              filter === f && styles.filterTextActive,
            ]}>
              {t(`officer.filters.${f}`) || f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.listContainer}>
        {filteredAppointments.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-clear" size={48} color="#94A3B8" />
            <Text style={styles.emptyText}>No appointments found</Text>
          </View>
        ) : (
          filteredAppointments.map((apt) => {
            const statusConfig = getStatusConfig(apt.status);
            return (
              <View key={apt.id} style={styles.appointmentCard}>
                <View style={styles.appointmentHeader}>
                  <View style={styles.appointmentToken}>
                    <Text style={styles.tokenLabel}>{t('farmer.tokenNumber')}</Text>
                    <Text style={styles.tokenNumber}>{apt.token_number}</Text>
                  </View>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: statusConfig.color },
                  ]}>
                    <Ionicons name={statusConfig.icon} size={14} color="#FFFFFF" />
                    <Text style={styles.statusText}>
                      {apt.plain_status?.[language] || apt.plain_status?.en || apt.status}
                    </Text>
                  </View>
                </View>

                <View style={styles.appointmentDetails}>
                  <View style={styles.detailRow}>
                    <Ionicons name="person" size={18} color="#64748B" />
                    <Text style={styles.detailValue}>{apt.farmer_name}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Ionicons name="leaf" size={18} color="#64748B" />
                    <Text style={styles.detailValue}>
                      {apt.crop_code} - {apt.quantity_quintals} quintals
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Ionicons name="time" size={18} color="#64748B" />
                    <Text style={styles.detailValue}>{apt.time_slot}</Text>
                  </View>
                </View>

                {['BOOKED', 'CONFIRMED', 'ARRIVED'].includes(apt.status) && (
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => Alert.alert('Action', `Process ${apt.token_number}?`)}
                  >
                    <Text style={styles.actionButtonText}>
                      {apt.status === 'ARRIVED' ? 'Start Quality Check' : 'Check In Farmer'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBar: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  filterButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  filterButtonActive: {
    backgroundColor: '#1B4F72',
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1B4F72',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 16,
    color: '#64748B',
    marginTop: 12,
  },
  appointmentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  appointmentToken: {
    flex: 1,
  },
  tokenLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  tokenNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1B4F72',
    fontFamily: 'monospace',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  appointmentDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  detailValue: {
    fontSize: 14,
    color: '#1E293B',
  },
  actionButton: {
    marginTop: 12,
    paddingVertical: 10,
    backgroundColor: '#1B4F72',
    borderRadius: 10,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});