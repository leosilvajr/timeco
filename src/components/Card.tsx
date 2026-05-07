import React, { useMemo } from 'react';
import { View, StyleSheet, StyleProp, ViewStyle, Pressable } from 'react-native';
import { ColorPalette, radius, spacing } from '../constants/theme';
import { useThemedColors } from '../store';

interface Props {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
}

const makeStyles = (c: ColorPalette) =>
  StyleSheet.create({
    card: {
      backgroundColor: c.surface,
      borderRadius: radius.lg,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: c.border,
      shadowColor: c.black,
      shadowOpacity: 0.04,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 2 },
      elevation: 1,
    },
  });

export const Card: React.FC<Props> = ({ children, style, onPress }) => {
  const c = useThemedColors();
  const styles = useMemo(() => makeStyles(c), [c]);
  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.card, style, pressed && { opacity: 0.85 }]}
      >
        {children}
      </Pressable>
    );
  }
  return <View style={[styles.card, style]}>{children}</View>;
};
