import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, FontSize, FontWeight, Shadow } from '../../constants/theme';
import { Badge } from '../ui/Badge';

interface Counter {
  id: number;
  status: 'processing' | 'quality_check' | 'maintenance' | 'idle';
  farmerName?: string;
}

interface Props {
  counters: Counter[];
  queueCount: number;
  avgProcessingTime: number;
  loadLevel: 'normal' | 'moderate' | 'high';
}

const COUNTER_STATUS_CONFIG = {
  processing: { color: Colors.success, label: 'Processing', labelTa: 'செயலாக்கம்', icon: 'sync' },
  quality_check: { color: Colors.warning, label: 'Quality Check', labelTa: 'தரம் சரிபார்ப்பு', icon: 'science' },
  maintenance: { color: Colors.error, label: 'Maintenance', labelTa: 'பராமரிப்பு', icon: 'build' },
  idle: { color: Colors.textMuted, label: 'Idle', labelTa: 'ஓய்வு', icon: 'pause' },
};

export function DigitalTwinCard({ counters, queueCount, avgProcessingTime, loadLevel }: Props) {
  return (
    <View style={[styles.card, Shadow.sm]}>
      <View style={styles.header}>
        <MaterialIcons name="hub" size={22} color={Colors.primary} />
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Centre Digital Twin</Text>
          <Text style={styles.titleTa}>மைய டிஜிட்டல் இரட்டை</Text>
        </View>
        <Badge
          label={loadLevel.toUpperCase()}
          bgColor={loadLevel === 'normal' ? Colors.successLight : loadLevel === 'moderate' ? Colors.warningLight : Colors.errorLight}
          color={loadLevel === 'normal' ? Colors.success : loadLevel === 'moderate' ? Colors.warning : Colors.error}
        />
      </View>

      <View style={styles.countersGrid}>
        {counters.map(counter => {
          const cfg = COUNTER_STATUS_CONFIG[counter.status];
          return (
            <View key={counter.id} style={[styles.counterBox, { borderLeftColor: cfg.color }]}>
              <View style={styles.counterTop}>
                <Text style={styles.counterLabel}>Counter {counter.id}</Text>
                <MaterialIcons name={cfg.icon as any} size={16} color={cfg.color} />
              </View>
              <Badge label={cfg.label} bgColor={cfg.color + '20'} color={cfg.color} size="sm" />
              {counter.farmerName && (
                <Text style={styles.farmerName}>{counter.farmerName}</Text>
              )}
            </View>
          );
        })}
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <MaterialIcons name="people" size={18} color={Colors.primary} />
          <Text style={styles.statValue}>{queueCount}</Text>
          <Text style={styles.statLabel}>Queue</Text>
        </View>
        <View style={styles.statBox}>
          <MaterialIcons name="timer" size={18} color={Colors.info} />
          <Text style={styles.statValue}>{avgProcessingTime} min</Text>
          <Text style={styles.statLabel}>Avg Processing</Text>
        </View>
        <View style={styles.statBox}>
          <MaterialIcons name="speed" size={18} color={loadLevel === 'high' ? Colors.error : loadLevel === 'moderate' ? Colors.warning : Colors.success} />
          <Text style={styles.statValue}>{loadLevel === 'high' ? 'HIGH' : loadLevel === 'moderate' ? 'MED' : 'LOW'}</Text>
          <Text style={styles.statLabel}>Load</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.md, gap: Spacing.sm },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  title: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary, flex: 1 },
  titleTa: { fontSize: FontSize.xs, color: Colors.textMuted },
  countersGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  counterBox: {
    flex: 1, minWidth: '45%', backgroundColor: Colors.surfaceTint, borderRadius: Radius.sm,
    padding: Spacing.sm, borderLeftWidth: 3, gap: 4,
  },
  counterTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  counterLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.semiBold, color: Colors.textPrimary },
  farmerName: { fontSize: FontSize.xs, color: Colors.textSecondary },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: Spacing.xs },
  statBox: { alignItems: 'center', gap: 2 },
  statValue: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  statLabel: { fontSize: FontSize.xs, color: Colors.textMuted },
});
