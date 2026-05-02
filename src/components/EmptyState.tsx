import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing } from '../constants/theme';
import { useThemedColors } from '../store';

interface Props {
  emoji?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<Props> = ({ emoji, title, description, action }) => {
  useThemedColors();
  const styles = StyleSheet.create({
    wrap: {
      alignItems: 'center',
      paddingVertical: spacing.xxl,
      paddingHorizontal: spacing.lg,
    },
    emoji: {
      fontSize: 60,
      marginBottom: spacing.md,
    },
    title: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
      textAlign: 'center',
    },
    desc: {
      marginTop: 6,
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      maxWidth: 320,
    },
  });
  return (
    <View style={styles.wrap}>
      {emoji ? <Text style={styles.emoji}>{emoji}</Text> : null}
      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.desc}>{description}</Text> : null}
      {action ? <View style={{ marginTop: spacing.lg, width: '100%' }}>{action}</View> : null}
    </View>
  );
};
