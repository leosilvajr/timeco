import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from '../../../components';
import { colors, spacing } from '../../../constants/theme';
import { useThemedColors } from '../../../store';
import { useResponsive } from '../../../hooks/useResponsive';

export interface FeatureCardData {
  emoji: string;
  title: string;
  desc: string;
  onPress?: () => void;
  cta?: string;
}

interface Props {
  features: FeatureCardData[];
}

/**
 * Grid de cards explicativos dos recursos do app. Adapta layout
 * (1 col em mobile, 2 col em tablet/desktop).
 */
export const FeaturesGrid: React.FC<Props> = ({ features }) => {
  useThemedColors();
  const responsive = useResponsive();
  const tabletOrUp = responsive.isTablet || responsive.isDesktop;

  const styles = StyleSheet.create({
    grid: {
      flexDirection: tabletOrUp ? 'row' : 'column',
      flexWrap: 'wrap',
      gap: spacing.sm,
      alignItems: 'flex-start',
    },
    card: {
      flexBasis: tabletOrUp ? '48%' : 'auto',
      flexGrow: tabletOrUp ? 1 : 0,
      minWidth: tabletOrUp ? 260 : undefined,
      width: tabletOrUp ? undefined : '100%',
      padding: spacing.md,
      gap: 6,
    },
    header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    emoji: { fontSize: 22 },
    title: { fontSize: 15, fontWeight: '800', color: colors.text },
    desc: { fontSize: 13, color: colors.textSecondary, lineHeight: 18 },
    cta: { marginTop: 4, fontSize: 12, fontWeight: '700', color: colors.primary },
  });

  return (
    <View style={styles.grid}>
      {features.map((f) => (
        <Card key={f.title} style={styles.card} onPress={f.onPress}>
          <View style={styles.header}>
            <Text style={styles.emoji}>{f.emoji}</Text>
            <Text style={styles.title}>{f.title}</Text>
          </View>
          <Text style={styles.desc}>{f.desc}</Text>
          {f.cta ? <Text style={styles.cta}>{f.cta} ›</Text> : null}
        </Card>
      ))}
    </View>
  );
};
