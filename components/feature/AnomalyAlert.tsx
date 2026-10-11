import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, FontSize, FontWeight, Shadow } from '../../constants/theme';
import { Badge } from '../ui/Badge';
import { getSeverityColor, getAnomalyIcon, type AnomalyAlert } from '../../services/anomalyService';

interface Props {
  anomalies: AnomalyAlert[];
}

export function AnomalyAlertCard({ anomalies }: Props) {
  if (anomalies.length === 0) {
    return (
      <View style={[styles.card, Shadow.sm, styles.emptyCard]}>
        <MaterialIcons name="verified" size={32} color={Colors.success} />
        <Text style={styles.emptyTitle}>No Anomalies Detected</Text>
        <Text style={styles.emptyText}>All systems operating normally.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <MaterialIcons name="security" size={22} color={Colors.error} />
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>AI Anomaly Detection</Text>
          <Text style={styles.titleTa}>AI வித்தியாசம் கண்டறிதல்</Text>
        </View>
        <Badge label={`${anomalies.length} ALERTS`} bgColor={Colors.errorLight} color={Colors.error} size="sm" />
      </View>

      {anomalies.map(anomaly => (
        <View key={anomaly.id} style={[styles.alertCard, Shadow.sm, { borderLeftColor: getSeverityColor(anomaly.severity) }]}>
          <View style={styles.alertTop}>
            <View style={[styles.alertIcon, { backgroundColor: getSeverityColor(anomaly.severity) + '20' }]}>
              <MaterialIcons name={getAnomalyIcon(anomaly.type) as any} size={20} color={getSeverityColor(anomaly.severity)} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.alertTitle}>{anomaly.title}</Text>
              <Text style={styles.alertTitleTa}>{anomaly.titleTa}</Text>
            </View>
            <Badge label={anomaly.severity.toUpperCase()} bgColor={getSeverityColor(anomaly.severity) + '20'} color={getSeverityColor(anomaly.severity)} size="sm" />
          </View>

          <Text style={styles.alertDesc}>{anomaly.description}</Text>

          <View style={styles.alertStats}>
            <View style={styles.alertStat}>
              <Text style={styles.alertStatLabel}>Actual</Text>
              <Text style={[styles.alertStatValue, { color: getSeverityColor(anomaly.severity) }]}>{anomaly.value}</Text>
            </View>
            <MaterialIcons name="arrow-forward" size={14} color={Colors.textMuted} />
            <View style={styles.alertStat}>
              <Text style={styles.alertStatLabel}>Expected</Text>
              <Text style={styles.alertStatValue}>{anomaly.expected}</Text>
            </View>
            <View style={styles.alertStat}>
              <Text style={styles.alertStatLabel}>Deviation</Text>
              <Text style={[styles.alertStatValue, { color: getSeverityColor(anomaly.severity) }]}>+{anomaly.deviation}%</Text>
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.sm },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  title: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  titleTa: { fontSize: FontSize.xs, color: Colors.textMuted },
  card: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.md },
  emptyCard: { alignItems: 'center', gap: Spacing.sm },
  emptyTitle: { fontSize: FontSize.md, fontWeight: FontWeight.semiBold, color: Colors.textPrimary },
  emptyText: { fontSize: FontSize.sm, color: Colors.textMuted },
  alertCard: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.md,
    borderLeftWidth: 4, gap: Spacing.sm,
  },
  alertTop: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  alertIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  alertTitle: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  alertTitleTa: { fontSize: FontSize.xs, color: Colors.textMuted },
  alertDesc: { fontSize: FontSize.sm, color: Colors.textSecondary },
  alertStats: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, backgroundColor: Colors.surfaceTint, borderRadius: Radius.sm, padding: Spacing.sm },
  alertStat: { alignItems: 'center' },
  alertStatLabel: { fontSize: 10, color: Colors.textMuted },
  alertStatValue: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textPrimary },
});
