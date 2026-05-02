import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors, spacing } from '../constants/theme';
import { useThemedColors } from '../store';

interface Props {
  value: boolean;
  onChange: (next: boolean) => void;
  /** Texto principal (label) à esquerda do toggle. */
  title: string;
  /** Texto secundário/explicativo abaixo do título (opcional). */
  hint?: string;
  disabled?: boolean;
}

/**
 * Switch reutilizável (estilo iOS): track arredondado + handle deslizante.
 * Usado em settings, formulários de evento, privacidade, etc.
 */
export const ToggleSwitch: React.FC<Props> = ({ value, onChange, title, hint, disabled }) => {
  useThemedColors();
  const styles = StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing.sm,
      gap: spacing.md,
      opacity: disabled ? 0.5 : 1,
    },
    title: { fontSize: 15, color: colors.text, fontWeight: '700' },
    hint: { fontSize: 12, color: colors.textSecondary, marginTop: 2, lineHeight: 17 },
    track: {
      width: 48,
      height: 28,
      borderRadius: 14,
      backgroundColor: colors.border,
      padding: 3,
    },
    trackOn: { backgroundColor: colors.primary },
    handle: {
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: colors.surface,
    },
    handleOn: { transform: [{ translateX: 20 }] },
  });

  return (
    <Pressable style={styles.row} onPress={() => !disabled && onChange(!value)} disabled={disabled}>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{title}</Text>
        {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      </View>
      <View style={[styles.track, value && styles.trackOn]}>
        <View style={[styles.handle, value && styles.handleOn]} />
      </View>
    </Pressable>
  );
};
