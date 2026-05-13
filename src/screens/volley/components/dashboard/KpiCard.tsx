import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useThemedColors } from '../../../../store';

interface Props {
  label: string;
  value: string | number;
  sub?: string;
}

/** Card pequeno de KPI no Dashboard nativo. */
export const KpiCard: React.FC<Props> = React.memo(({ label, value, sub }) => {
  const c = useThemedColors();
  const styles = StyleSheet.create({
    card: {
      flex: 1,
      minWidth: 120,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 10,
      padding: 12,
      alignItems: 'center',
    },
    label: {
      fontSize: 11,
      color: c.textSecondary,
      fontWeight: '700',
      textTransform: 'uppercase',
    },
    value: { fontSize: 22, fontWeight: '900', color: c.text, marginTop: 4 },
    sub: { fontSize: 11, color: c.textMuted, marginTop: 2 },
  });
  return (
    <View style={styles.card}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
      {sub ? <Text style={styles.sub}>{sub}</Text> : null}
    </View>
  );
});
KpiCard.displayName = 'KpiCard';
