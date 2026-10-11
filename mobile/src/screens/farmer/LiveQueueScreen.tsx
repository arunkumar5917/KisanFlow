import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { useLanguage } from '../../context/LanguageContext';
import { Header } from '../../components/Header';
import { api } from '../../services/api';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface LiveQueueScreenProps {
  tokenNumber: string;
  onBack: () => void;
}

export const LiveQueueScreen = ({ tokenNumber, onBack }: LiveQueueScreenProps) => {
  const { t, language } = useLanguage();
  const [queueData, setQueueData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQueue();
    const interval = setInterval(loadQueue, 10000);
    return () => clearInterval(interval);
  }, [tokenNumber]);

  const loadQueue = async () => {
    try {
      const response = await api.getLiveQueue(tokenNumber);
      setQueueData(response.data);
    } catch (error) {
      // Mock data
      const position = Math.max(0, Math.floor(Math.random() * 15));
      const nowServing = Math.max(1, 20 - position);
      setQueueData({
        token_number: tokenNumber,
        position,
        now_serving: nowServing,
        estimated_wait_min: position * 5,
        status: position === 0 ? 'ARRIVED' : 'WAITING',
        plain_status: {
          en: position === 0 ? 'Arrived at Centre' : 'Waiting in Queue',
          hi: position === 0 ? 'केंद्र पर पहुंचे' : 'कतार में प्रतीक्षा',
          pa: position === 0 ? 'ਕੇਂਦਰ ਤੇ ਪਹੁੰਚੇ' : 'ਕਤਾਰ ਵਿੱਚ ਇੰਤਜ਼ਾਰ',
        },
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ARRIVED': return '#22C55E';
      case 'WAITING': return '#F59E0B';
      default: return '#1B4F72';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>{t('common.loading')}</Text>
      </View>
    );
  }

  const statusText = queueData?.plain_status?.[language] || queueData?.plain_status?.en || 'Waiting';

  return (
    <View style={styles.container}>
      <Header title={t('farmer.liveQueue')} showBack onBack={onBack} />
      
      <View style={styles.mainCard}>
        <View style={styles.tokenDisplay}>
          <Text style={styles.tokenLabel}>{t('farmer.tokenNumber')}</Text>
          <Text style={styles.tokenNumber}>{queueData?.token_number}</Text>
        </View>

        <View style={styles.statusBadgeContainer}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(queueData?.status) }]}>
            <Text style={styles.statusText}>{statusText}</Text>
          </View>
        </View>

        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <Ionicons name="people" size={28} color="#1B4F72" />
            <Text style={styles.metricValue}>{queueData?.position || 0}</Text>
            <Text style={styles.metricLabel}>{t('farmer.farmersAhead')}</Text>
          </View>
          <View style={styles.metricCard}>
            <Ionicons name="checkmark-circle" size={28} color="#22C55E" />
            <Text style={styles.metricValue}>{queueData?.now_serving || 0}</Text>
            <Text style={styles.metricLabel}>{t('farmer.nowServing')}</Text>
          </View>
          <View style={styles.metricCard}>
            <Ionicons name="time" size={28} color="#F59E0B" />
            <Text style={styles.metricValue}>{queueData?.estimated_wait_min || 0}</Text>
            <Text style={styles.metricLabel}>{t('farmer.minutes')}</Text>
          </View>
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${Math.min(100, Math.max(0, 100 - (queueData?.position || 0) * 10))}%` },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {queueData?.position === 0 ? 'Your turn is next!' : `${queueData?.position} farmers ahead of you`}
          </Text>
        </View>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>
          <Ionicons name="information-circle" size={20} color="#1B4F72" />
          Live Queue Updates
        </Text>
        <Text style={styles.infoText}>
          This screen updates automatically every 10 seconds. Keep this screen open while waiting.
        </Text>
        <Text style={styles.infoText}>
          You will receive SMS notifications when your token is called.
        </Text>
      </View>
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
  mainCard: {
    margin: 16,
    padding: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 6,
  },
  tokenDisplay: {
    alignItems: 'center',
    marginBottom: 20,
  },
  tokenLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  tokenNumber: {
    fontSize: 56,
    fontWeight: '800',
    color: '#1B4F72',
    fontFamily: 'monospace',
  },
  statusBadgeContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  statusBadge: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 25,
  },
  statusText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 24,
  },
  metricCard: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  metricValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1E293B',
    marginTop: 8,
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
  },
  progressContainer: {
    marginTop: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#1B4F72',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 8,
  },
  infoCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#E8F0FE',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1B4F72',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1B4F72',
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 13,
    color: '#1B4F72',
    lineHeight: 20,
    marginBottom: 4,
  },
});