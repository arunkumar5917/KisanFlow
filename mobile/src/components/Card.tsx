import React from 'react';
import { View, ViewStyle, StyleSheet } from 'react-native';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  elevation?: number;
  onPress?: () => void;
}

export const Card = ({ children, style, padding = 'md', elevation = 2 }: CardProps) => {
  const paddingStyles = {
    none: 0,
    sm: 12,
    md: 16,
    lg: 24,
  };

  return (
    <View
      style={[
        styles.card,
        { padding: paddingStyles[padding], elevation, shadowOpacity: elevation * 0.05 },
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
  },
});