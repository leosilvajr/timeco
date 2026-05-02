import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen, Header, Card } from '../../components';
import { colors, spacing, radius } from '../../constants/theme';
import { useAuthStore, useThemedColors, useThemeStore } from '../../store';
import type { SettingsStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<SettingsStackParamList, 'SettingsHome'>;

interface MenuRowProps {
  icon: string;
  label: string;
  value?: string;
  onPress: () => void;
}

const MenuRow: React.FC<MenuRowProps> = ({ icon, label, value, onPress }) => {
  useThemedColors();
  const styles = StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      gap: spacing.md,
    },
    iconBox: {
      width: 40,
      height: 40,
      borderRadius: radius.md,
      backgroundColor: colors.surfaceVariant,
      alignItems: 'center',
      justifyContent: 'center',
    },
    icon: { fontSize: 20 },
    label: { fontSize: 15, color: colors.text, fontWeight: '600' },
    right: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    value: { fontSize: 13, color: colors.textMuted },
    chev: { fontSize: 22, color: colors.textMuted },
  });
  return (
    <Pressable style={styles.row} onPress={onPress}>
      <View style={styles.iconBox}>
        <Text style={styles.icon}>{icon}</Text>
      </View>
      <Text style={[styles.label, { flex: 1 }]}>{label}</Text>
      <View style={styles.right}>
        {value ? <Text style={styles.value}>{value}</Text> : null}
        <Text style={styles.chev}>›</Text>
      </View>
    </Pressable>
  );
};

export const SettingsHomeScreen: React.FC = () => {
  useThemedColors();
  const nav = useNavigation<Nav>();
  const user = useAuthStore((s) => s.user);
  const mode = useThemeStore((s) => s.mode);
  const themeLabel = mode === 'system' ? 'Sistema' : mode === 'dark' ? 'Escuro' : 'Claro';
  const privacyLabel = user?.isProfilePublic === false ? 'Privado' : 'Público';

  const styles = StyleSheet.create({
    sectionTitle: {
      fontSize: 12,
      fontWeight: '800',
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
      marginTop: spacing.lg,
      marginBottom: spacing.sm,
      marginLeft: spacing.md,
    },
    card: { padding: 0, gap: 0 },
    divider: {
      height: 1,
      backgroundColor: colors.border,
      marginHorizontal: spacing.md,
    },
  });

  return (
    <Screen maxWidth={600}>
      <Header title="Configurações" subtitle="Personalize o app do seu jeito" />

      <Text style={styles.sectionTitle}>Aparência</Text>
      <Card style={styles.card}>
        <MenuRow
          icon="🎨"
          label="Modo claro / escuro"
          value={themeLabel}
          onPress={() => nav.navigate('ThemeSettings')}
        />
      </Card>

      <Text style={styles.sectionTitle}>Privacidade</Text>
      <Card style={styles.card}>
        <MenuRow
          icon="🔒"
          label="Visibilidade do perfil"
          value={privacyLabel}
          onPress={() => nav.navigate('PrivacySettings')}
        />
      </Card>
    </Screen>
  );
};
