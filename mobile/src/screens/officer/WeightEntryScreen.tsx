import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native';
import { useLanguage } from '../../context/LanguageContext';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Header } from '../../components/Header';
import { Ionicons } from '@expo/vector-icons';

export const WeightEntryScreen = () => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    tokenNumber: 'TK-20260117-123',
    grossWeightKg: '',
    tareWeightKg: '',
    declaredQuantityKg: '4500',
  });
  const [loading, setLoading] = useState(false);

  const netWeightKg = useMemo(() => {
    const gross = parseFloat(formData.grossWeightKg) || 0;
    const tare = parseFloat(formData.tareWeightKg) || 0;
    return gross - tare;
  }, [formData.grossWeightKg, formData.tareWeightKg]);

  const netWeightQuintals = useMemo(() => netWeightKg / 100, [netWeightKg]);

  const varianceKg = useMemo(() => {
    const declared = parseFloat(formData.declaredQuantityKg) || 0;
    return netWeightKg - declared;
  }, [netWeightKg, formData.declaredQuantityKg]);

  const handleSubmit = async () => {
    const gross = parseFloat(formData.grossWeightKg);
    const tare = parseFloat(formData.tareWeightKg);

    if (isNaN(gross) || isNaN(tare)) {
      Alert.alert(t('common.error'), 'Please enter gross and tare weights');
      return;
    }

    if (tare >= gross) {
      Alert.alert(t('common.error'), 'Tare weight cannot exceed gross weight');
      return;
    }

    setLoading(true);
    try {
      // await api.recordWeighment(procurementId, formData);
      Alert.alert(t('common.confirm'), 'Weighment recorded successfully!');
    } catch (error) {
      Alert.alert(t('common.error'), 'Failed to record weighment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Header title={t('officer.weightEntry')} />
      
      <View style={styles.tokenInfo}>
        <Text style={styles.tokenLabel}>{t('farmer.tokenNumber')}</Text>
        <Text style={styles.tokenValue}>{formData.tokenNumber}</Text>
      </View>

      <View style={styles.formContainer}>
        <Text style={styles.sectionTitle}>
          <Ionicons name="scale" size={20} color="#1B4F72" />
          Weight Measurements
        </Text>

        <Input
          label={t('officer.grossWeight')}
          value={formData.grossWeightKg}
          onChangeText={(text) => setFormData({ ...formData, grossWeightKg: text })}
          placeholder="e.g., 5200"
          keyboardType="numeric"
          style={{ marginTop: 16 }}
        />

        <Input
          label={t('officer.tareWeight')}
          value={formData.tareWeightKg}
          onChangeText={(text) => setFormData({ ...formData, tareWeightKg: text })}
          placeholder="e.g., 700"
          keyboardType="numeric"
          style={{ marginTop: 16 }}
        />

        <Input
          label={t('officer.declaredQuantity')}
          value={formData.declaredQuantityKg}
          onChangeText={(text) => setFormData({ ...formData, declaredQuantityKg: text })}
          placeholder="e.g., 4500"
          keyboardType="numeric"
          style={{ marginTop: 16 }}
        />

        <View style={styles.resultsCard}>
          <Text style={styles.resultsTitle}>
            <Ionicons name="calculator" size={20} color="#1B4F72" />
            Calculated Results
          </Text>

          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>{t('officer.netWeight')}</Text>
            <Text style={[styles.resultValue, { color: '#1B4F72' }]}>
              {netWeightKg.toFixed(0)} kg ({netWeightQuintals.toFixed(2)} quintals)
            </Text>
          </View>

          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>{t('officer.variance')}</Text>
            <Text style={[
              styles.resultValue,
              { color: varianceKg >= 0 ? '#22C55E' : '#EF4444' },
            ]}>
              {varianceKg >= 0 ? '+' : ''}{varianceKg.toFixed(0)} kg
            </Text>
          </View>
        </View>

        <Button
          title={t('common.save')}
          onPress={handleSubmit}
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
  resultsCard: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  resultsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1B4F72',
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  resultLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
  },
  resultValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
});