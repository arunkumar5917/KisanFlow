import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, Radius } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';
import { getNearbyCentres } from '../../services/nearbyCentreService';
import { ScreenHeader, NearbyCentreCard } from '../../components';

export default function NearbyCentresScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const farmerLocation = { lat: 11.4200, lng: 77.6800 };
  const nearby = getNearbyCentres(farmerLocation.lat, farmerLocation.lng, user?.centreId);

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <ScreenHeader title="Nearby Centres" />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: Spacing.md, paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
      >
        <NearbyCentreCard centres={nearby} />
      </ScrollView>
    </View>
  );
}
