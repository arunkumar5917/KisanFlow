import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native';
import { useLanguage } from '../../context/LanguageContext';
import { Button } from '../../components/Button';
import { Header } from '../../components/Header';
import { Ionicons } from '@expo/vector-icons';

export const ProcurementCompleteScreen = () => {
  const { t } = useLanguage();
  const [tokenNumber] = useState('TK-20260117-123');
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [receiptNumber, setReceiptNumber] = useState('');

  const handleComplete = async () => {
    setLoading(true);
    try {
      // await api.completeProcurement(bookingId);
      const receipt = `RCP-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
      setReceiptNumber(receipt);
      setCompleted(true);
      Alert.alert(t('common.confirm'), 'Procurement completed! Payment initiated.');
    } catch (error) {
      Alert.alert(t('common.error'), 'Failed to complete procurement');
    } finally {
      setLoading(false);
    }
  };

  if (completed) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Header title={t('officer.procurementComplete')} />
        
        <View style={styles.successCard}>
          <Ionicons name="checkmark-circle" size={80} color="#22C55E" />
          <Text style={styles.successTitle}>Procurement Completed!</Text>
          <Text style={styles.successSubtitle}>Receipt generated and payment initiated</Text>
          
          <View style={styles.receiptInfo}>
            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>{t('farmer.tokenNumber')}</Text>
              <Text style={styles.receiptValue}>{tokenNumber}</Text>
            </View>
            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>Receipt Number</Text>
              <Text style={styles.receiptValue}>{receiptNumber}</Text>
            </View>
            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>Date</Text>
              <Text style={styles.receiptValue}>{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</Text>
            </View>
          </View>

          <Button
            title={t('common.done')}
            onPress={() => { setCompleted(false); setReceiptNumber(''); }}
            fullWidth
            size="lg"
            style={{ marginTop: 24 }}
          />
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Header title={t('officer.procurementComplete')} />
      
      <View style={styles.tokenInfo}>
        <Text style={styles.tokenLabel}>{t('farmer.tokenNumber')}</Text>
        <Text style={styles.tokenValue}>{tokenNumber}</Text>
      </View>

      <View style={styles.formContainer}>
        <Text style={styles.sectionTitle}>
          <Ionicons name="bag-handle" size={20} color="#1B4F72" />
          Final Verification
        </Text>

        <View style={styles.verificationItem}>
          <Ionicons name="checkmark-circle" size={24} color="#22C55E" />
          <Text style={styles.verificationText}>Quality Check: <span style={{fontWeight: '600'}}>Passed (Grade A)</span></Text>
        </View>

        <View style={styles.verificationItem}>
          <Ionicons name="checkmark-circle" size={24} color="#22C55E" />
          <Text style={styles.verificationText}>Weighment: <span style={{fontWeight: '600'}}>45.00 quintals</span></Text>
        </View>

        <View style={styles.verificationItem}>
          <Ionicons name="checkmark-circle" size={24} color="#22C55E" />
          <Text style={styles.verificationText}>MSP Rate: <span style={{fontWeight: '600'}}>₹2,275/quintal</span></Text>
        </View>

        <View style={styles.verificationItem}>
          <Ionicons name="checkmark-circle" size={24} color="#22C55E" />
          <Text style={styles.verificationText}>Total Amount: <span style={{fontWeight: '600'}}>₹1,02,375</span></Text>
        </View>

        <View style={styles.warningBox}>
          <Ionicons name="alert-circle" size={20} color="#F59E0B" />
          <Text style={styles.warningText}>
            Confirm all details are correct before completing procurement. This action cannot be undone.
          </Text>
        </View>

        <Button
          title={t('officer.complete')}
          onPress={handleComplete}
          loading={loading}
          fullWidth
          size="lg"
          style={{ marginTop: 24 }}
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
  tokenInfo: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#E8F0FE',
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tokenLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1B4F72',
  },
  tokenValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1B4F72',
    fontFamily: 'monospace',
  },
  formContainer: {
    marginHorizontal: 16,
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1B4F72',
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  verificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  verificationText: {
    fontSize: 15,
    color: '#1E293B',
  },
  warningBox: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#FEF3C7',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FDE68A',
    flexDirection: 'row',
    gap: 10,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: '#92400E',
    lineHeight: 20,
  },
  successCard: {
    marginHorizontal: 16,
    padding: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1E293B',
    marginTop: 16,
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 24,
  },
  receiptInfo: {
    width: '100%',
    gap: 12,
    marginBottom: 16,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  receiptLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
  },
  receiptValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
});