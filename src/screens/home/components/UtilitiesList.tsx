import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from '../../../components';
import { colors, spacing, radius } from '../../../constants/theme';
import { useThemedColors } from '../../../store';

export interface UtilityItem {
  emoji: string;
  title: string;
  description: string;
  tag?: string;
  onPress?: () => void;
}

interface Props {
  items: UtilityItem[];
}

/**
 * Lista de utilitários (ex: placar eletrônico, histórico, vôlei scout).
 * Cada card tem um ícone colorido + descrição + chevron + tag opcional.
 */
export const UtilitiesList: React.FC<Props> = ({ items }) => {
  useThemedColors();
  const styles = StyleSheet.create({
    list: { gap: spacing.sm },
    card: {
      padding: spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      borderColor: colors.primaryLight,
    },
    iconBox: {
      width: 44,
      height: 44,
      borderRadius: radius.md,
      backgroundColor: colors.primary + '22',
      alignItems: 'center',
      justifyContent: 'center',
    },
    emoji: { fontSize: 24 },
    title: { fontSize: 15, fontWeight: '800', color: colors.text },
    sub: { fontSize: 12, color: colors.textSecondary, marginTop: 2, lineHeight: 17 },
    tag: {
      alignSelf: 'flex-start',
      backgroundColor: colors.primary,
      color: colors.white,
      fontSize: 9,
      fontWeight: '900',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: radius.sm,
      marginTop: 4,
      letterSpacing: 0.5,
    },
    chev: { fontSize: 22, color: colors.textMuted },
  });

  return (
    <View style={styles.list}>
      {items.map((it) => (
        <Card key={it.title} style={styles.card} onPress={it.onPress}>
          <View style={styles.iconBox}>
            <Text style={styles.emoji}>{it.emoji}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{it.title}</Text>
            <Text style={styles.sub}>{it.description}</Text>
            {it.tag ? <Text style={styles.tag}>{it.tag}</Text> : null}
          </View>
          <Text style={styles.chev}>›</Text>
        </Card>
      ))}
    </View>
  );
};
