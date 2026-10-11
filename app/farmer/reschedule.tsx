import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Radius, FontSize } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';
import { useProcurement } from '../../contexts/ProcurementContext';
import { findRescheduleOptions } from '../../services/rescheduleService';
import { ScreenHeader, RescheduleCard } from '../../components';

export default function RescheduleScreen() {
  const { user } = useAuth();
  const { getBookingsByFarmer, rescheduleBooking } = useProcurement();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const myBookings = getBookingsByFarmer(user?.id || '');
  const activeBooking = myBookings.find(b => !['paid', 'rejected'].includes(b.status));

  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  if (!activeBooking) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.background }}>
        <ScreenHeader title="Reschedule Slot" />
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>📅</Text>
          <Text style={styles.emptyText}>No active booking to reschedule.</Text>
        </View>
      </View>
    );
  }

  const options = findRescheduleOptions(
    activeBooking.centreId,
    activeBooking.date,
    parseInt(activeBooking.timeSlot) || 10,
  );

  const handleSelect = (option: typeof options[0]) => {
    setSelectedSlot(option.slotTime);
    Alert.alert(
      'Reschedule Booking',
      `Change from ${activeBooking.timeSlot} to ${option.slotTime}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: () => {
            rescheduleBooking(activeBooking.id, option.slotTime, activeBooking.date);
            Alert.alert('Success', 'Your slot has been rescheduled.');
            router.back();
          },
        },
      ],
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <ScreenHeader title="Reschedule Slot" />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: Spacing.md, paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
      >
        <RescheduleCard
          currentSlot={activeBooking.timeSlot}
          options={options}
          onSelect={handleSelect}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.sm },
  emptyIcon: { fontSize: 48 },
  emptyText: { fontSize: FontSize.md, color: Colors.textSecondary },
});
