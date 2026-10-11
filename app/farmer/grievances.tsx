import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, Radius, FontSize, FontWeight, Shadow } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';
import { useProcurement } from '../../contexts/ProcurementContext';
import { ScreenHeader, DisputeForm, Badge } from '../../components';
import { GRIEVANCE_TYPES, GRIEVANCE_STATUS_CONFIG, type GrievanceType } from '../../services/disputeService';

export default function GrievancesScreen() {
  const { user } = useAuth();
  const { grievances, fileGrievance, getGrievancesByFarmer } = useProcurement();
  const insets = useSafeAreaInsets();
  const [showForm, setShowForm] = useState(false);

  const farmerId = user?.id || 'f001';
  const myGrievances = getGrievancesByFarmer(farmerId);

  const handleSubmit = (type: GrievanceType, description: string) => {
    fileGrievance({
      farmerId,
      farmerName: user?.name || 'Farmer',
      type,
      description,
      centreId: user?.centreId || 'c2',
    });
    setShowForm(false);
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <ScreenHeader title="Grievances" />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: Spacing.md, paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
      >
        {!showForm && (
          <Text
            style={styles.newBtn}
            onPress={() => setShowForm(true)}
          >
            <MaterialIcons name="add-circle" size={18} color={Colors.textWhite} /> File New Grievance
          </Text>
        )}

        {showForm && (
          <DisputeForm
            onSubmit={handleSubmit}
            onCancel={() => setShowForm(false)}
          />
        )}

        <Text style={styles.sectionTitle}>My Grievances ({myGrievances.length})</Text>

        {myGrievances.length === 0 ? (
          <View style={styles.empty}>
            <MaterialIcons name="check-circle" size={48} color={Colors.success} />
            <Text style={styles.emptyText}>No grievances filed. All good!</Text>
          </View>
        ) : (
          myGrievances.map(g => {
            const typeCfg = GRIEVANCE_TYPES[g.type];
            const statusCfg = GRIEVANCE_STATUS_CONFIG[g.status];
            return (
              <View key={g.id} style={[styles.grievanceCard, Shadow.sm]}>
                <View style={styles.grievanceTop}>
                  <View style={styles.grievanceIcon}>
                    <MaterialIcons name={typeCfg.icon as any} size={20} color={Colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.grievanceType}>{typeCfg.label}</Text>
                    <Text style={styles.grievanceId}>{g.id}</Text>
                  </View>
                  <Badge label={statusCfg.label} bgColor={statusCfg.color + '20'} color={statusCfg.color} size="sm" />
                </View>
                <Text style={styles.grievanceDesc} numberOfLines={2}>{g.description}</Text>
                {g.officerNotes && (
                  <View style={styles.notesBox}>
                    <Text style={styles.notesLabel}>Officer Notes:</Text>
                    <Text style={styles.notesText}>{g.officerNotes}</Text>
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  newBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: Colors.primary, borderRadius: Radius.md, padding: Spacing.md,
    color: Colors.textWhite, fontWeight: FontWeight.bold, fontSize: FontSize.sm,
    marginBottom: Spacing.md, overflow: 'hidden',
  },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginBottom: Spacing.sm },
  empty: { alignItems: 'center', padding: Spacing.xl, gap: Spacing.sm },
  emptyText: { fontSize: FontSize.md, color: Colors.textSecondary },
  grievanceCard: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.md,
    gap: Spacing.sm, marginBottom: Spacing.sm,
  },
  grievanceTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  grievanceIcon: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.primary + '15',
    alignItems: 'center', justifyContent: 'center',
  },
  grievanceType: { fontSize: FontSize.sm, fontWeight: FontWeight.semiBold, color: Colors.textPrimary },
  grievanceId: { fontSize: FontSize.xs, color: Colors.textMuted },
  grievanceDesc: { fontSize: FontSize.sm, color: Colors.textSecondary },
  notesBox: { backgroundColor: Colors.surfaceTint, borderRadius: Radius.sm, padding: Spacing.sm },
  notesLabel: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  notesText: { fontSize: FontSize.sm, color: Colors.textSecondary },
});
