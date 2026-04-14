import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors } from '../constants/theme';

interface Props {
  value: number;
  max?: number;
  size?: number;
  editable?: boolean;
  onChange?: (value: number) => void;
}

export const StarRating: React.FC<Props> = ({ value, max = 5, size = 28, editable, onChange }) => {
  const stars: React.ReactNode[] = [];
  for (let i = 1; i <= max; i++) {
    const active = i <= Math.round(value);
    const content = (
      <Text style={[styles.star, { fontSize: size, color: active ? colors.star : colors.starEmpty }]}>
        ★
      </Text>
    );
    stars.push(
      editable && onChange ? (
        <Pressable key={i} onPress={() => onChange(i)} hitSlop={4}>
          {content}
        </Pressable>
      ) : (
        <View key={i}>{content}</View>
      )
    );
  }
  return <View style={styles.wrap}>{stars}</View>;
};

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    gap: 2,
  },
  star: {
    fontWeight: '900',
  },
});
