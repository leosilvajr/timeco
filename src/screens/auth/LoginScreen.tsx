import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, Pressable } from 'react-native';
import { Screen, Input, Button } from '../../components';
import { signIn } from '../../services/authService';
import { colors, spacing } from '../../constants/theme';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

export const LoginScreen: React.FC = () => {
  const nav = useNavigation<Nav>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    setError(null);
    if (!email || !password) {
      setError('Preencha email e senha');
      return;
    }
    setLoading(true);
    try {
      await signIn(email.trim().toLowerCase(), password);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erro ao entrar';
      setError(msg.includes('invalid-credential') ? 'Email ou senha inválidos' : msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <View style={styles.logo}>
        <Text style={styles.logoEmoji}>⚽</Text>
        <Text style={styles.logoText}>Timeco</Text>
        <Text style={styles.tagline}>Monte times equilibrados em segundos</Text>
      </View>

      <Input
        label="Email"
        placeholder="seu@email.com"
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <Input
        label="Senha"
        placeholder="••••••••"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Button title="Entrar" onPress={onSubmit} loading={loading} />

      <Pressable onPress={() => nav.navigate('SignUp')} style={styles.link}>
        <Text style={styles.linkTxt}>
          Não tem conta? <Text style={styles.linkBold}>Criar conta</Text>
        </Text>
      </Pressable>
    </Screen>
  );
};

const styles = StyleSheet.create({
  logo: {
    alignItems: 'center',
    marginVertical: spacing.xxl,
  },
  logoEmoji: {
    fontSize: 72,
  },
  logoText: {
    fontSize: 42,
    fontWeight: '900',
    color: colors.primary,
    marginTop: 4,
  },
  tagline: {
    fontSize: 15,
    color: colors.textSecondary,
    marginTop: 6,
    textAlign: 'center',
  },
  error: {
    color: colors.danger,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  link: {
    marginTop: spacing.xl,
    alignItems: 'center',
  },
  linkTxt: {
    color: colors.textSecondary,
    fontSize: 15,
  },
  linkBold: {
    color: colors.primary,
    fontWeight: '700',
  },
});
