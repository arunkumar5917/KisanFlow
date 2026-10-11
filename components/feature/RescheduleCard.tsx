import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, FontSize, FontWeight, Shadow } from '../../constants/theme';
import { Badge } from '../ui/Badge';
import type { RescheduleOption } from '../../services/rescheduleService';

interface Props {
  currentSlot: string;
  options: RescheduleOption[];
  onSelect: (option: RescheduleOption) => void;
}

export function RescheduleCard({ currentSlot, options, onSelect }: Props) {
  return (
    <View style={[styles.card, Shadow.sm]}>
      <View style={styles.header}>
        <MaterialIcons name="event-repeat" size={22} color={Colors.warning} />
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Dynamic Reschedule</Text>
          <Text style={styles.titleTa}>மாற்று ஸ்லாட்</Text>
        </View>
      </View>

      <View style={styles.currentSlot}>
        <Text style={styles.currentLabel}>Current Slot</Text>
        <Text style={styles.currentTime}>{currentSlot}</Text>
      </View>

      <Text style={styles.sectionTitle}>Available Alternatives</Text>

      {options.length === 0 ? (
        <Text style={styles.noOptions}>No alternative slots available today.</Text>
      ) : (
        options.slice(0, 4).map((opt, idx) => (
          <Pressable
            key={idx}
            onPress={() => onSelect(opt)}
            style={({ pressed }) => [styles.optionRow, pressed && styles.pressed]}
          >
            <View style={styles.optionLeft}>
              <MaterialIcons name="schedule" size={18} color={Colors.primary} />
              <View>
                <Text style={styles.optionTime}>{opt.slotTime}</Text>
                <Text style={styles.optionWait}>~{opt.estimatedWait} min wait</Text>
              </View>
            </View>
            <View style={styles.optionRight}>
              <Badge
                label={opt.crowdLevel.toUpperCase()}
                bgColor={opt.crowdLevel === 'low' ? Colors.successLight : opt.crowdLevel === 'moderate' ? Colors.warningLight : Colors.errorLight}
                color={opt.crowdLevel === 'low' ? Colors.success : opt.crowdLevel === 'moderate' ? Colors.warning : Colors.error}
                size="sm"
              />
              <MaterialIcons name="chevron-right" size={20} color={Colors.textMuted} />
            </View>
          </Pressable>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.md, gap: Spacing.sm },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.xs },
  title: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  titleTa: { fontSize: FontSize.xs, color: Colors.textMuted },
  currentSlot: {
    backgroundColor: Colors.warningLight, borderRadius: Radius.sm, padding: Spacing.sm, alignItems: 'center',
  },
  currentLabel: { fontSize: FontSize.xs, color: Colors.warning },
  currentTime: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  sectionTitle: { fontSize: FontSize.sm, fontWeight: FontWeight.semiBold, color: Colors.textSecondary, marginTop: Spacing.xs },
  noOptions: { fontSize: FontSize.sm, color: Colors.textMuted, textAlign: 'center', padding: Spacing.md },
  optionRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: Colors.surfaceTint, borderRadius: Radius.sm, padding: Spacing.sm,
  },
  optionLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  optionTime: { fontSize: FontSize.sm, fontWeight: FontWeight.semiBold, color: Colors.textPrimary },
  optionWait: { fontSize: FontSize.xs, color: Colors.textMuted },
  optionRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  pressed: { opacity: 0.7 },
});
