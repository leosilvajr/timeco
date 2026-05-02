import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { colors } from '../constants/theme';
import { useThemedColors } from '../store';

interface Props {
  name?: string;
  photoURL?: string;
  size?: number;
}

const initials = (name?: string) => {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export const Avatar: React.FC<Props> = ({ name, photoURL, size = 44 }) => {
  useThemedColors();
  const styles = StyleSheet.create({
    img: {
      backgroundColor: colors.surfaceVariant,
    },
    placeholder: {
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    text: {
      color: colors.white,
      fontWeight: '800',
    },
  });
  const style = { width: size, height: size, borderRadius: size / 2 };
  if (photoURL) {
    return <Image source={{ uri: photoURL }} style={[style, styles.img]} />;
  }
  return (
    <View style={[style, styles.placeholder]}>
      <Text style={[styles.text, { fontSize: size * 0.4 }]}>{initials(name)}</Text>
    </View>
  );
};
