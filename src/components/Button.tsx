import React, { useMemo } from 'react';
import { Pressable, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { ColorPalette, radius, spacing } from '../constants/theme';
import { useThemedColors } from '../store';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';

interface Props {
  title: string;
  onPress: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

const makeStyles = (c: ColorPalette, variant: Variant) => {
  const bg = {
    primary: c.primary,
    secondary: c.secondary,
    outline: 'transparent',
    ghost: 'transparent',
    danger: c.danger,
  }[variant];
  const txt = {
    primary: c.white,
    secondary: c.black,
    outline: c.primary,
    ghost: c.primary,
    danger: c.white,
  }[variant];
  const border = variant === 'outline' ? c.primary : 'transparent';
  return {
    txt,
    sheet: StyleSheet.create({
      base: {
        minHeight: 50,
        borderRadius: radius.md,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        backgroundColor: bg,
        borderWidth: variant === 'outline' ? 2 : 0,
        borderColor: border,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
      },
      text: {
        color: txt,
        fontSize: 16,
        fontWeight: '700',
      },
    }),
  };
};

export const Button: React.FC<Props> = ({
  title,
  onPress,
  variant = 'primary',
  loading,
  disabled,
  icon,
  style,
  textStyle,
  fullWidth = true,
}) => {
  const c = useThemedColors();
  const isDisabled = disabled || loading;
  const { txt, sheet: styles } = useMemo(() => makeStyles(c, variant), [c, variant]);
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        fullWidth && { alignSelf: 'stretch' },
        pressed && !isDisabled && { opacity: 0.85, transform: [{ scale: 0.98 }] },
        isDisabled && { opacity: 0.5 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={txt} />
      ) : (
        <>
          {icon}
          <Text style={[styles.text, textStyle]}>{title}</Text>
        </>
      )}
    </Pressable>
  );
};
