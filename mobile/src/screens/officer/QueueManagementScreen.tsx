import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { Header } from '../../components/Header';
import { api } from '../../services/api';
import { Ionicons } from '@expo/vector-icons';

interface QueueItem {
  id: string;
  token_number: string;
  farmer_name: string;
  position: number;
  status: string;
}

export const QueueManagementScreen = () => {
  const { t } = useLanguage();
  const [queue, setQueue] = useState<QueueItem[]>([
    { id: '1', token_number: 'TK-20260117-123', farmer_name: 'Harpreet Singh', position: 1, status: 'ARRIVED' },
    { id: '2', token_number: 'TK-20260117-124', farmer_name: 'Gurmeet Kaur', position: 2, status: 'CONFIRMED' },
    { id: '3', token_number: 'TK-20260117-125', farmer_name: 'Baljinder Singh', position: 3, status: 'BOOKED' },
    { id: '4', token_number: 'TK-20260117-126', farmer_name: 'Rajinder Kaur', position: 4, status: 'BOOKED' },
    { id: '5', token_number: 'TK-20260117-127', farmer_name: 'Sukhdev Singh', position: 5, status: 'BOOKED' },
  ]);
  const [nowServing, setNowServing] = useState<string | null>('TK-20260117-123');
  const [loading, setLoading] = useState<string | null>(null);

  const callNext = async () => {
    const waiting = queue.filter(q => q.status !== 'COMPLETED' && q.status !== 'CALLED');
    if (waiting.length === 0) {
      Alert.alert('Queue Empty', 'No farmers waiting');
      return;
    }
    const next = waiting[0];
    setNowServing(next.token_number);
    setQueue(prev => prev.map(q => q.id === next.id ? { ...q, status: 'CALLED' } : q));
    Alert.alert('Called', `Token ${next.token_number} called to counter`);
  };

  const markInProgress = async (token: string) => {
    setLoading(token);
    try {
      await api.callNextToken('centre-001');
      setQueue(prev => prev.map(q => q.token_number === token ? { ...q, status: 'QUALITY_CHECK' } : q));
    } catch (error) {
      Alert.alert('Error', 'Failed to update queue');
    } finally {
      setLoading(null);
    }
  };

  return (
    <View style={styles.container}>
      <Header title={t('officer.queueManagement')} />
      
      <View style={styles.nowServingCard}>
        <Text style={styles.nowServingLabel}>{t('farmer.nowServing')}</Text>
        <Text style={styles.nowServingToken}>{nowServing || '---'}</Text>
      </View>

      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={styles.actionButtonPrimary}
          onPress={callNext}
          disabled={loading !== null}
        >
          <Ionicons name="play" size={20} color="#FFFFFF" />
          <Text style={styles.actionButtonText}>{t('officer.callNext')}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.listContainer}>
        {queue.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.queueItem,
              item.token_number === nowServing && styles.queueItemActive,
              item.status === 'CALLED' && styles.queueItemCalled,
            ]}
          >
            <View style={styles.queueItemLeft}>
              <View style={[
                styles.positionBadge,
                item.token_number === nowServing && styles.positionBadgeActive,
              ]}>
                <Text style={styles.positionText}>
                  {item.token_number === nowServing ? '▶' : item.position}
                </Text>
              </View>
              <View>
                <Text style={styles.queueToken}>{item.token_number}</Text>
                <Text style={styles.queueFarmer}>{item.farmer_name}</Text>
              </View>
            </View>
            <View style={styles.queueItemRight}>
              {item.token_number !== nowServing && item.status !== 'CALLED' && (
                <TouchableOpacity
                  style={[styles.smallButton, loading === item.token_number && styles.smallButtonLoading]}
                  onPress={() => markInProgress(item.token_number)}
                  disabled={loading !== null}
                >
                  {loading === item.token_number ? (
                    <Text style={styles.smallButtonTextLoading}>...</Text>
                  ) : (
                    <Text style={styles.smallButtonText}>{t('officer.markInProgress')}</Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  nowServingCard: {
    margin: 16,
    padding: 24,
    backgroundColor: '#1B4F72',
    borderRadius: 16,
    alignItems: 'center',
  },
  nowServingLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#93C5FD',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  nowServingToken: {
    fontSize: 48,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: 'monospace',
  },
  actionsRow: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  actionButtonPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    backgroundColor: '#22C55E',
    borderRadius: 12,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 10,
  },
  queueItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  queueItemActive: {
    borderWidth: 2,
    borderColor: '#1B4F72',
    backgroundColor: '#E8F0FE',
  },
  queueItemCalled: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  queueItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  positionBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  positionBadgeActive: {
    backgroundColor: '#1B4F72',
  },
  positionText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1B4F72',
  },
  queueToken: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1B4F72',
    fontFamily: 'monospace',
  },
  queueFarmer: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 2,
  },
  queueItemRight: {
    alignItems: 'flex-end,
  },
  smallButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#1B4F72',
    borderRadius: 8,
  },
  smallButtonLoading: {
    backgroundColor: '#94A3B8',
  },
  smallButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  smallButtonTextLoading: {
    fontSize: 12,
    color: '#FFFFFF',
  },
});