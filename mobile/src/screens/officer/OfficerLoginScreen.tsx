import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Header } from '../../components/Header';
import { api } from '../../services/api';
import { Ionicons } from '@expo/vector-icons';

const DEMO_CENTRES = [
  { id: 'centre-001', code: 'KRN001', name: 'Karnal Mandi' },
  { id: 'centre-002', code: 'PNP001', name: 'Panipat Centre' },
  { id: 'centre-003', code: 'KKR001', name: 'Kurukshetra Depot' },
  { id: 'centre-004', code: 'AMB001', name: 'Ambala Hub' },
];

export const OfficerLoginScreen = () => {
  const { t } = useLanguage();
  const { login } = useAuth();
  const [selectedCentre, setSelectedCentre] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!selectedCentre) {
      Alert.alert(t('common.error'), 'Please select a centre');
      return;
    }

    setLoading(true);
    try {
      const centre = DEMO_CENTRES.find(c => c.code === selectedCentre);
      await api.officerLogin(selectedCentre);
      login('OFFICER', undefined, centre?.id, 'officer-token');
    } catch (error) {
      Alert.alert(t('common.error'), 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Ionicons name="shield-checkmark" size={64} color="#1B4F72" />
          <Text style={styles.appName}>{t('common.appName')} - {t('officer.login')}</Text>
          <Text style={styles.tagline}>Centre Officer Portal</Text>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.sectionTitle}>{t('officer.centreSelection')}</Text>
          
          <View style={styles.centreGrid}>
            {DEMO_CENTRES.map((centre) => (
              <TouchableOpacity
                key={centre.id}
                style={[
                  styles.centreCard,
                  selectedCentre === centre.code && styles.centreCardSelected,
                ]}
                onPress={() => setSelectedCentre(centre.code)}
              >
                <Ionicons name="storefront" size={32} color="#1B4F72" />
                <Text style={[
                  styles.centreName,
                  selectedCentre === centre.code && styles.centreNameSelected,
                ]}>
                  {centre.name}
                </Text>
                <Text style={[
                  styles.centreCode,
                  selectedCentre === centre.code && styles.centreCodeSelected,
                ]}>
                  {centre.code}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Button
            title={t('auth.login')}
            onPress={handleLogin}
            loading={loading}
            fullWidth
            size="lg"
            style={{ marginTop: 24 }}
          />

          <Button
            title={t('auth.demoLogin')}
            variant="outline"
            onPress={() => {
              setSelectedCentre('KRN001');
              setTimeout(() => handleLogin(), 100);
            }}
            fullWidth
            size="lg"
            style={{ marginTop: 12 }}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  appName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1B4F72',
    marginBottom: 4,
    textAlign: 'center',
  },
  tagline: {
    fontSize: 14,
    color: '#64748B',
  },
  formContainer: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1B4F72',
    marginBottom: 20,
    textAlign: 'center',
  },
  centreGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  centreCard: {
    width: '48%',
    padding: 20,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    alignItems: 'center',
  },
  centreCardSelected: {
    borderColor: '#1B4F72',
    backgroundColor: '#E8F0FE',
  },
  centreName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginTop: 8,
  },
  centreNameSelected: {
    color: '#1B4F72',
  },
  centreCode: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  centreCodeSelected: {
    color: '#1B4F72',
    fontWeight: '600',
  },
});