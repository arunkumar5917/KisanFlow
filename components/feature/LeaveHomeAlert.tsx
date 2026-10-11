import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, FontSize, FontWeight, Shadow } from '../../constants/theme';
import type { LeaveHomeAlert } from '../../services/smartAlertService';

interface Props {
  alert: LeaveHomeAlert;
}

export function LeaveHomeAlertCard({ alert }: Props) {
  return (
    <View style={[styles.card, Shadow.sm]}>
      <View style={styles.iconRow}>
        <View style={styles.iconCircle}>
          <MaterialIcons name="home-work" size={24} color={Colors.primary} />
        </View>
        <View style={styles.iconLine} />
        <View style={styles.iconCircle}>
          <MaterialIcons name=" directions-car" size={24} color={Colors.info} />
        </View>
        <View style={styles.iconLine} />
        <View style={styles.iconCircle}>
          <MaterialIcons name="store" size={24} color={Colors.success} />
        </View>
      </View>

      <Text style={styles.title}>Smart Leave-Home Alert</Text>
      <Text style={styles.titleTa}>சிறந்த வீட்டை விடும் எச்சரிக்கை</Text>

      <View style={styles.infoGrid}>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Token</Text>
          <Text style={styles.infoValue}>{alert.tokenNumber}</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Queue Position</Text>
          <Text style={styles.infoValue}>#{alert.queuePosition}</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Est. Processing</Text>
          <Text style={styles.infoValue}>{alert.estimatedProcessingTime} min</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Travel Time</Text>
          <Text style={styles.infoValue}>{alert.travelTimeEstimate} min</Text>
        </View>
      </View>

      <View style={styles.leaveTimeBox}>
        <MaterialIcons name="alarm" size={20} color={Colors.textWhite} />
        <View style={{ flex: 1 }}>
          <Text style={styles.leaveLabel}>Leave Home At</Text>
          <Text style={styles.leaveTime}>
            {alert.leaveHomeTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
          </Text>
        </View>
      </View>

      <Text style={styles.message}>{alert.message}</Text>
      <Text style={styles.messageTa}>{alert.messageTa}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.md, gap: Spacing.sm,
  },
  iconRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.sm },
  iconCircle: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.surfaceTint,
    alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: Colors.border,
  },
  iconLine: { flex: 1, height: 2, backgroundColor: Colors.border, marginHorizontal: 4 },
  title: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary, textAlign: 'center' },
  titleTa: { fontSize: FontSize.sm, color: Colors.textMuted, textAlign: 'center', marginBottom: Spacing.xs },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  infoItem: {
    flex: 1, minWidth: '45%', backgroundColor: Colors.surfaceTint, borderRadius: Radius.sm,
    padding: Spacing.sm, alignItems: 'center',
  },
  infoLabel: { fontSize: FontSize.xs, color: Colors.textMuted },
  infoValue: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  leaveTimeBox: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.primary, borderRadius: Radius.md, padding: Spacing.md,
  },
  leaveLabel: { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.8)' },
  leaveTime: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textWhite },
  message: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center' },
  messageTa: { fontSize: FontSize.sm, color: Colors.textMuted, textAlign: 'center', fontStyle: 'italic' },
});
