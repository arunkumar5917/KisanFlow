import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Image, Alert, Dimensions } from 'react-native';
import { useLanguage } from '../../context/LanguageContext';
import { Button } from '../../components/Button';
import { Header } from '../../components/Header';
import { api } from '../../services/api';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface TokenScreenProps {
  tokenNumber: string;
  onBack: () => void;
}

export const TokenScreen = ({ tokenNumber, onBack }: TokenScreenProps) => {
  const { t } = useLanguage();
  const [tokenData, setTokenData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadToken();
  }, [tokenNumber]);

  const loadToken = async () => {
    try {
      const response = await api.getBookingByToken(tokenNumber);
      setTokenData(response.data);
    } catch (error) {
      // Mock data for demo
      setTokenData({
        token_number: tokenNumber,
        centre_name: 'Karnal Mandi',
        centre_address: 'Grain Market, Karnal, Haryana 132001',
        date: new Date().toISOString(),
        time_slot: '10:00-12:00',
        crop_code: 'WHEAT',
        quantity_quintals: 45,
        status: 'BOOKED',
        qr_code: `data:image/png;base64,QR_${tokenNumber}`,
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>{t('common.loading')}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Header title={t('farmer.myToken')} showBack onBack={onBack} />
      
      <View style={styles.tokenCard}>
        <View style={styles.tokenHeader}>
          <Ionicons name="ticket" size={48} color="#1B4F72" />
          <View style={styles.tokenNumberContainer}>
            <Text style={styles.tokenLabel}>{t('farmer.tokenNumber')}</Text>
            <Text style={styles.tokenNumber}>{tokenData?.token_number}</Text>
          </View>
        </View>

        <View style={styles.qrContainer}>
          <View style={styles.qrPlaceholder}>
            <Ionicons name="qr-code" size={120} color="#1B4F72" />
            <Text style={styles.qrText}>QR Code</Text>
            <Text style={styles.qrToken}>{tokenData?.token_number}</Text>
          </View>
        </View>

        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <Ionicons name="location" size={20} color="#1B4F72" />
            <View style={styles.detailText}>
              <Text style={styles.detailLabel}>{t('farmer.centreAddress')}</Text>
              <Text style={styles.detailValue}>{tokenData?.centre_name}</Text>
              <Text style={styles.detailSubValue}>{tokenData?.centre_address}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="calendar" size={20} color="#1B4F72" />
            <View style={styles.detailText}>
              <Text style={styles.detailLabel}>{t('farmer.appointedSlot')}</Text>
              <Text style={styles.detailValue}>{formatDate(tokenData?.date)}</Text>
              <Text style={styles.detailSubValue}>{tokenData?.time_slot}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="leaf" size={20} color="#1B4F72" />
            <View style={styles.detailText}>
              <Text style={styles.detailLabel}>{t('farmer.crop')}</Text>
              <Text style={styles.detailValue}>{tokenData?.crop_code} - {tokenData?.quantity_quintals} quintals</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="checkmark-circle" size={20} color="#22C55E" />
            <View style={styles.detailText}>
              <Text style={styles.detailLabel}>{t('common.status')}</Text>
              <Text style={styles.detailValue}>{tokenData?.plain_status?.en || tokenData?.status}</Text>
            </View>
          </View>
        </View>

        <View style={styles.instructions}>
          <Text style={styles.instructionTitle}>
            <Ionicons name="information-circle" size={18} color="#1B4F72" /> Important Instructions
          </Text>
          <Text style={styles.instructionText}>• Arrive 15 minutes before your appointed slot</Text>
          <Text style={styles.instructionText}>• Bring your Aadhaar card and this QR code</Text>
          <Text style={styles.instructionText}>• Ensure produce is cleaned and dried</Text>
          <Text style={styles.instructionText}>• Show this screen to the centre officer for check-in</Text>
        </View>
      </View>

      <View style={styles.bottomButtons}>
        <Button
          title={t('farmer.liveQueue')}
          variant="outline"
          onPress={() => Alert.alert('Live Queue', 'Opening live queue...')}
          fullWidth
        />
        <Button
          title={t('farmer.procurementTracker')}
          onPress={() => Alert.alert('Tracker', 'Opening procurement tracker...')}
          fullWidth
        />
      </View>
    </ScrollView>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tokenCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 6,
  },
  tokenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  tokenNumberContainer: {
    flex: 1,
  },
  tokenLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  tokenNumber: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1B4F72',
    marginTop: 4,
    fontFamily: 'monospace',
  },
  qrContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  qrPlaceholder: {
    width: 200,
    height: 200,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrText: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 12,
  },
  qrToken: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1B4F72',
    fontFamily: 'monospace',
  },
  detailsContainer: {
    gap: 16,
    marginBottom: 24,
  },
  detailRow: {
    flexDirection: 'row',
    gap: 12,
  },
  detailText: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginTop: 2,
  },
  detailSubValue: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 1,
  },
  instructions: {
    padding: 16,
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  instructionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  instructionText: {
    fontSize: 13,
    color: '#92400E',
    marginBottom: 4,
    lineHeight: 20,
  },
  bottomButtons: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    gap: 12,
  },
});