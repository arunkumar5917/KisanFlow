import React from 'react';
import { View, Text, StyleSheet, TextInput, ViewStyle, TextStyle } from 'react-native';
import { useLanguage } from '../context/LanguageContext';

interface InputProps {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'numeric' | 'email-address' | 'phone-pad';
  error?: string;
  style?: ViewStyle;
  inputStyle?: TextStyle;
  labelStyle?: TextStyle;
  multiline?: boolean;
  numberOfLines?: number;
}

export const Input = React.forwardRef<TextInput, InputProps>(
  (
    {
      label,
      value,
      onChangeText,
      placeholder,
      secureTextEntry = false,
      keyboardType = 'default',
      error,
      style,
      inputStyle,
      labelStyle,
      multiline = false,
      numberOfLines,
    },
    ref
  ) => {
    const { t } = useLanguage();

    return (
      <View style={[styles.container, style]}>
        {label && (
          <Text style={[styles.label, labelStyle]}>{label}</Text>
        )}
        <View style={styles.inputContainer}>
          <TextInput
            ref={ref}
            style={[styles.input, inputStyle]}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            secureTextEntry={secureTextEntry}
            keyboardType={keyboardType}
            multiline={multiline}
            numberOfLines={numberOfLines}
            textAlignVertical={multiline ? 'top' : 'center'}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
        {error && <Text style={styles.errorText}>{error}</Text>}
      </View>
    );
  }
);

Input.displayName = 'Input';

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1B4F72',
    marginBottom: 6,
  },
  inputContainer: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
  },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1E293B',
    flex: 1,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 4,
  },
});