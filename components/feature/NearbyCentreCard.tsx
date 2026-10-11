import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, FontSize, FontWeight, Shadow } from '../../constants/theme';
import { Badge } from '../ui/Badge';
import type { NearbyCentre } from '../../services/nearbyCentreService';

interface Props {
  centres: NearbyCentre[];
  onSelect?: (centre: NearbyCentre) => void;
}

export function NearbyCentreCard({ centres, onSelect }: Props) {
  return (
    <View style={[styles.card, Shadow.sm]}>
      <View style={styles.header}>
        <MaterialIcons name="near-me" size={22} color={Colors.primary} />
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Nearby Centres</Text>
          <Text style={styles.titleTa}>அருகிலுள்ள மையங்கள்</Text>
        </View>
      </View>

      {centres.map((centre, idx) => (
        <Pressable
          key={centre.centreId}
          onPress={() => onSelect?.(centre)}
          style={({ pressed }) => [
            styles.centreRow,
            centre.recommended && styles.centreRecommended,
            pressed && styles.pressed,
          ]}
        >
          {centre.recommended && (
            <View style={styles.recommendedBadge}>
              <MaterialIcons name="star" size={12} color={Colors.warning} />
              <Text style={styles.recommendedText}>RECOMMENDED</Text>
            </View>
          )}
          <View style={styles.centreTop}>
            <View style={styles.centreInfo}>
              <Text style={styles.centreName}>{centre.name}</Text>
              <Text style={styles.centreDistrict}>{centre.district} · {centre.distance} km</Text>
            </View>
            <Badge
              label={centre.load.toUpperCase()}
              bgColor={centre.load === 'normal' ? Colors.successLight : centre.load === 'moderate' ? Colors.warningLight : Colors.errorLight}
              color={centre.load === 'normal' ? Colors.success : centre.load === 'moderate' ? Colors.warning : Colors.error}
              size="sm"
            />
          </View>
          <View style={styles.centreStats}>
            <View style={styles.statItem}>
              <MaterialIcons name="people" size={14} color={Colors.textMuted} />
              <Text style={styles.statText}>{centre.waitingCount} waiting</Text>
            </View>
            <View style={styles.statItem}>
              <MaterialIcons name="schedule" size={14} color={Colors.textMuted} />
              <Text style={styles.statText}>~{centre.estimatedWait} min</Text>
            </View>
          </View>
          {centre.recommended && (
            <Text style={styles.reason}>{centre.reason}</Text>
          )}
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.md, gap: Spacing.sm },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.xs },
  title: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  titleTa: { fontSize: FontSize.xs, color: Colors.textMuted },
  centreRow: {
    backgroundColor: Colors.surfaceTint, borderRadius: Radius.sm, padding: Spacing.sm, gap: 6,
  },
  centreRecommended: { borderWidth: 1.5, borderColor: Colors.primary + '40', backgroundColor: Colors.primary + '08' },
  recommendedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  recommendedText: { fontSize: 10, fontWeight: FontWeight.bold, color: Colors.primary, letterSpacing: 1 },
  centreTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  centreInfo: { flex: 1 },
  centreName: { fontSize: FontSize.sm, fontWeight: FontWeight.semiBold, color: Colors.textPrimary },
  centreDistrict: { fontSize: FontSize.xs, color: Colors.textMuted },
  centreStats: { flexDirection: 'row', gap: Spacing.md },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText: { fontSize: FontSize.xs, color: Colors.textSecondary },
  reason: { fontSize: FontSize.xs, color: Colors.primary, fontWeight: FontWeight.semiBold },
  pressed: { opacity: 0.7 },
});
