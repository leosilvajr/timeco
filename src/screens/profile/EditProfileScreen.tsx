import React, { useState } from 'react';
import { ScrollView, Text, StyleSheet, View, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen, Header, Input, Button, DateInput } from '../../components';
import { colors, spacing, radius } from '../../constants/theme';
import { useAuthStore, useThemedColors } from '../../store';
import { updateUserProfile } from '../../services/authService';
import { SPORTS } from '../../constants/sports';
import { SportId } from '../../types';
import type { ProfileStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<ProfileStackParamList, 'EditProfile'>;

export const EditProfileScreen: React.FC = () => {
  useThemedColors();
  const nav = useNavigation<Nav>();
  const user = useAuthStore((s) => s.user);
  const patchUser = useAuthStore((s) => s.patchUser);

  const [name, setName] = useState(user?.name ?? '');
  const [birthDate, setBirthDate] = useState(user?.birthDate ?? '');
  const [heightCm, setHeightCm] = useState(user?.heightCm ? String(user.heightCm) : '');
  const [weightKg, setWeightKg] = useState(user?.weightKg ? String(user.weightKg) : '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [bio, setBio] = useState(user?.bio ?? '');
  const [favoriteSports, setFavoriteSports] = useState<SportId[]>(user?.favoriteSports ?? []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleSport = (id: SportId) => {
    setFavoriteSports((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const onSave = async () => {
    if (!user) return;
    setError(null);
    if (!name.trim()) return setError('Nome é obrigatório');
    setLoading(true);
    try {
      const patch = {
        name: name.trim(),
        birthDate: birthDate.trim() || undefined,
        heightCm: heightCm ? parseInt(heightCm, 10) : undefined,
        weightKg: weightKg ? parseFloat(weightKg) : undefined,
        phone: phone.trim() || undefined,
        bio: bio.trim() || undefined,
        favoriteSports: favoriteSports.length ? favoriteSports : undefined,
      };
      await updateUserProfile(user.id, patch);
      patchUser(patch);
      nav.goBack();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro');
    } finally {
      setLoading(false);
    }
  };

  const styles = StyleSheet.create({
    error: {
      color: colors.danger,
      marginBottom: spacing.md,
      textAlign: 'center',
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.text,
      marginBottom: spacing.sm,
      marginTop: spacing.sm,
    },
    sportsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    sportChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: radius.pill,
      backgroundColor: colors.surface,
      borderWidth: 1.5,
      borderColor: colors.border,
    },
    sportChipSelected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    sportChipTxt: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.text,
    },
    sportChipTxtSelected: {
      color: colors.white,
    },
  });

  return (
    <Screen maxWidth={720}>
      <Header title="Meus dados" onBack={() => nav.goBack()} />
      <Input label="Nome" value={name} onChangeText={setName} />
      <DateInput
        label="Data de nascimento"
        value={birthDate}
        onChangeText={setBirthDate}
        mode="birthdate"
      />
      <Input label="Altura (cm)" value={heightCm} onChangeText={setHeightCm} keyboardType="numeric" />
      <Input
        label="Peso (kg)"
        value={weightKg}
        onChangeText={setWeightKg}
        keyboardType="numeric"
        placeholder="Ex: 72"
        hint="🔒 Privado — usado apenas no sorteio de times. Nunca aparece no seu perfil público."
      />
      <Input label="Telefone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
      <Input
        label="Sobre você (bio)"
        value={bio}
        onChangeText={setBio}
        placeholder="Ex: jogo handebol e basquete; sou ala-pivô"
        multiline
        numberOfLines={3}
        hint="Aparece no seu perfil público"
      />

      <Text style={styles.sectionTitle}>Esportes favoritos</Text>
      <View style={styles.sportsRow}>
        {SPORTS.filter((s) => s.id !== 'other').map((s) => {
          const sel = favoriteSports.includes(s.id);
          return (
            <Pressable
              key={s.id}
              onPress={() => toggleSport(s.id)}
              style={[styles.sportChip, sel && styles.sportChipSelected]}
            >
              <Text style={{ fontSize: 16 }}>{s.emoji}</Text>
              <Text style={[styles.sportChipTxt, sel && styles.sportChipTxtSelected]}>
                {s.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Button title="Salvar" onPress={onSave} loading={loading} />
    </Screen>
  );
};
