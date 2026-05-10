import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ColorPalette } from '../constants/theme';
import { useThemedColors } from '../store';

type Variant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'primary';

interface Props {
  label: string;
  variant?: Variant;
  emoji?: string;
  size?: 'sm' | 'md';
}

const makeStyles = (c: ColorPalette, variant: Variant, small: boolean) => {
  const palette: Record<Variant, { bg: string; fg: string }> = {
    default: { bg: c.surfaceVariant, fg: c.textSecondary },
    success: { bg: c.success + '22', fg: c.success },
    warning: { bg: c.warning + '22', fg: c.warning },
    danger: { bg: c.danger + '22', fg: c.danger },
    info: { bg: c.info + '22', fg: c.info },
    primary: { bg: c.primary + '22', fg: c.primary },
  };
  return StyleSheet.create({
    wrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: palette[variant].bg,
      paddingHorizontal: small ? 8 : 10,
      paddingVertical: small ? 2 : 4,
      borderRadius: 999,
      alignSelf: 'flex-start',
    },
    txt: {
      fontSize: small ? 10 : 12,
      fontWeight: '700',
      color: palette[variant].fg,
    },
    emoji: { fontSize: small ? 11 : 13 },
  });
};

/** Badge tipo tag — usado pra status, contador, label de categoria. */
export const Badge: React.FC<Props> = ({ label, variant = 'default', emoji, size = 'md' }) => {
  const c = useThemedColors();
  const styles = useMemo(() => makeStyles(c, variant, size === 'sm'), [c, variant, size]);
  return (
    <View style={styles.wrap}>
      {emoji ? <Text style={styles.emoji}>{emoji}</Text> : null}
      <Text style={styles.txt}>{label}</Text>
    </View>
  );
};
