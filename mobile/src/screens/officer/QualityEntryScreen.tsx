import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native';
import { useLanguage } from '../../context/LanguageContext';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Header } from '../../components/Header';
import { Ionicons } from '@expo/vector-icons';

const QUALITY_GRADES = [
  { value: 'A+', label: 'A+ (Premium)', color: '#22C55E' },
  { value: 'A', label: 'A (Standard)', color: '#16A34A' },
  { value: 'B', label: 'B (Acceptable)', color: '#F59E0B' },
  { value: 'REJECTED', label: 'Rejected', color: '#EF4444' },
];

export const QualityEntryScreen = () => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    tokenNumber: 'TK-20260117-123',
    moisturePercent: '',
    foreignMatterPercent: '',
    damagedGrainPercent: '',
    grade: 'A',
    notes: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    const moisture = parseFloat(formData.moisturePercent);
    const foreignMatter = parseFloat(formData.foreignMatterPercent);
    const damaged = parseFloat(formData.damagedGrainPercent);

    if (isNaN(moisture) || isNaN(foreignMatter) || isNaN(damaged)) {
      Alert.alert(t('common.error'), 'Please enter all quality parameters');
      return;
    }

    if (moisture > 12) {
      Alert.alert('High Moisture', 'Moisture exceeds 12% limit for wheat. Grade will be adjusted.');
    }

    setLoading(true);
    try {
      // await api.recordQualityCheck(bookingId, formData);
      Alert.alert(t('common.confirm'), 'Quality check recorded successfully!');
    } catch (error) {
      Alert.alert(t('common.error'), 'Failed to record quality check');
    } finally {
      setLoading(false);
    }
  };

  const getGradeRecommendation = () => {
    const moisture = parseFloat(formData.moisturePercent) || 0;
    const foreignMatter = parseFloat(formData.foreignMatterPercent) || 0;
    
    if (moisture <= 12 && foreignMatter <= 0.75) return 'A+';
    if (moisture <= 12 && foreignMatter <= 1.0) return 'A';
    if (moisture <= 14 && foreignMatter <= 2.0) return 'B';
    return 'REJECTED';
  };

  const recommendedGrade = getGradeRecommendation();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Header title={t('officer.qualityEntry')} />
      
      <View style={styles.tokenInfo}>
        <Text style={styles.tokenLabel}>{t('farmer.tokenNumber')}</Text>
        <Text style={styles.tokenValue}>{formData.tokenNumber}</Text>
      </View>

      <View style={styles.formContainer}>
        <Text style={styles.sectionTitle}>
          <Ionicons name="analytics" size={20} color="#1B4F72" />
          Quality Parameters
        </Text>

        <Input
          label={t('officer.moisture')}
          value={formData.moisturePercent}
          onChangeText={(text) => setFormData({ ...formData, moisturePercent: text })}
          placeholder="e.g., 11.5"
          keyboardType="decimal-pad"
          style={{ marginTop: 16 }}
        />

        <Input
          label={t('officer.foreignMatter')}
          value={formData.foreignMatterPercent}
          onChangeText={(text) => setFormData({ ...formData, foreignMatterPercent: text })}
          placeholder="e.g., 0.5"
          keyboardType="decimal-pad"
          style={{ marginTop: 16 }}
        />

        <Input
          label={t('officer.damagedGrain')}
          value={formData.damagedGrainPercent}
          onChangeText={(text) => setFormData({ ...formData, damagedGrainPercent: text })}
          placeholder="e.g., 1.0"
          keyboardType="decimal-pad"
          style={{ marginTop: 16 }}
        />

        <View style={styles.gradeSection}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="medal" size={20} color="#1B4F72" />
            {t('officer.grade')}
          </Text>
          
          <View style={styles.gradeRecommendation}>
            <Text style={styles.recLabel}>Recommended: </Text>
            <View style={[
              styles.recGrade,
              { backgroundColor: QUALITY_GRADES.find(g => g.value === recommendedGrade)?.color },
            ]}>
              <Text style={styles.recGradeText}>{recommendedGrade}</Text>
            </View>
          </View>

          <View style={styles.gradeOptions}>
            {QUALITY_GRADES.map((grade) => (
              <TouchableOpacity
                key={grade.value}
                style={[
                  styles.gradeOption,
                  formData.grade === grade.value && styles.gradeOptionSelected,
                  { borderColor: grade.color },
                ]}
                onPress={() => setFormData({ ...formData, grade: grade.value })}
              >
                <View style={[
                  styles.gradeDot,
                  formData.grade === grade.value && styles.gradeDotSelected,
                  { backgroundColor: grade.color },
                ]} />
                <Text style={[
                  styles.gradeLabel,
                  formData.grade === grade.value && styles.gradeLabelSelected,
                  { color: grade.color },
                ]}>
                  {grade.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Input
          label={t('officer.notes')}
          value={formData.notes}
          onChangeText={(text) => setFormData({ ...formData, notes: text })}
          placeholder={t('officer.notes')}
          multiline
          numberOfLines={3}
          style={{ marginTop: 16 }}
        />

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
  gradeSection: {
    marginTop: 24,
  },
  gradeRecommendation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: '#F0FDF4',
    borderRadius: 10,
    marginBottom: 16,
  },
  recLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#166534',
  },
  recGrade: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
  },
  recGradeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  gradeOptions: {
    gap: 10,
  },
  gradeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderWidth: 2,
    borderRadius: 10,
  },
  gradeOptionSelected: {
    backgroundColor: '#E8F0FE',
  },
  gradeDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
  },
  gradeDotSelected: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  gradeLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  gradeLabelSelected: {
    fontWeight: '700',
  },
});