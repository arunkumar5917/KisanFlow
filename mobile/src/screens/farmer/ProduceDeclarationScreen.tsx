import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Header } from '../../components/Header';
import { api } from '../../services/api';
import { CROP_OPTIONS } from '../../constants/crops';
import { Farm } from '../../types';

interface ProduceDeclarationScreenProps {
  onComplete: (farm: Farm) => void;
}

export const ProduceDeclarationScreen = ({ onComplete }: ProduceDeclarationScreenProps) => {
  const { t } = useLanguage();
  const { farmer } = useAuth();
  const [formData, setFormData] = useState({
    cropCode: '',
    variety: '',
    landAreaAcres: '',
    estimatedQuantityQuintals: '',
    season: 'Rabi',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!formData.cropCode || !formData.landAreaAcres || !formData.estimatedQuantityQuintals) {
      Alert.alert(t('common.error'), t('validation.required'));
      return;
    }

    setLoading(true);
    try {
      const farmData = {
        farmer_id: farmer?.id,
        land_area_acres: parseFloat(formData.landAreaAcres),
        crop_code: formData.cropCode,
        variety: formData.variety,
        estimated_quantity_quintals: parseFloat(formData.estimatedQuantityQuintals),
        season: formData.season,
      };

      const response = await api.createFarm(farmer?.id || '', farmData);
      onComplete(response.data);
    } catch (error) {
      Alert.alert(t('common.error'), 'Failed to declare produce');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Header title={t('farmer.produceDeclaration')} showBack />
      
      <View style={styles.formContainer}>
        <Text style={styles.sectionTitle}>{t('farmer.crop')}</Text>
        
        <View style={styles.cropGrid}>
          {CROP_OPTIONS.map((crop) => (
            <TouchableOpacity
              key={crop.code}
              style={[
                styles.cropCard,
                formData.cropCode === crop.code && styles.cropCardSelected,
              ]}
              onPress={() => setFormData({ ...formData, cropCode: crop.code })}
            >
              <Text style={styles.cropIcon}>{crop.icon}</Text>
              <Text style={[
                styles.cropName,
                formData.cropCode === crop.code && styles.cropNameSelected,
              ]}>
                {crop.name}
              </Text>
              <Text style={[
                styles.cropMsp,
                formData.cropCode === crop.code && styles.cropMspSelected,
              ]}>
                MSP: ₹{crop.mspPerQuintal}/qtl
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {formData.cropCode && (
          <>
            <Input
              label={t('farmer.variety')}
              value={formData.variety}
              onChangeText={(text) => setFormData({ ...formData, variety: text })}
              placeholder={t('farmer.variety')}
              style={{ marginTop: 16 }}
            />

            <Input
              label={t('farmer.landArea')}
              value={formData.landAreaAcres}
              onChangeText={(text) => setFormData({ ...formData, landAreaAcres: text })}
              placeholder={t('farmer.landArea')}
              keyboardType="numeric"
              style={{ marginTop: 16 }}
            />

            <Input
              label={t('farmer.estimatedQuantity')}
              value={formData.estimatedQuantityQuintals}
              onChangeText={(text) => setFormData({ ...formData, estimatedQuantityQuintals: text })}
              placeholder={t('farmer.estimatedQuantity')}
              keyboardType="numeric"
              style={{ marginTop: 16 }}
            />

            <View style={styles.radioGroup}>
              <Text style={styles.radioLabel}>{t('farmer.season')}</Text>
              <View style={styles.radioOptions}>
                {['Rabi', 'Kharif'].map((season) => (
                  <TouchableOpacity
                    key={season}
                    style={[
                      styles.radioOption,
                      formData.season === season && styles.radioOptionSelected,
                    ]}
                    onPress={() => setFormData({ ...formData, season })}
                  >
                    <Text style={[
                      styles.radioText,
                      formData.season === season && styles.radioTextSelected,
                    ]}>
                      {season}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <Button
              title={t('common.continue')}
              onPress={handleSubmit}
              loading={loading}
              fullWidth
              size="lg"
              style={{ marginTop: 24 }}
            />
          </>
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
  formContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
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
  },
  cropGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  cropCard: {
    width: '48%',
    padding: 16,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    alignItems: 'center',
  },
  cropCardSelected: {
    borderColor: '#1B4F72',
    backgroundColor: '#E8F0FE',
  },
  cropIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  cropName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  cropNameSelected: {
    color: '#1B4F72',
  },
  cropMsp: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  cropMspSelected: {
    color: '#1B4F72',
    fontWeight: '600',
  },
  radioGroup: {
    marginTop: 16,
  },
  radioLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1B4F72',
    marginBottom: 12,
  },
  radioOptions: {
    flexDirection: 'row',
    gap: 16,
  },
  radioOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    alignItems: 'center',
  },
  radioOptionSelected: {
    borderColor: '#1B4F72',
    backgroundColor: '#E8F0FE',
  },
  radioText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1E293B',
  },
  radioTextSelected: {
    color: '#1B4F72',
    fontWeight: '700',
  },
});