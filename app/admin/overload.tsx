import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';
import { ScreenHeader, OverloadPredictionCard, StatCard } from '../../components';
import { predictOverload, getCentreLoads } from '../../services/overloadService';
import { CENTRES } from '../../constants/config';

export default function OverloadDashboard() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const centreId = user?.centreId || 'c2';
  const prediction = predictOverload(centreId);
  const allLoads = getCentreLoads();

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <ScreenHeader title="AI Overload Prediction" />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: Spacing.md, paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats */}
        <View style={styles.statsRow}>
          <StatCard label="Centres" value={CENTRES.length} icon="🏢" accent={Colors.primary} />
          <StatCard label="At Risk" value={allLoads.filter(l => l.load === 'high').length} icon="⚠️" accent={Colors.error} />
          <StatCard label="Normal" value={allLoads.filter(l => l.load === 'normal').length} icon="✅" accent={Colors.success} />
        </View>

        {/* Current Centre Prediction */}
        <Text style={styles.sectionTitle}>Centre Prediction</Text>
        <OverloadPredictionCard prediction={prediction} />

        {/* All Centres Overview */}
        <Text style={[styles.sectionTitle, { marginTop: Spacing.md }]}>All Centres Status</Text>
        {allLoads.map(load => (
          <View key={load.centreId} style={[styles.centreRow, Shadow.sm]}>
            <View style={styles.centreInfo}>
              <Text style={styles.centreName}>{load.name}</Text>
              <Text style={styles.centreDemand}>
                Demand: {load.currentDemand} / Capacity: {load.capacity}
              </Text>
            </View>
            <View style={styles.loadBar}>
              <View style={[styles.loadFill, {
                width: `${Math.min(100, (load.currentDemand / load.capacity) * 100)}%`,
                backgroundColor: load.load === 'high' ? Colors.error : load.load === 'moderate' ? Colors.warning : Colors.success,
              }]} />
            </View>
            <Text style={[styles.loadLabel, {
              color: load.load === 'high' ? Colors.error : load.load === 'moderate' ? Colors.warning : Colors.success,
            }]}>
              {load.load.toUpperCase()}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  statsRow: { flexDirection: 'row', marginBottom: Spacing.md },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginBottom: Spacing.sm },
  centreRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.surface, borderRadius: Radius.md, padding: Spacing.sm, marginBottom: Spacing.sm,
  },
  centreInfo: { flex: 1 },
  centreName: { fontSize: FontSize.sm, fontWeight: FontWeight.semiBold, color: Colors.textPrimary },
  centreDemand: { fontSize: FontSize.xs, color: Colors.textMuted },
  loadBar: { width: 60, height: 6, backgroundColor: Colors.surfaceTint, borderRadius: 3, overflow: 'hidden' },
  loadFill: { height: '100%', borderRadius: 3 },
  loadLabel: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, width: 40, textAlign: 'right' },
});
