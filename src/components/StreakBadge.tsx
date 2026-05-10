import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ColorPalette } from '../constants/theme';
import { useThemedColors } from '../store';

interface Props {
  /** Numero de dias consecutivos. */
  days: number;
  /** Texto adicional opcional (default: "dias"). */
  unit?: string;
}

const makeStyles = (c: ColorPalette, hot: boolean) =>
  StyleSheet.create({
    wrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: hot ? '#FF6B35' + '22' : c.surfaceVariant,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 999,
      alignSelf: 'flex-start',
      borderWidth: 1,
      borderColor: hot ? '#FF6B35' : c.border,
    },
    emoji: { fontSize: 14 },
    txt: {
      fontSize: 12,
      fontWeight: '800',
      color: hot ? '#FF6B35' : c.textSecondary,
    },
  });

/**
 * Selo de streak (dias consecutivos). Acima de 3 dias acende fogo laranja.
 * Util pra gamificar atividade do user (ex: jogou todo dia da semana).
 */
export const StreakBadge: React.FC<Props> = ({ days, unit = 'dias' }) => {
  const c = useThemedColors();
  const hot = days >= 3;
  const styles = useMemo(() => makeStyles(c, hot), [c, hot]);
  return (
    <View style={styles.wrap}>
      <Text style={styles.emoji}>🔥</Text>
      <Text style={styles.txt}>
        {days} {unit}
      </Text>
    </View>
  );
};
