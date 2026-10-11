import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, FontSize, FontWeight, Shadow } from '../../constants/theme';
import { Badge } from '../ui/Badge';
import type { OverloadPrediction } from '../../services/overloadService';

interface Props {
  prediction: OverloadPrediction;
  onTransfer?: () => void;
}

export function OverloadPredictionCard({ prediction, onTransfer }: Props) {
  const isOverloaded = prediction.predictedOverloadHour !== -1;

  return (
    <View style={[styles.card, Shadow.sm, isOverloaded && styles.cardWarning]}>
      <View style={styles.header}>
        <MaterialIcons name="psychology" size={22} color={isOverloaded ? Colors.error : Colors.success} />
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>AI Overload Prediction</Text>
          <Text style={styles.titleTa}>AI அதிக சுமை கணிப்பு</Text>
        </View>
        <View style={styles.riskBadge}>
          <Text style={styles.riskValue}>{prediction.riskScore}%</Text>
          <Text style={styles.riskLabel}>Risk</Text>
        </View>
      </View>

      {isOverloaded && (
        <View style={styles.overloadInfo}>
          <MaterialIcons name="warning" size={16} color={Colors.error} />
          <Text style={styles.overloadText}>
            Predicted overload: {prediction.predictedOverloadHour}:00 – {prediction.predictedOverloadEnd + 1}:00
          </Text>
        </View>
      )}

      <Text style={styles.recommendation}>{prediction.recommendation}</Text>
      <Text style={styles.recommendationTa}>{prediction.recommendationTa}</Text>

      {prediction.suggestedTransferCount > 0 && (
        <View style={styles.transferBox}>
          <View style={styles.transferInfo}>
            <MaterialIcons name="swap-horiz" size={18} color={Colors.warning} />
            <Text style={styles.transferText}>
              Move {prediction.suggestedTransferCount} bookings → {prediction.suggestedTransferCentre || 'Nearby Centre'}
            </Text>
          </View>
          {onTransfer && (
            <Pressable onPress={onTransfer} style={styles.transferBtn}>
              <Text style={styles.transferBtnText}>Transfer</Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.md, gap: Spacing.sm },
  cardWarning: { borderWidth: 1.5, borderColor: Colors.error + '40' },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  title: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary, flex: 1 },
  titleTa: { fontSize: FontSize.xs, color: Colors.textMuted },
  riskBadge: { alignItems: 'center', backgroundColor: Colors.errorLight, borderRadius: Radius.sm, padding: Spacing.xs },
  riskValue: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.error },
  riskLabel: { fontSize: FontSize.xs, color: Colors.error },
  overloadInfo: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, backgroundColor: Colors.errorLight, borderRadius: Radius.sm, padding: Spacing.sm },
  overloadText: { fontSize: FontSize.sm, color: Colors.error, fontWeight: FontWeight.semiBold, flex: 1 },
  recommendation: { fontSize: FontSize.sm, color: Colors.textSecondary },
  recommendationTa: { fontSize: FontSize.sm, color: Colors.textMuted, fontStyle: 'italic' },
  transferBox: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.warningLight, borderRadius: Radius.sm, padding: Spacing.sm,
  },
  transferInfo: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, flex: 1 },
  transferText: { fontSize: FontSize.sm, color: Colors.textPrimary, fontWeight: FontWeight.semiBold },
  transferBtn: { backgroundColor: Colors.warning, borderRadius: Radius.sm, paddingHorizontal: 12, paddingVertical: 6 },
  transferBtnText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.textWhite },
});
