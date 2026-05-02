import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen, Header, Card, Button } from '../../components';
import { colors, spacing, radius } from '../../constants/theme';
import { useAuthStore, useThemedColors } from '../../store';
import { updateUserProfile } from '../../services/authService';
import type { ProfileStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<ProfileStackParamList, 'PrivacySettings'>;

interface ToggleSwitchProps {
  value: boolean;
  onChange: (v: boolean) => void;
  title: string;
  hint: string;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ value, onChange, title, hint }) => {
  useThemedColors();
  const styles = StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing.sm,
      gap: spacing.md,
    },
    title: { fontSize: 15, color: colors.text, fontWeight: '700' },
    hint: { fontSize: 12, color: colors.textSecondary, marginTop: 2, lineHeight: 17 },
    track: {
      width: 48,
      height: 28,
      borderRadius: 14,
      backgroundColor: colors.border,
      padding: 3,
    },
    trackActive: { backgroundColor: colors.primary },
    handle: {
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: colors.surface,
    },
    handleActive: { transform: [{ translateX: 20 }] },
  });
  return (
    <Pressable style={styles.row} onPress={() => onChange(!value)}>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.hint}>{hint}</Text>
      </View>
      <View style={[styles.track, value && styles.trackActive]}>
        <View style={[styles.handle, value && styles.handleActive]} />
      </View>
    </Pressable>
  );
};

export const PrivacySettingsScreen: React.FC = () => {
  useThemedColors();
  const nav = useNavigation<Nav>();
  const user = useAuthStore((s) => s.user);
  const patchUser = useAuthStore((s) => s.patchUser);

  // Default: tudo público se nunca configurado
  const [isProfilePublic, setIsProfilePublic] = useState(user?.isProfilePublic !== false);
  const [isGalleryPublic, setIsGalleryPublic] = useState(user?.isGalleryPublic !== false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSave = async () => {
    if (!user) return;
    setError(null);
    setSaving(true);
    try {
      await updateUserProfile(user.id, { isProfilePublic, isGalleryPublic });
      patchUser({ isProfilePublic, isGalleryPublic });
      nav.goBack();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  const styles = StyleSheet.create({
    intro: {
      backgroundColor: colors.surfaceVariant,
      padding: spacing.md,
      borderRadius: radius.md,
      marginBottom: spacing.md,
    },
    introTxt: { fontSize: 13, color: colors.text, lineHeight: 19 },
    error: {
      color: colors.danger,
      marginVertical: spacing.md,
      textAlign: 'center',
    },
  });

  return (
    <Screen maxWidth={600}>
      <Header title="Privacidade" subtitle="Controle quem vê o que" onBack={() => nav.goBack()} />

      <View style={styles.intro}>
        <Text style={styles.introTxt}>
          🔒 Quando privado, apenas seus amigos conseguem ver os detalhes. Pessoas que ainda não
          são amigos veem só o nome e a foto de perfil.
        </Text>
      </View>

      <Card>
        <ToggleSwitch
          value={isProfilePublic}
          onChange={setIsProfilePublic}
          title="Perfil público"
          hint="Bio, esportes favoritos, idade e altura visíveis pra qualquer pessoa do app"
        />
        <ToggleSwitch
          value={isGalleryPublic}
          onChange={setIsGalleryPublic}
          title="Galeria pública"
          hint="Fotos das partidas que você participou aparecem no seu perfil"
        />
      </Card>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={{ marginTop: spacing.lg }}>
        <Button title="Salvar" onPress={onSave} loading={saving} />
      </View>
    </Screen>
  );
};
