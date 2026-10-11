import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { Button } from '../../components/Button';
import { Header } from '../../components/Header';
import { api } from '../../services/api';
import { Centre } from '../../types';
import { Ionicons } from '@expo/vector-icons';

interface CentreSelectionScreenProps {
  cropCode: string;
  onSelectCentre: (centre: Centre) => void;
}

export const CentreSelectionScreen = ({ cropCode, onSelectCentre }: CentreSelectionScreenProps) => {
  const { t } = useLanguage();
  const [centres, setCentres] = useState<Centre[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCentre, setSelectedCentre] = useState<Centre | null>(null);

  useEffect(() => {
    loadCentres();
  }, []);

  const loadCentres = async () => {
    try {
      const response = await api.getNearbyCentres(29.6857, 76.9905, cropCode, 50);
      setCentres(response.data);
    } catch (error) {
      // Mock data for demo
      setCentres([
        {
          id: 'centre-001',
          code: 'KRN001',
          name: 'Karnal Mandi',
          district: 'Karnal',
          state: 'Haryana',
          address: 'Grain Market, Karnal, Haryana 132001',
          latitude: 29.6857,
          longitude: 76.9905,
          capacityPerSlot: 25,
          activeCounters: 4,
          status: 'NORMAL',
          currentQueueLength: 8,
          estimatedWaitMin: 15,
          distanceKm: 5.2,
          availableSlotsToday: 12,
        },
        {
          id: 'centre-002',
          code: 'PNP001',
          name: 'Panipat Centre',
          district: 'Panipat',
          state: 'Haryana',
          address: 'New Grain Market, Panipat, Haryana 132103',
          latitude: 29.3909,
          longitude: 76.9635,
          capacityPerSlot: 20,
          activeCounters: 3,
          status: 'MODERATE',
          currentQueueLength: 18,
          estimatedWaitMin: 35,
          distanceKm: 28.5,
          availableSlotsToday: 5,
        },
        {
          id: 'centre-003',
          code: 'KKR001',
          name: 'Kurukshetra Depot',
          district: 'Kurukshetra',
          state: 'Haryana',
          address: 'Anaj Mandi, Kurukshetra, Haryana 136118',
          latitude: 29.9695,
          longitude: 76.8783,
          capacityPerSlot: 30,
          activeCounters: 5,
          status: 'NORMAL',
          currentQueueLength: 12,
          estimatedWaitMin: 20,
          distanceKm: 42.1,
          availableSlotsToday: 18,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'NORMAL':
        return { color: '#22C55E', label: t('status.booked'), icon: 'checkmark-circle' };
      case 'MODERATE':
        return { color: '#F59E0B', label: t('status.confirmed'), icon: 'alert-circle' };
      case 'HEAVY':
        return { color: '#EF4444', label: t('status.arrived'), icon: 'warning' };
      default:
        return { color: '#64748B', label: 'Unknown', icon: 'help-circle' };
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
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Header title={t('farmer.centreSelection')} showBack />
      
      <View style={styles.listContainer}>
        {centres.map((centre) => {
          const statusConfig = getStatusConfig(centre.status);
          return (
            <TouchableOpacity
              key={centre.id}
              style={[
                styles.centreCard,
                selectedCentre?.id === centre.id && styles.centreCardSelected,
              ]}
              onPress={() => setSelectedCentre(centre)}
            >
              <View style={styles.centreHeader}>
                <View style={styles.centreInfo}>
                  <Text style={styles.centreName}>{centre.name}</Text>
                  <Text style={styles.centreAddress}>{centre.address}</Text>
                </View>
                <View style={[
                  styles.statusBadge,
                  { backgroundColor: statusConfig.color },
                ]}>
                  <Ionicons name={statusConfig.icon} size={16} color="#FFFFFF" />
                  <Text style={styles.statusText}>{statusConfig.label}</Text>
                </View>
              </View>

              <View style={styles.metricsRow}>
                <View style={styles.metric}>
                  <Ionicons name="location" size={18} color="#1B4F72" />
                  <Text style={styles.metricValue}>{centre.distanceKm?.toFixed(1)} km</Text>
                  <Text style={styles.metricLabel}>{t('farmer.distance')}</Text>
                </View>
                <View style={styles.metric}>
                  <Ionicons name="people" size={18} color="#1B4F72" />
                  <Text style={styles.metricValue}>{centre.currentQueueLength}</Text>
                  <Text style={styles.metricLabel}>{t('farmer.queueLength')}</Text>
                </View>
                <View style={styles.metric}>
                  <Ionicons name="time" size={18} color="#1B4F72" />
                  <Text style={styles.metricValue}>{centre.estimatedWaitMin} min</Text>
                  <Text style={styles.metricLabel}>{t('farmer.estimatedWait')}</Text>
                </View>
                <View style={styles.metric}>
                  <Ionicons name="calendar" size={18} color="#1B4F72" />
                  <Text style={styles.metricValue}>{centre.availableSlotsToday}</Text>
                  <Text style={styles.metricLabel}>{t('farmer.availableSlots')}</Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {selectedCentre && (
        <View style={styles.bottomAction}>
          <Button
            title={`${t('common.confirm')} ${selectedCentre.name}`}
            onPress={() => onSelectCentre(selectedCentre)}
            fullWidth
            size="lg"
          />
        </View>
      )}
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
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    gap: 16,
  },
  centreCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  centreCardSelected: {
    borderColor: '#1B4F72',
  },
  centreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  centreInfo: {
    flex: 1,
  },
  centreName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  centreAddress: {
    fontSize: 13,
    color: '#64748B',
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
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  metricsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metric: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1B4F72',
    marginTop: 4,
  },
  metricLabel: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
  },
  bottomAction: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
  },
});