import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useLanguage } from '../context/LanguageContext';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button = React.forwardRef<TouchableOpacity, ButtonProps>(
  (
    {
      title,
      onPress,
      variant = 'primary',
      size = 'md',
      disabled = false,
      loading = false,
      fullWidth = false,
      style,
      textStyle,
    },
    ref
  ) => {
    const { t } = useLanguage();

    const baseStyles = {
      primary: styles.primary,
      secondary: styles.secondary,
      outline: styles.outline,
      ghost: styles.ghost,
    };

    const sizeStyles = {
      sm: styles.sizeSm,
      md: styles.sizeMd,
      lg: styles.sizeLg,
    };

    const textSizeStyles = {
      sm: styles.textSm,
      md: styles.textMd,
      lg: styles.textLg,
    };

    const textColorStyles = {
      primary: styles.textPrimary,
      secondary: styles.textSecondary,
      outline: styles.textOutline,
      ghost: styles.textGhost,
    };

    return (
      <TouchableOpacity
        ref={ref}
        style={[
          styles.container,
          baseStyles[variant],
          sizeStyles[size],
          fullWidth && styles.fullWidth,
          disabled && styles.disabled,
          style,
        ]}
        onPress={onPress}
        disabled={disabled || loading}
        activeOpacity={0.8}
      >
        {loading ? (
          <Text style={[styles.loadingText, textSizeStyles[size], textColorStyles[variant]]}>
            {t('common.loading')}
          </Text>
        ) : (
          <Text style={[styles.text, textSizeStyles[size], textColorStyles[variant], textStyle]}>
            {title}
          </Text>
        )}
      </TouchableOpacity>
    );
  }
);

Button.displayName = 'Button';

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  primary: {
    backgroundColor: '#1B4F72',
  },
  secondary: {
    backgroundColor: '#E8F0FE',
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#1B4F72',
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  sizeSm: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  sizeMd: {
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  sizeLg: {
    paddingVertical: 18,
    paddingHorizontal: 32,
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontWeight: '600',
    fontFamily: 'System',
  },
  textPrimary: {
    color: '#FFFFFF',
  },
  textSecondary: {
    color: '#1B4F72',
  },
  textOutline: {
    color: '#1B4F72',
  },
  textGhost: {
    color: '#1B4F72',
  },
  textSm: {
    fontSize: 14,
  },
  textMd: {
    fontSize: 16,
  },
  textLg: {
    fontSize: 18,
  },
  loadingText: {
    color: '#FFFFFF',
  },
});