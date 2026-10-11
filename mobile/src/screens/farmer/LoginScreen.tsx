import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Header } from '../../components/Header';
import { api } from '../../services/api';
import { Role } from '../../types';

export const LoginScreen = () => {
  const { t } = useLanguage();
  const { login } = useAuth();
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'mobile' | 'otp'>('mobile');
  const [loading, setLoading] = useState(false);

  const formatMobile = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length > 10) return cleaned.slice(0, 10);
    return cleaned;
  };

  const handleMobileSubmit = async () => {
    if (!mobile || mobile.length !== 10) {
      Alert.alert(t('common.error'), t('validation.invalidMobile'));
      return;
    }
    
    setLoading(true);
    try {
      const formattedMobile = `+91${mobile}`;
      await api.requestOtp(formattedMobile);
      setStep('otp');
    } catch (error) {
      Alert.alert(t('common.error'), 'Failed to send OTP. Using demo mode.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async () => {
    if (!otp || otp.length !== 6) {
      Alert.alert(t('common.error'), t('validation.invalidOtp'));
      return;
    }
    
    setLoading(true);
    try {
      const formattedMobile = `+91${mobile}`;
      const response = await api.verifyOtp(formattedMobile, otp);
      const { access_token, farmer_id } = response.data;
      login(Role.FARMER, undefined, undefined, access_token);
    } catch (error) {
      if (otp === '123456') {
        login(Role.FARMER, undefined, undefined, 'demo-token');
      } else {
        Alert.alert(t('common.error'), t('validation.invalidOtp'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = () => {
    setMobile('9876543210');
    setOtp('123456');
    setStep('otp');
    setTimeout(() => handleOtpSubmit(), 100);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Text style={styles.logo}>🌾</Text>
          <Text style={styles.appName}>{t('common.appName')}</Text>
          <Text style={styles.tagline}>Smart Agricultural Procurement Platform</Text>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.stepTitle}>
            {step === 'mobile' ? t('auth.mobileNumber') : t('auth.otp')}
          </Text>

          {step === 'mobile' && (
            <Input
              label={t('auth.mobileNumber')}
              placeholder={t('auth.enterMobile')}
              value={mobile}
              onChangeText={(text) => setMobile(formatMobile(text))}
              keyboardType="phone-pad"
              maxLength={10}
            />
          )}

          {step === 'otp' && (
            <Input
              label={t('auth.otp')}
              placeholder={t('auth.enterOtp')}
              value={otp}
              onChangeText={setOtp}
              keyboardType="numeric"
              secureTextEntry
              maxLength={6}
            />
          )}

          <Button
            title={step === 'mobile' ? t('auth.verifyOtp') : t('auth.verifyOtp')}
            onPress={step === 'mobile' ? handleMobileSubmit : handleOtpSubmit}
            loading={loading}
            fullWidth
            size="lg"
          />

          {step === 'mobile' && (
            <Button
              title={t('auth.demoLogin')}
              variant="outline"
              onPress={handleDemoLogin}
              fullWidth
              size="lg"
              style={{ marginTop: 12 }}
            />
          )}

          {step === 'mobile' && (
            <TouchableOpacity onPress={() => Alert.alert('Info', 'Use demo mode for quick access')}>
              <Text style={styles.helpText}>Demo OTP: 123456</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.divider}>
          <Text style={styles.dividerText}>OR</Text>
        </View>

        <Button
          title={t('auth.loginAsOfficer')}
          variant="secondary"
          onPress={() => login(Role.OFFICER)}
          fullWidth
          size="lg"
        />
      </View>
    </KeyboardAvoidingView>
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
  logo: {
    fontSize: 64,
    marginBottom: 8,
  },
  appName: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1B4F72',
    marginBottom: 4,
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
  stepTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 20,
    textAlign: 'center',
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
  helpText: {
    textAlign: 'center',
    color: '#64748B',
    fontSize: 12,
    marginTop: 16,
  },
});