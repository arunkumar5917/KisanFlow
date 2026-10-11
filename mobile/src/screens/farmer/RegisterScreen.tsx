import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Header } from '../../components/Header';
import { api } from '../../services/api';
import { CROP_OPTIONS } from '../../constants/crops';

export const RegisterScreen = () => {
  const { t } = useLanguage();
  const { farmer, setFarmer } = useAuth();
  const [formData, setFormData] = useState({
    name: farmer?.name || '',
    aadhaar: farmer?.aadhaar || '',
    district: farmer?.district || '',
    village: farmer?.village || '',
    bankAccount: farmer?.bankAccount || '',
    ifscCode: farmer?.ifscCode || '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!formData.name || !formData.aadhaar) {
      Alert.alert(t('common.error'), t('validation.required'));
      return;
    }
    
    if (formData.aadhaar.length !== 12) {
      Alert.alert(t('common.error'), t('validation.invalidAadhaar'));
      return;
    }

    setLoading(true);
    try {
      const updatedFarmer = { ...farmer, ...formData } as any;
      setFarmer(updatedFarmer);
      Alert.alert(t('common.confirm'), 'Profile saved successfully!');
    } catch (error) {
      Alert.alert(t('common.error'), 'Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Header title={t('farmer.profile')} showBack />
      
      <View style={styles.formContainer}>
        <Text style={styles.sectionTitle}>{t('farmer.profile')}</Text>
        
        <Input
          label={t('farmer.name')}
          value={formData.name}
          onChangeText={(text) => setFormData({ ...formData, name: text })}
          placeholder={t('farmer.name')}
        />

        <Input
          label={t('farmer.aadhaar')}
          value={formData.aadhaar}
          onChangeText={(text) => setFormData({ ...formData, aadhaar: text })}
          placeholder={t('farmer.aadhaar')}
          keyboardType="numeric"
          maxLength={12}
        />

        <Input
          label={t('farmer.district')}
          value={formData.district}
          onChangeText={(text) => setFormData({ ...formData, district: text })}
          placeholder={t('farmer.district')}
        />

        <Input
          label={t('farmer.village')}
          value={formData.village}
          onChangeText={(text) => setFormData({ ...formData, village: text })}
          placeholder={t('farmer.village')}
        />

        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>{t('farmer.bankAccount')}</Text>
        
        <Input
          label={t('farmer.bankAccount')}
          value={formData.bankAccount}
          onChangeText={(text) => setFormData({ ...formData, bankAccount: text })}
          placeholder={t('farmer.bankAccount')}
        />

        <Input
          label={t('farmer.ifscCode')}
          value={formData.ifscCode}
          onChangeText={(text) => setFormData({ ...formData, ifscCode: text })}
          placeholder={t('farmer.ifscCode')}
          maxLength={11}
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
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  divider: {
    marginVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
});