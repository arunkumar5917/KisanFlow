import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, Radius, FontSize } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';
import { useProcurement } from '../../contexts/ProcurementContext';
import { CENTRES } from '../../constants/config';
import { calculateLeaveHomeTime } from '../../services/smartAlertService';
import { ScreenHeader, LeaveHomeAlertCard } from '../../components';

export default function LeaveHomeScreen() {
  const { user } = useAuth();
  const { getBookingsByFarmer, crops } = useProcurement();
  const insets = useSafeAreaInsets();

  const myBookings = getBookingsByFarmer(user?.id || '');
  const activeBooking = myBookings.find(b => !['paid', 'rejected'].includes(b.status));
  const myCrop = activeBooking ? crops.find(c => c.id === activeBooking.cropRegistrationId) : null;
  const centre = user?.centreId ? CENTRES.find(c => c.id === user.centreId) : null;

  if (!activeBooking || !myCrop) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.background }}>
        <ScreenHeader title="Smart Leave-Home Alert" />
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🏠</Text>
          <Text style={styles.emptyText}>No active booking to calculate leave time.</Text>
        </View>
      </View>
    );
  }

  const alert = calculateLeaveHomeTime(
    activeBooking.tokenNumber,
    activeBooking.queuePosition,
    activeBooking.centreId,
    myCrop.cropId,
    myCrop.quantity,
    { lat: 11.4200, lng: 77.6800 },
  );

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <ScreenHeader title="Smart Leave-Home Alert" />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: Spacing.md, paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
      >
        <LeaveHomeAlertCard alert={alert} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.sm },
  emptyIcon: { fontSize: 48 },
  emptyText: { fontSize: FontSize.md, color: Colors.textSecondary },
});
