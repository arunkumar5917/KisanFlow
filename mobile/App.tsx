import React from 'react';
import { Provider } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { LanguageProvider, useLanguage } from './src/context/LanguageContext';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { QueueProvider } from './src/context/QueueContext';

import { LoginScreen } from './src/screens/farmer/LoginScreen';
import { RegisterScreen } from './src/screens/farmer/RegisterScreen';
import { ProduceDeclarationScreen } from './src/screens/farmer/ProduceDeclarationScreen';
import { CentreSelectionScreen } from './src/screens/farmer/CentreSelectionScreen';
import { SlotBookingScreen } from './src/screens/farmer/SlotBookingScreen';
import { TokenScreen } from './src/screens/farmer/TokenScreen';
import { LiveQueueScreen } from './src/screens/farmer/LiveQueueScreen';
import { ProcurementTrackerScreen } from './src/screens/farmer/ProcurementTrackerScreen';
import { PaymentTrackerScreen } from './src/screens/farmer/PaymentTrackerScreen';

import { OfficerLoginScreen } from './src/screens/officer/OfficerLoginScreen';
import { AppointmentsListScreen } from './src/screens/officer/AppointmentsListScreen';
import { QRCheckInScreen } from './src/screens/officer/QRCheckInScreen';
import { QueueManagementScreen } from './src/screens/officer/QueueManagementScreen';
import { QualityEntryScreen } from './src/screens/officer/QualityEntryScreen';
import { WeightEntryScreen } from './src/screens/officer/WeightEntryScreen';
import { ProcurementCompleteScreen } from './src/screens/officer/ProcurementCompleteScreen';

const Stack = createStackNavigator();

function FarmerStack() {
  const { t } = useLanguage();
  
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="ProduceDeclaration" component={ProduceDeclarationScreen} />
      <Stack.Screen name="CentreSelection" component={CentreSelectionScreen} />
      <Stack.Screen name="SlotBooking" component={SlotBookingScreen} />
      <Stack.Screen name="Token" component={TokenScreen} />
      <Stack.Screen name="LiveQueue" component={LiveQueueScreen} />
      <Stack.Screen name="ProcurementTracker" component={ProcurementTrackerScreen} />
      <Stack.Screen name="PaymentTracker" component={PaymentTrackerScreen} />
    </Stack.Navigator>
  );
}

function OfficerStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="OfficerLogin" component={OfficerLoginScreen} />
      <Stack.Screen name="Appointments" component={AppointmentsListScreen} />
      <Stack.Screen name="QRCheckIn" component={QRCheckInScreen} />
      <Stack.Screen name="QueueManagement" component={QueueManagementScreen} />
      <Stack.Screen name="QualityEntry" component={QualityEntryScreen} />
      <Stack.Screen name="WeightEntry" component={WeightEntryScreen} />
      <Stack.Screen name="ProcurementComplete" component={ProcurementCompleteScreen} />
    </Stack.Navigator>
  );
}

function AppContent() {
  const { role } = useAuth();

  if (role === 'FARMER') {
    return <FarmerStack />;
  } else if (role === 'OFFICER') {
    return <OfficerStack />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="OfficerLogin" component={OfficerLoginScreen} />
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <AuthProvider>
          <QueueProvider>
            <NavigationContainer>
              <AppContent />
            </NavigationContainer>
          </QueueProvider>
        </AuthProvider>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}