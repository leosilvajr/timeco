import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen, Header, Input, Button } from '../../components';
import { colors, spacing } from '../../constants/theme';
import { useAuthStore } from '../../store';
import { updateUserProfile } from '../../services/authService';
import type { ProfileStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<ProfileStackParamList, 'EditProfile'>;

export const EditProfileScreen: React.FC = () => {
  const nav = useNavigation<Nav>();
  const user = useAuthStore((s) => s.user);
  const patchUser = useAuthStore((s) => s.patchUser);

  const [name, setName] = useState(user?.name ?? '');
  const [birthDate, setBirthDate] = useState(user?.birthDate ?? '');
  const [heightCm, setHeightCm] = useState(user?.heightCm ? String(user.heightCm) : '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        phone: phone.trim() || undefined,
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

  return (
    <Screen>
      <Header title="Meus dados" onBack={() => nav.goBack()} />
      <Input label="Nome" value={name} onChangeText={setName} />
      <Input label="Data de nascimento" value={birthDate} onChangeText={setBirthDate} placeholder="AAAA-MM-DD" />
      <Input label="Altura (cm)" value={heightCm} onChangeText={setHeightCm} keyboardType="numeric" />
      <Input label="Telefone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Button title="Salvar" onPress={onSave} loading={loading} />
    </Screen>
  );
};

const styles = StyleSheet.create({
  error: {
    color: colors.danger,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
});
