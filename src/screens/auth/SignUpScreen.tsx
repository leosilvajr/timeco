import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Screen, Input, Button, Header, GoogleSignInButton, DateInput } from '../../components';
import { maskDecimal, parseDecimal } from '../../utils/masks';
import { signUp, signInWithGoogle } from '../../services/authService';
import { colors, spacing } from '../../constants/theme';
import { useThemedColors } from '../../store';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'SignUp'>;

export const SignUpScreen: React.FC = () => {
  useThemedColors();
  const nav = useNavigation<Nav>();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [height, setHeight] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onGoogle = async () => {
    setError(null);
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erro ao criar conta com Google';
      if (!msg.includes('popup-closed-by-user') && !msg.includes('cancelled')) {
        setError(msg);
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const onSubmit = async () => {
    setError(null);
    if (!name || !email || !password) return setError('Preencha nome, email e senha');
    if (password.length < 6) return setError('A senha deve ter ao menos 6 caracteres');
    if (password !== confirm) return setError('As senhas não conferem');

    setLoading(true);
    try {
      await signUp({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        birthDate: birthDate.trim() || undefined,
        heightCm: parseDecimal(height) ?? undefined,
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erro ao cadastrar';
      if (msg.includes('email-already-in-use')) setError('Este email já está em uso');
      else setError(msg);
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
    divider: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: spacing.lg,
      gap: spacing.md,
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: colors.border,
    },
    dividerText: {
      color: colors.textMuted,
      fontSize: 13,
      fontWeight: '500',
    },
  });

  return (
    <Screen maxWidth={520}>
      <Header title="Criar conta" onBack={() => nav.goBack()} />

      <GoogleSignInButton
        onPress={onGoogle}
        loading={googleLoading}
        label="Criar conta com Google"
      />

      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>ou preencha seus dados</Text>
        <View style={styles.dividerLine} />
      </View>

      <Input label="Nome completo" value={name} onChangeText={setName} placeholder="João Silva" />
      <Input
        label="Email"
        value={email}
        onChangeText={setEmail}
        placeholder="seu@email.com"
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <Input label="Senha" value={password} onChangeText={setPassword} secureTextEntry placeholder="••••••••" />
      <Input label="Confirmar senha" value={confirm} onChangeText={setConfirm} secureTextEntry placeholder="••••••••" />
      <DateInput
        label="Data de nascimento (opcional)"
        value={birthDate}
        onChangeText={setBirthDate}
        mode="birthdate"
        hint="Usada para equilibrar times por idade em esportes que precisam"
      />
      <Input
        label="Altura em cm (opcional)"
        value={height}
        onChangeText={(v) => setHeight(maskDecimal(v))}
        keyboardType="decimal-pad"
        placeholder="Ex: 175.5"
        hint="Usada para equilibrar times por altura (vôlei, basquete...)"
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Button title="Criar conta" onPress={onSubmit} loading={loading} />
      <Pressable onPress={() => nav.goBack()} style={{ marginTop: spacing.lg, alignItems: 'center' }}>
        <Text style={{ color: colors.textSecondary }}>Já tenho conta</Text>
      </Pressable>
    </Screen>
  );
};
