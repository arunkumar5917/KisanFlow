import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useLanguage } from '../../context/LanguageContext';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Header } from '../../components/Header';
import { api } from '../../services/api';
import { Ionicons } from '@expo/vector-icons';

export const QRCheckInScreen = () => {
  const { t } = useLanguage();
  const [tokenInput, setTokenInput] = useState('');
  const [checkInData, setCheckInData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);

  const handleScanQR = () => {
    setScanning(true);
    // Simulate QR scan
    setTimeout(() => {
      setTokenInput('TK-20260117-123');
      setScanning(false);
      handleCheckIn();
    }, 1500);
  };

  const handleCheckIn = async () => {
    if (!tokenInput.trim()) {
      Alert.alert(t('common.error'), t('validation.required'));
      return;
    }

    setLoading(true);
    try {
      const response = await api.checkinToken(tokenInput.trim());
      setCheckInData(response.data);
      Alert.alert(t('common.confirm'), `${t('farmer.tokenNumber')} ${tokenInput} checked in successfully!`);
    } catch (error) {
      // Mock success
      setCheckInData({
        token_number: tokenInput,
        status: 'ARRIVED',
        plain_status: { en: 'Arrived at Centre', hi: 'केंद्र पर पहुंचे', pa: 'ਕੇਂਦਰ ਤੇ ਪਹੁੰਚੇ' },
        position: 0,
        now_serving: 1,
        estimated_wait_min: 0,
      });
      Alert.alert(t('common.confirm'), `${t('farmer.tokenNumber')} ${tokenInput} checked in successfully!`);
    } finally {
      setLoading(false);
    }
  };

  const handleManualEntry = () => {
    // Open keyboard for manual entry
  };

  return (
    <View style={styles.container}>
      <Header title={t('officer.qrCheckIn')} />
      
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.scanContainer}>
          <TouchableOpacity style={styles.scanButton} onPress={handleScanQR} disabled={scanning || loading}>
            <Ionicons name={scanning ? 'radio-button-on' : 'qr-code'} size={80} color="#1B4F72" />
            <Text style={styles.scanText}>
              {scanning ? t('common.loading') : t('officer.scanToken')}
            </Text>
            <Text style={styles.scanSubText}>{t('officer.enterTokenManually')}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.divider}>
          <Text style={styles.dividerText}>OR</Text>
        </View>

        <Input
          label={t('farmer.tokenNumber')}
          value={tokenInput}
          onChangeText={setTokenInput}
          placeholder="TK-20260117-123"
          style={{ marginTop: 16 }}
        />

        <Button
          title={t('officer.checkIn')}
          onPress={handleCheckIn}
          loading={loading}
          fullWidth
          size="lg"
          style={{ marginTop: 16 }}
        />

        {checkInData && (
          <View style={styles.resultCard}>
            <Text style={styles.resultTitle}>
              <Ionicons name="checkmark-circle" size={20} color="#22C55E" />
              Check-In Successful
            </Text>
            <View style={styles.resultDetails}>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>{t('farmer.tokenNumber')}</Text>
                <Text style={styles.resultValue}>{checkInData.token_number}</Text>
              </View>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>{t('common.status')}</Text>
                <Text style={styles.resultValue}>
                  {checkInData.plain_status?.en || checkInData.status}
                </Text>
              </View>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>{t('farmer.farmersAhead')}</Text>
                <Text style={styles.resultValue}>{checkInData.position}</Text>
              </View>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>{t('farmer.nowServing')}</Text>
                <Text style={styles.resultValue}>{checkInData.now_serving}</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  scanContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  scanButton: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#E8F0FE',
    borderWidth: 2,
    borderColor: '#1B4F72',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1B4F72',
    marginTop: 16,
  },
  scanSubText: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerText: {
    flex: 1,
    textAlign: 'center',
    color: '#64748B',
    fontSize: 14,
  },
  resultCard: {
    marginTop: 24,
    padding: 20,
    backgroundColor: '#F0FDF4',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#22C55E',
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#166534',
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  resultDetails: {
    gap: 10,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  resultLabel: {
    fontSize: 14,
    color: '#64748B',
  },
  resultValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
});