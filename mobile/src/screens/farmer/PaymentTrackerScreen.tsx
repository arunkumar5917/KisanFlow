import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useLanguage } from '../../context/LanguageContext';
import { Header } from '../../components/Header';
import { api } from '../../services/api';
import { Ionicons } from '@expo/vector-icons';

interface PaymentTrackerScreenProps {
  tokenNumber: string;
  onBack: () => void;
}

export const PaymentTrackerScreen = ({ tokenNumber, onBack }: PaymentTrackerScreenProps) => {
  const { t, language } = useLanguage();
  const [paymentData, setPaymentData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPayment();
  }, [tokenNumber]);

  const loadPayment = async () => {
    try {
      const bookingResponse = await api.getBookingByToken(tokenNumber);
      const bookingId = bookingResponse.data.id;
      const paymentResponse = await api.getPaymentBreakdown(bookingId);
      setPaymentData(paymentResponse.data);
    } catch (error) {
      // Mock data
      setPaymentData({
        accepted_weight_quintals: 45.0,
        msp_rate_per_quintal: 2275,
        gross_amount: 102375,
        deductions: 0,
        net_payment: 102375,
        payment_status: 'PAID',
        plain_status: {
          en: 'Paid to Bank Account',
          hi: 'बैंक खाते में जमा',
          pa: 'ਬੈਂਕ ਖਾਤੇ ਵਿੱਚ ਜਮਾ',
        },
        transaction_ref: 'TXN-20260117-ABC123DEF',
        credited_at: new Date().toISOString(),
        bank_account: 'ACC1234567890',
        ifsc_code: 'SBIN0001234',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'PAID':
        return { color: '#22C55E', icon: 'checkmark-circle', label: t('farmer.payment.paidToBank') };
      case 'PAYMENT_PROCESSING':
        return { color: '#F59E0B', icon: 'sync', label: t('farmer.payment.paymentStatus') };
      case 'PAYMENT_INITIATED':
        return { color: '#1B4F72', icon: 'card', label: t('farmer.payment.paymentStatus') };
      default:
        return { color: '#64748B', icon: 'time', label: 'Pending' };
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>{t('common.loading')}</Text>
      </View>
    );
  }

  const statusConfig = getStatusConfig(paymentData?.payment_status);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Header title={t('farmer.paymentTracker')} showBack onBack={onBack} />
      
      <View style={styles.statusCard}>
        <View style={styles.statusHeader}>
          <View style={[styles.statusBadge, { backgroundColor: statusConfig.color }]}>
            <Ionicons name={statusConfig.icon} size={24} color="#FFFFFF" />
          </View>
          <View style={styles.statusInfo}>
            <Text style={styles.statusLabel}>{t('farmer.payment.paymentStatus')}</Text>
            <Text style={styles.statusValue}>
              {paymentData?.plain_status?.[language] || paymentData?.plain_status?.en || statusConfig.label}
            </Text>
          </View>
        </View>
        
        {paymentData?.transaction_ref && (
          <View style={styles.transactionInfo}>
            <Text style={styles.transactionLabel}>{t('farmer.payment.paymentStatus')}</Text>
            <Text style={styles.transactionValue}>
              {paymentData?.transaction_ref}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.breakdownCard}>
        <Text style={styles.sectionTitle}>
          <Ionicons name="calculator" size={20} color="#1B4F72" />
          {t('farmer.payment.paymentStatus')}
        </Text>
        
        <View style={styles.breakdownRow}>
          <View style={styles.breakdownItem}>
            <Text style={styles.breakdownLabel}>{t('farmer.payment.acceptedWeight')}</Text>
            <Text style={styles.breakdownValue}>{paymentData?.accepted_weight_quintals?.toFixed(2)} quintals</Text>
          </View>
          <View style={styles.breakdownItem}>
            <Text style={styles.breakdownLabel}>{t('farmer.payment.mspRate')}</Text>
            <Text style={styles.breakdownValue}>₹{paymentData?.msp_rate_per_quintal?.toLocaleString()}/qtl</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.breakdownRow}>
          <View style={styles.breakdownItem}>
            <Text style={styles.breakdownLabel}>{t('farmer.payment.grossAmount')}</Text>
            <Text style={styles.breakdownValue}>{formatCurrency(paymentData?.gross_amount || 0)}</Text>
          </View>
          <View style={styles.breakdownItem}>
            <Text style={styles.breakdownLabel}>{t('farmer.payment.deductions')}</Text>
            <Text style={styles.breakdownValue}>{formatCurrency(paymentData?.deductions || 0)}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.netPayment}>
          <Text style={styles.netLabel}>{t('farmer.payment.netPayment')}</Text>
          <Text style={styles.netValue}>{formatCurrency(paymentData?.net_payment || 0)}</Text>
        </View>
      </View>

      {paymentData?.bank_account && (
        <View style={styles.bankCard}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="card" size={20} color="#1B4F72" />
            Bank Details
          </Text>
          <View style={styles.bankRow}>
            <Text style={styles.bankLabel}>Account</Text>
            <Text style={styles.bankValue}>
              ****{paymentData?.bank_account?.slice(-4)}
            </Text>
          </View>
          <View style={styles.bankRow}>
            <Text style={styles.bankLabel}>IFSC</Text>
            <Text style={styles.bankValue}>{paymentData?.ifsc_code}</Text>
          </View>
          {paymentData?.credited_at && (
            <View style={styles.bankRow}>
              <Text style={styles.bankLabel}>Credited On</Text>
              <Text style={styles.bankValue}>
                {new Date(paymentData?.credited_at).toLocaleDateString('en-IN', {
                  day: 'numeric', month: 'long', year: 'numeric'
                })}
              </Text>
            </View>
          )}
        </View>
      )}

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>
          <Ionicons name="information-circle" size={20} color="#1B4F72" />
          {t('farmer.payment.paymentStatus')}
        </Text>
        <Text style={styles.infoText}>
          Payment is processed directly to your registered bank account via NEFT/RTGS.
        </Text>
        <Text style={styles.infoText}>
          SMS confirmation will be sent once the amount is credited.
        </Text>
        {paymentData?.payment_status !== 'PAID' && (
          <Text style={styles.infoText}>
            Current status: {paymentData?.plain_status?.[language] || paymentData?.plain_status?.en}
          </Text>
        )}
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
  statusCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  statusBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusInfo: {
    flex: 1,
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statusValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 2,
  },
  transactionInfo: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  transactionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 4,
  },
  transactionValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1E293B',
    fontFamily: 'monospace',
  },
  breakdownCard: {
    marginHorizontal: 16,
    marginBottom: 16,
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
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  breakdownItem: {
    flex: 1,
  },
  breakdownLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748B',
    marginBottom: 4,
  },
  breakdownValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 12,
  },
  netPayment: {
    paddingTop: 8,
    paddingBottom: 8,
    backgroundColor: '#F0FDF4',
    borderRadius: 10,
    marginHorizontal: -20,
    marginTop: 4,
    paddingHorizontal: 20,
  },
  netLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#166534',
  },
  netValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#166534',
    marginTop: 4,
  },
  bankCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  bankRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  bankLabel: {
    fontSize: 14,
    color: '#64748B',
  },
  bankValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  infoCard: {
    marginHorizontal: 16,
    padding: 16,
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 13,
    color: '#92400E',
    lineHeight: 20,
    marginBottom: 4,
  },
});