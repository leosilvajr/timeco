import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen, Header } from '../../components';
import { colors, spacing, radius } from '../../constants/theme';
import { useThemedColors, useThemeStore, ThemeMode } from '../../store';
import type { ProfileStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<ProfileStackParamList, 'ThemeSettings'>;

const OPTIONS: { mode: ThemeMode; emoji: string; title: string; desc: string }[] = [
  {
    mode: 'system',
    emoji: '🖥️',
    title: 'Sistema',
    desc: 'Acompanha o tema do dispositivo (claro/escuro automático)',
  },
  { mode: 'light', emoji: '☀️', title: 'Claro', desc: 'Aparência clara, fundo branco/verde suave' },
  { mode: 'dark', emoji: '🌙', title: 'Escuro', desc: 'Aparência escura, melhor para ambientes pouco iluminados' },
];

export const ThemeSettingsScreen: React.FC = () => {
  useThemedColors();
  const nav = useNavigation<Nav>();
  const mode = useThemeStore((s) => s.mode);
  const setMode = useThemeStore((s) => s.setMode);

  const styles = StyleSheet.create({
    intro: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: spacing.lg,
      lineHeight: 20,
    },
    option: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      borderWidth: 2,
      borderColor: colors.border,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      marginBottom: spacing.sm,
    },
    optionSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.surfaceVariant,
    },
    optionEmoji: {
      fontSize: 32,
    },
    optionBody: {
      flex: 1,
    },
    optionTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
    },
    optionDesc: {
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: 2,
    },
    radio: {
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 2,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    radioSelected: {
      borderColor: colors.primary,
    },
    radioDot: {
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: colors.primary,
    },
  });

  return (
    <Screen maxWidth={600}>
      <Header title="Aparência" onBack={() => nav.goBack()} />
      <Text style={styles.intro}>
        Escolha como o Timeco aparece. A preferência fica salva no dispositivo e aplica
        instantaneamente.
      </Text>

      {OPTIONS.map((opt) => {
        const selected = mode === opt.mode;
        return (
          <Pressable
            key={opt.mode}
            onPress={() => setMode(opt.mode)}
            style={[styles.option, selected && styles.optionSelected]}
          >
            <Text style={styles.optionEmoji}>{opt.emoji}</Text>
            <View style={styles.optionBody}>
              <Text style={styles.optionTitle}>{opt.title}</Text>
              <Text style={styles.optionDesc}>{opt.desc}</Text>
            </View>
            <View style={[styles.radio, selected && styles.radioSelected]}>
              {selected ? <View style={styles.radioDot} /> : null}
            </View>
          </Pressable>
        );
      })}
    </Screen>
  );
};
