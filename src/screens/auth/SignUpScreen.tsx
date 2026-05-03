import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Animated, Easing, Image, Platform } from 'react-native';
import {
  Screen,
  Input,
  Button,
  Header,
  GoogleSignInButton,
  DateInput,
  SportsBackdrop,
} from '../../components';
import { radius } from '../../constants/theme';
import { maskDecimal, parseDecimal } from '../../utils/masks';
import { signUp, signInWithGoogle } from '../../services/authService';
import { useGoogleAuth } from '../../hooks/useGoogleAuth';
import { formatError } from '../../utils/errorMessages';
import { isValidEmail, isValidBirthDate } from '../../utils/validators';
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

  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;
  const googleAuth = useGoogleAuth();

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]).start();
  }, [opacity, translateY]);

  const onGoogle = async () => {
    setError(null);
    setGoogleLoading(true);
    try {
      if (Platform.OS === 'web') {
        await signInWithGoogle();
      } else {
        await googleAuth.promptAsync();
      }
    } catch (e: unknown) {
      const msg = formatError(
        e,
        'Não conseguimos criar a conta com Google agora. Tente de novo.',
      );
      if (msg) setError(msg);
    } finally {
      setGoogleLoading(false);
    }
  };

  const onSubmit = async () => {
    setError(null);
    if (!name || !email || !password) return setError('Preencha nome, email e senha.');
    if (!isValidEmail(email))
      return setError('Email em formato inválido. Confira se digitou corretamente.');
    if (password.length < 6) return setError('A senha deve ter ao menos 6 caracteres.');
    if (password !== confirm) return setError('As senhas não conferem.');
    if (birthDate.trim() && !isValidBirthDate(birthDate.trim()))
      return setError('Data de nascimento inválida. Use o formato AAAA-MM-DD.');

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
      setError(
        formatError(e, 'Não conseguimos criar sua conta agora. Tente de novo em alguns instantes.'),
      );
    } finally {
      setLoading(false);
    }
  };

  const styles = StyleSheet.create({
    hero: {
      alignItems: 'center',
      paddingTop: spacing.md,
      paddingBottom: spacing.lg,
      gap: 8,
    },
    logoBubble: {
      width: 88,
      height: 88,
      borderRadius: 44,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: colors.primary,
      shadowOpacity: 0.2,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 6 },
      elevation: 4,
    },
    logoImage: { width: 64, height: 48, resizeMode: 'contain' },
    title: { fontSize: 28, fontWeight: '900', color: colors.text, marginTop: 8 },
    subtitle: { fontSize: 14, color: colors.textSecondary, textAlign: 'center' },
    formCard: {
      backgroundColor: colors.surface,
      borderRadius: radius.xl,
      padding: spacing.lg,
      gap: 6,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: colors.black,
      shadowOpacity: 0.06,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 4 },
      elevation: 2,
    },
    error: {
      color: colors.danger,
      marginBottom: spacing.md,
      textAlign: 'center',
      fontWeight: '600',
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
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 0.5,
      textTransform: 'uppercase',
    },
  });

  return (
    <Screen maxWidth={520}>
      <SportsBackdrop />
      <Header title="" onBack={() => nav.goBack()} />

      <Animated.View style={[styles.hero, { opacity, transform: [{ translateY }] }]}>
        <View style={styles.logoBubble}>
          <Image source={require('../../../assets/logo.png')} style={styles.logoImage} />
        </View>
        <Text style={styles.title}>Bora começar! 🏆</Text>
        <Text style={styles.subtitle}>
          Cria sua conta em 30 segundos e já chama a galera pra jogar.
        </Text>
      </Animated.View>

      <Animated.View style={[styles.formCard, { opacity }]}>
        {googleAuth.available ? (
          <>
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
          </>
        ) : null}

        <Input label="Nome completo" value={name} onChangeText={setName} placeholder="João Silva" />
        <Input
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="seu@email.com"
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <Input
          label="Senha"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="••••••••"
        />
        <Input
          label="Confirmar senha"
          value={confirm}
          onChangeText={setConfirm}
          secureTextEntry
          placeholder="••••••••"
        />
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
        <Button title="🚀  Criar conta" onPress={onSubmit} loading={loading} />
      </Animated.View>

      <Pressable
        onPress={() => nav.goBack()}
        style={{ marginTop: spacing.lg, paddingVertical: spacing.md, alignItems: 'center' }}
      >
        <Text style={{ color: colors.textSecondary }}>
          Já tem conta? <Text style={{ color: colors.primary, fontWeight: '800' }}>Entrar</Text>
        </Text>
      </Pressable>
    </Screen>
  );
};
