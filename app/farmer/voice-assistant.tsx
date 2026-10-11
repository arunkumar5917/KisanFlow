import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, Radius } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';
import { useProcurement } from '../../contexts/ProcurementContext';
import { predictWaitingTime } from '../../services/aiService';
import { ScreenHeader, VoiceAssistant } from '../../components';

export default function VoiceAssistantScreen() {
  const { user } = useAuth();
  const { getBookingsByFarmer, crops } = useProcurement();
  const insets = useSafeAreaInsets();

  const myBookings = getBookingsByFarmer(user?.id || '');
  const activeBooking = myBookings.find(b => !['paid', 'rejected'].includes(b.status));
  const myCrop = activeBooking ? crops.find(c => c.id === activeBooking.cropRegistrationId) : null;

  const aiWait = activeBooking ? predictWaitingTime({
    farmersAhead: Math.max(0, activeBooking.queuePosition - 1),
    activeCounters: 3,
    avgProcessingTime: 11,
    quantityKg: myCrop?.quantity || 700,
    cropId: myCrop?.cropId || 'paddy',
    timeOfDay: new Date().getHours(),
    centreLoad: 'normal',
  }) : 0;

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <ScreenHeader title="Voice Assistant" />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: Spacing.md, paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
      >
        <VoiceAssistant
          context={{
            tokenNumber: activeBooking?.tokenNumber,
            queuePosition: activeBooking?.queuePosition,
            estimatedWait: aiWait,
            paymentStatus: 'Processing',
          }}
        />
      </ScrollView>
    </View>
  );
}
