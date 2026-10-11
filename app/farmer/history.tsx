import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';
import { useProcurement } from '../../contexts/ProcurementContext';
import { CROPS } from '../../constants/config';
import { ScreenHeader, StatCard, Badge } from '../../components';
import { formatDate, formatCurrency } from '../../services/procurementService';

export default function ProcurementHistoryScreen() {
  const { user } = useAuth();
  const { getBookingsByFarmer, crops, procurements, getProcurementStats } = useProcurement();
  const insets = useSafeAreaInsets();

  const farmerId = user?.id || 'f001';
  const myBookings = getBookingsByFarmer(farmerId);
  const stats = getProcurementStats(farmerId);

  const completedBookings = myBookings.filter(b => ['accepted', 'completed', 'payment_pending', 'paid'].includes(b.status));

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <ScreenHeader title="Procurement History" />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: Spacing.md, paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats Summary */}
        <View style={styles.statsRow}>
          <StatCard label="Total Qty" value={`${stats.totalQty} kg`} icon="⚖️" accent={Colors.primary} />
          <StatCard label="Total Bills" value={stats.totalBills} icon="📄" accent={Colors.info} />
          <StatCard label="Completed" value={stats.completed} icon="✅" accent={Colors.success} />
        </View>

        {stats.pending > 0 && (
          <View style={styles.pendingBanner}>
            <MaterialIcons name="schedule" size={18} color={Colors.warning} />
            <Text style={styles.pendingText}>{stats.pending} payment(s) pending</Text>
          </View>
        )}

        {/* History List */}
        <Text style={styles.sectionTitle}>All Procurements</Text>

        {completedBookings.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📊</Text>
            <Text style={styles.emptyText}>No procurement history yet.</Text>
          </View>
        ) : (
          completedBookings.map(booking => {
            const crop = crops.find(c => c.id === booking.cropRegistrationId);
            const cropInfo = crop ? CROPS.find(c => c.id === crop.cropId) : null;
            const proc = procurements[booking.id];
            const payment = proc?.payment;

            return (
              <View key={booking.id} style={[styles.historyCard, Shadow.sm]}>
                <View style={styles.historyTop}>
                  <View style={styles.historyIcon}>
                    <Text style={{ fontSize: 24 }}>{cropInfo?.icon || '🌾'}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.historyCrop}>{cropInfo ? t(cropInfo.id) : 'Crop'}</Text>
                    <Text style={styles.historyDate}>{formatDate(booking.date)}</Text>
                  </View>
                  <Badge
                    label={booking.status.replace('_', ' ').toUpperCase()}
                    bgColor={
                      booking.status === 'paid' ? Colors.successLight :
                      booking.status === 'payment_pending' ? Colors.warningLight :
                      Colors.infoLight
                    }
                    color={
                      booking.status === 'paid' ? Colors.success :
                      booking.status === 'payment_pending' ? Colors.warning :
                      Colors.info
                    }
                    size="sm"
                  />
                </View>

                <View style={styles.historyGrid}>
                  <View style={styles.historyStat}>
                    <Text style={styles.historyStatLabel}>Quantity</Text>
                    <Text style={styles.historyStatValue}>{crop?.quantity || '—'} kg</Text>
                  </View>
                  <View style={styles.historyStat}>
                    <Text style={styles.historyStatLabel}>Net Weight</Text>
                    <Text style={styles.historyStatValue}>{proc?.weighment?.netWeight || '—'} kg</Text>
                  </View>
                  <View style={styles.historyStat}>
                    <Text style={styles.historyStatLabel}>Grade</Text>
                    <Text style={styles.historyStatValue}>{proc?.quality?.grade || '—'}</Text>
                  </View>
                  <View style={styles.historyStat}>
                    <Text style={styles.historyStatLabel}>Amount</Text>
                    <Text style={[styles.historyStatValue, { color: Colors.success }]}>
                      {payment ? formatCurrency(payment.amount) : '—'}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  statsRow: { flexDirection: 'row', marginBottom: Spacing.md },
  pendingBanner: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.warningLight, borderRadius: Radius.md, padding: Spacing.sm, marginBottom: Spacing.md,
  },
  pendingText: { fontSize: FontSize.sm, color: Colors.warning, fontWeight: FontWeight.semiBold },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginBottom: Spacing.sm },
  empty: { alignItems: 'center', padding: Spacing.xl, gap: Spacing.sm },
  emptyIcon: { fontSize: 48 },
  emptyText: { fontSize: FontSize.md, color: Colors.textSecondary },
  historyCard: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.md,
    gap: Spacing.sm, marginBottom: Spacing.sm,
  },
  historyTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  historyIcon: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.surfaceTint,
    alignItems: 'center', justifyContent: 'center',
  },
  historyCrop: { fontSize: FontSize.md, fontWeight: FontWeight.semiBold, color: Colors.textPrimary },
  historyDate: { fontSize: FontSize.xs, color: Colors.textMuted },
  historyGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  historyStat: {
    flex: 1, minWidth: '45%', backgroundColor: Colors.surfaceTint, borderRadius: Radius.sm,
    padding: Spacing.sm, alignItems: 'center',
  },
  historyStatLabel: { fontSize: FontSize.xs, color: Colors.textMuted },
  historyStatValue: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textPrimary },
});
