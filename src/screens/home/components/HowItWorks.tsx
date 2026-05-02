import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from '../../../components';
import { colors, spacing } from '../../../constants/theme';
import { useThemedColors } from '../../../store';

const STEPS = [
  { n: 1, title: 'Adicione amigos', desc: 'Conecte-se com pessoas que jogam com você.' },
  { n: 2, title: 'Crie um evento', desc: 'Esporte, local, horário e convidados.' },
  { n: 3, title: 'Defina estrelas', desc: 'De 1 a 5 estrelas pro nível de cada um.' },
  { n: 4, title: 'Sorteie os times', desc: 'O Timeco equilibra automaticamente.' },
  { n: 5, title: 'Bora jogar!', desc: 'Cada time recebe uma cor. Compartilhe.' },
];

/**
 * Lista compacta dos 5 passos básicos do app, dentro de um único Card.
 */
export const HowItWorks: React.FC = () => {
  useThemedColors();
  const styles = StyleSheet.create({
    list: { gap: spacing.sm },
    row: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.md,
      paddingVertical: 6,
    },
    badge: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    badgeTxt: { color: colors.white, fontWeight: '900', fontSize: 13 },
    title: { fontSize: 14, fontWeight: '700', color: colors.text },
    desc: { fontSize: 12, color: colors.textSecondary, marginTop: 2, lineHeight: 16 },
  });

  return (
    <Card>
      <View style={styles.list}>
        {STEPS.map((s) => (
          <View key={s.n} style={styles.row}>
            <View style={styles.badge}>
              <Text style={styles.badgeTxt}>{s.n}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{s.title}</Text>
              <Text style={styles.desc}>{s.desc}</Text>
            </View>
          </View>
        ))}
      </View>
    </Card>
  );
};
