import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { ColorPalette, spacing } from '../constants/theme';
import { useThemedColors } from '../store';

interface Props {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: React.ReactNode;
}

const makeStyles = (c: ColorPalette) =>
  StyleSheet.create({
    wrap: {
      marginBottom: spacing.lg,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    back: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.surfaceVariant,
    },
    backTxt: {
      fontSize: 28,
      color: c.text,
      lineHeight: 28,
      marginTop: -2,
    },
    title: {
      fontSize: 24,
      fontWeight: '800',
      color: c.text,
    },
    subtitle: {
      fontSize: 14,
      color: c.textSecondary,
      marginTop: 2,
    },
  });

export const Header: React.FC<Props> = ({ title, subtitle, onBack, right }) => {
  const c = useThemedColors();
  const styles = useMemo(() => makeStyles(c), [c]);
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        {onBack && (
          <Pressable onPress={onBack} hitSlop={10} style={styles.back}>
            <Text style={styles.backTxt}>‹</Text>
          </Pressable>
        )}
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        {right}
      </View>
    </View>
  );
};
