import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, Radius, FontSize, FontWeight, Shadow } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';
import { useProcurement } from '../../contexts/ProcurementContext';
import { ScreenHeader, Badge } from '../../components';
import { formatDate, formatCurrency } from '../../services/procurementService';

export default function ReceiptVaultScreen() {
  const { user } = useAuth();
  const { getReceiptsByFarmer } = useProcurement();
  const insets = useSafeAreaInsets();

  const receipts = getReceiptsByFarmer(user?.id || 'f001');

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <ScreenHeader title="Digital Receipt Vault" />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: Spacing.md, paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.summaryCard}>
          <MaterialIcons name="folder-open" size={28} color={Colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.summaryTitle}>Procurement Records</Text>
            <Text style={styles.summaryText}>{receipts.length} receipts available</Text>
          </View>
        </View>

        {receipts.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📄</Text>
            <Text style={styles.emptyText}>No receipts yet.</Text>
          </View>
        ) : (
          receipts.map(receipt => (
            <View key={receipt.id} style={[styles.receiptCard, Shadow.sm]}>
              <View style={styles.receiptHeader}>
                <View>
                  <Text style={styles.receiptDate}>{formatDate(receipt.date)}</Text>
                  <Text style={styles.receiptCrop}>{receipt.cropName} · {receipt.variety}</Text>
                </View>
                <Badge
                  label={receipt.status.toUpperCase()}
                  bgColor={
                    receipt.status === 'credited' ? Colors.successLight :
                    receipt.status === 'processing' ? Colors.warningLight :
                    Colors.infoLight
                  }
                  color={
                    receipt.status === 'credited' ? Colors.success :
                    receipt.status === 'processing' ? Colors.warning :
                    Colors.info
                  }
                  size="sm"
                />
              </View>

              <View style={styles.receiptGrid}>
                <View style={styles.receiptStat}>
                  <Text style={styles.receiptStatLabel}>Weight</Text>
                  <Text style={styles.receiptStatValue}>{receipt.netWeight} kg</Text>
                </View>
                <View style={styles.receiptStat}>
                  <Text style={styles.receiptStatLabel}>Quality</Text>
                  <Text style={styles.receiptStatValue}>{receipt.qualityGrade}</Text>
                </View>
                <View style={styles.receiptStat}>
                  <Text style={styles.receiptStatLabel}>MSP Rate</Text>
                  <Text style={styles.receiptStatValue}>₹{receipt.mspRate}/q</Text>
                </View>
                <View style={styles.receiptStat}>
                  <Text style={styles.receiptStatLabel}>Amount</Text>
                  <Text style={[styles.receiptStatValue, { color: Colors.success }]}>{formatCurrency(receipt.amount)}</Text>
                </View>
              </View>

              <View style={styles.receiptFooter}>
                <Text style={styles.receiptId}>{receipt.id}</Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  summaryCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.primary + '10', borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.md,
  },
  summaryTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  summaryText: { fontSize: FontSize.sm, color: Colors.textSecondary },
  empty: { alignItems: 'center', padding: Spacing.xl, gap: Spacing.sm },
  emptyIcon: { fontSize: 48 },
  emptyText: { fontSize: FontSize.md, color: Colors.textSecondary },
  receiptCard: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.md, gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  receiptHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  receiptDate: { fontSize: FontSize.sm, fontWeight: FontWeight.semiBold, color: Colors.textPrimary },
  receiptCrop: { fontSize: FontSize.xs, color: Colors.textMuted },
  receiptGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  receiptStat: {
    flex: 1, minWidth: '45%', backgroundColor: Colors.surfaceTint, borderRadius: Radius.sm,
    padding: Spacing.sm, alignItems: 'center',
  },
  receiptStatLabel: { fontSize: FontSize.xs, color: Colors.textMuted },
  receiptStatValue: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  receiptFooter: { borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: Spacing.xs },
  receiptId: { fontSize: FontSize.xs, color: Colors.textMuted },
});
