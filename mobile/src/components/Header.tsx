import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../context/LanguageContext';
import { languages, Language } from '../i18n';

interface HeaderProps {
  title: string;
  showBack?: boolean;
  onBack?: () => void;
  rightAction?: React.ReactNode;
  showLanguageSelector?: boolean;
  style?: ViewStyle;
}

export const Header = ({
  title,
  showBack = false,
  onBack,
  rightAction,
  showLanguageSelector = true,
  style,
}: HeaderProps) => {
  const { language, setLanguage, t } = useLanguage();

  return (
    <View style={[styles.header, style]}>
      {showBack && (
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          accessibilityLabel={t('common.back')}
        >
          <Ionicons name="chevron-back" size={28} color="#1B4F72" />
        </TouchableOpacity>
      )}
      <View style={styles.titleContainer}>
        <Text style={styles.title}>{title}</Text>
      </View>
      <View style={styles.rightContainer}>
        {showLanguageSelector && (
          <TouchableOpacity
            style={styles.langButton}
            onPress={() => {
              const currentIndex = languages.findIndex(l => l.code === language);
              const nextIndex = (currentIndex + 1) % languages.length;
              setLanguage(languages[nextIndex].code);
            }}
            accessibilityLabel={t('common.language')}
          >
            <Text style={styles.langText}>{languages.find(l => l.code === language)?.nativeName || language}</Text>
          </TouchableOpacity>
        )}
        {rightAction}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    padding: 4,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1B4F72',
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  langButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
  },
  langText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1B4F72',
  },
});