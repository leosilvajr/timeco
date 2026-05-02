import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors, spacing, radius } from '../../../constants/theme';
import { useThemedColors } from '../../../store';
import { ProfileCompletion } from '../../../hooks/useProfileCompletion';

interface Props {
  completion: ProfileCompletion;
  onPress: () => void;
}

/**
 * Banner persistente da Home enquanto o cadastro do user não está 100%.
 * Prioriza campos críticos (afetam sorteio) na mensagem.
 */
export const ProfileCompletionBanner: React.FC<Props> = ({ completion, onPress }) => {
  useThemedColors();

  const styles = StyleSheet.create({
    wrap: {
      padding: spacing.md,
      borderRadius: radius.md,
      backgroundColor: colors.surfaceVariant,
      borderWidth: 1,
      borderColor: colors.warning,
      marginBottom: spacing.md,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    emoji: { fontSize: 26 },
    title: { fontSize: 14, fontWeight: '800', color: colors.text },
    sub: { fontSize: 12, color: colors.textSecondary, marginTop: 2, lineHeight: 17 },
    chev: { fontSize: 22, color: colors.textMuted },
    track: {
      height: 6,
      backgroundColor: colors.border,
      borderRadius: 3,
      overflow: 'hidden',
      marginTop: spacing.sm,
    },
    fill: {
      height: '100%',
      backgroundColor: colors.primary,
      borderRadius: 3,
    },
  });

  const subText =
    completion.missingCritical.length > 0
      ? `Faltam dados pra equilibrar os times: ${completion.missingCritical.map((f) => f.label.toLowerCase()).join(', ')}`
      : `${completion.missing.length} ${completion.missing.length === 1 ? 'campo opcional' : 'campos opcionais'} restante${completion.missing.length === 1 ? '' : 's'}`;

  return (
    <Pressable style={styles.wrap} onPress={onPress}>
      <View style={styles.header}>
        <Text style={styles.emoji}>👤</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Complete seu cadastro · {completion.percent}%</Text>
          <Text style={styles.sub}>{subText}</Text>
        </View>
        <Text style={styles.chev}>›</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${completion.percent}%` }]} />
      </View>
    </Pressable>
  );
};
