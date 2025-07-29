import React from 'react';
import { View, StyleSheet, ViewProps, ViewStyle } from 'react-native';
import { AppColors } from '@/constants/Colors';

interface CardProps extends ViewProps {
  style?: ViewStyle | ViewStyle[];
  children: React.ReactNode;
}

const Card: React.FC<CardProps> = ({ style, children, ...props }) => {
  return (
    <View style={[styles.card, style]} {...props}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: AppColors.cardBackground || '#fff',
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 4,
  },
});

export default Card;
