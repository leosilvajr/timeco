import React from 'react';
import { Text, StyleSheet, TextStyle, StyleProp } from 'react-native';
import { colors, spacing } from '../constants/theme';
import { useThemedColors } from '../store';

interface Props {
  children: React.ReactNode;
  /** Quando true, fica com tipografia menor e maiúscula (estilo "label"). */
  small?: boolean;
  style?: StyleProp<TextStyle>;
}

/**
 * Título de seção padronizado. Usar em listas/detalhes pra dar hierarquia
 * visual consistente em todas as telas.
 */
export const SectionTitle: React.FC<Props> = ({ children, small, style }) => {
  useThemedColors();
  const styles = StyleSheet.create({
    base: {
      color: colors.text,
      fontWeight: '700',
      marginBottom: spacing.sm,
    },
    normal: {
      fontSize: 15,
      fontWeight: '800',
      marginTop: spacing.lg,
    },
    small: {
      fontSize: 12,
      fontWeight: '800',
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
      marginTop: spacing.lg,
    },
  });
  return <Text style={[styles.base, small ? styles.small : styles.normal, style]}>{children}</Text>;
};
