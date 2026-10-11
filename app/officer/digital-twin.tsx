import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';
import { useProcurement } from '../../contexts/ProcurementContext';
import { ScreenHeader, DigitalTwinCard, AnomalyAlertCard } from '../../components';
import { detectAnomalies } from '../../services/anomalyService';

export default function OfficerDigitalTwin() {
  const { user } = useAuth();
  const { getBookingsByCentre } = useProcurement();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<'twin' | 'anomalies'>('twin');

  const centreId = user?.centreId || 'c2';
  const allBookings = getBookingsByCentre(centreId);
  const waiting = allBookings.filter(b => ['arrived', 'waiting', 'called'].includes(b.status)).length;
  const processing = allBookings.filter(b => ['weighment', 'quality_check'].includes(b.status)).length;
  const anomalies = detectAnomalies(centreId);

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <ScreenHeader title="Centre Monitor" />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: Spacing.md, paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Tab Toggle */}
        <View style={styles.tabRow}>
          <Pressable
            onPress={() => setTab('twin')}
            style={[styles.tab, tab === 'twin' && styles.tabActive]}
          >
            <MaterialIcons name="hub" size={18} color={tab === 'twin' ? Colors.textWhite : Colors.textSecondary} />
            <Text style={[styles.tabText, tab === 'twin' && styles.tabTextActive]}>Digital Twin</Text>
          </Pressable>
          <Pressable
            onPress={() => setTab('anomalies')}
            style={[styles.tab, tab === 'anomalies' && styles.tabActive]}
          >
            <MaterialIcons name="security" size={18} color={tab === 'anomalies' ? Colors.textWhite : Colors.textSecondary} />
            <Text style={[styles.tabText, tab === 'anomalies' && styles.tabTextActive]}>Anomalies ({anomalies.length})</Text>
          </Pressable>
        </View>

        {tab === 'twin' ? (
          <DigitalTwinCard
            counters={[
              { id: 1, status: 'processing', farmerName: 'Arun Kumar' },
              { id: 2, status: 'processing', farmerName: 'Selvam R' },
              { id: 3, status: 'quality_check', farmerName: 'Priya M' },
              { id: 4, status: 'maintenance' },
            ]}
            queueCount={waiting}
            avgProcessingTime={11}
            loadLevel={processing > 5 ? 'high' : processing > 3 ? 'moderate' : 'normal'}
          />
        ) : (
          <AnomalyAlertCard anomalies={anomalies} />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  tabRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  tab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 10, borderRadius: Radius.md, backgroundColor: Colors.surfaceTint,
  },
  tabActive: { backgroundColor: Colors.primary },
  tabText: { fontSize: FontSize.sm, fontWeight: FontWeight.semiBold, color: Colors.textSecondary },
  tabTextActive: { color: Colors.textWhite },
});
