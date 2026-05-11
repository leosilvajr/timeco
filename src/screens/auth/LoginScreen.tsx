import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Image, StyleSheet, Pressable, Animated, Easing, Platform } from 'react-native';
import {
  Screen,
  Input,
  Button,
  GoogleSignInButton,
  AppleSignInButton,
  SportsBackdrop,
} from '../../components';
import { signIn, signInWithGoogle } from '../../services/authService';
import { useGoogleAuth } from '../../hooks/useGoogleAuth';
import { useAppleAuth } from '../../hooks/useAppleAuth';
import { formatError } from '../../utils/errorMessages';
import { isValidEmail } from '../../utils/validators';
import { colors, spacing, radius } from '../../constants/theme';
import { useThemedColors } from '../../store';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

const TAGLINES = [
  'Bora montar seu time?',
  'Pelada no fim de semana?',
  'Vôlei, basquete, futsal — só clicar.',
  'Times equilibrados em segundos.',
];

const useAnimatedEntry = () => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;
  const logoScale = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 5,
        tension: 60,
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]).start();
  }, [opacity, translateY, logoScale]);

  return { opacity, translateY, logoScale };
};

export const LoginScreen: React.FC = () => {
  useThemedColors();
  const nav = useNavigation<Nav>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Tagline rotativa: muda a cada visita à tela
  const [tagline] = useState(() => TAGLINES[Math.floor(Math.random() * TAGLINES.length)]);

  const { opacity, translateY, logoScale } = useAnimatedEntry();
  const googleAuth = useGoogleAuth();
  const appleAuth = useAppleAuth();

  const onSubmit = async () => {
    setError(null);
    if (!email || !password) {
      setError('Preencha email e senha.');
      return;
    }
    if (!isValidEmail(email)) {
      setError('Email em formato inválido. Confira se digitou corretamente.');
      return;
    }
    setLoading(true);
    try {
      await signIn(email.trim().toLowerCase(), password);
    } catch (e: unknown) {
      setError(formatError(e, 'Não conseguimos entrar agora. Tente de novo em alguns instantes.'));
    } finally {
      setLoading(false);
    }
  };

  const onGoogle = async () => {
    setError(null);
    setGoogleLoading(true);
    try {
      if (Platform.OS === 'web') {
        await signInWithGoogle();
      } else {
        await googleAuth.promptAsync();
        // Sucesso é tratado dentro do hook (signInWithGoogleIdToken)
      }
    } catch (e: unknown) {
      // formatError retorna '' pra cancelamentos silenciosos (popup fechado etc)
      const msg = formatError(
        e,
        'Não conseguimos fazer login com Google agora. Tente de novo.',
      );
      if (msg) setError(msg);
    } finally {
      setGoogleLoading(false);
    }
  };

  const onApple = async () => {
    setError(null);
    try {
      await appleAuth.signIn();
      // Sucesso e tratado dentro do hook (signInWithAppleIdToken)
    } catch (e: unknown) {
      const msg = formatError(e, 'Nao conseguimos entrar com Apple agora. Tente de novo.');
      if (msg) setError(msg);
    }
  };

  const styles = StyleSheet.create({
    hero: {
      alignItems: 'center',
      paddingTop: spacing.xl,
      paddingBottom: spacing.xl,
      gap: 8,
    },
    logoBubble: {
      width: 132,
      height: 132,
      borderRadius: 66,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: colors.primary,
      shadowOpacity: 0.2,
      shadowRadius: 24,
      shadowOffset: { width: 0, height: 8 },
      elevation: 6,
    },
    logoImage: {
      width: 96,
      height: 72,
      resizeMode: 'contain',
    },
    appName: {
      fontSize: 44,
      fontWeight: '900',
      color: colors.primary,
      letterSpacing: -1.2,
      marginTop: 8,
    },
    tagline: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
      fontWeight: '500',
    },
    formCard: {
      backgroundColor: colors.surface,
      borderRadius: radius.xl,
      padding: spacing.lg,
      gap: 8,
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
      marginBottom: spacing.sm,
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
    link: {
      marginTop: spacing.xl,
      paddingVertical: spacing.md,
      alignItems: 'center',
    },
    linkTxt: {
      color: colors.textSecondary,
      fontSize: 15,
    },
    linkBold: {
      color: colors.primary,
      fontWeight: '800',
    },
  });

  return (
    <Screen maxWidth={480}>
      <SportsBackdrop />

      <Animated.View
        style={[
          styles.hero,
          { opacity, transform: [{ translateY }] },
        ]}
      >
        <Animated.View style={[styles.logoBubble, { transform: [{ scale: logoScale }] }]}>
          <Image source={require('../../../assets/logo.png')} style={styles.logoImage} />
        </Animated.View>
        <Text style={styles.appName}>Timeco</Text>
        <Text style={styles.tagline}>{tagline}</Text>
      </Animated.View>

      <Animated.View style={[styles.formCard, { opacity }]}>
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

        {googleAuth.available || appleAuth.available ? (
          <>
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>ou</Text>
              <View style={styles.dividerLine} />
            </View>

            {googleAuth.available ? (
              <GoogleSignInButton onPress={onGoogle} loading={googleLoading} />
            ) : null}

            {appleAuth.available ? (
              <View style={{ marginTop: googleAuth.available ? 8 : 0 }}>
                <AppleSignInButton onPress={onApple} label="SIGN_IN" style="BLACK" />
              </View>
            ) : null}
          </>
        ) : null}
      </Animated.View>

      <Pressable onPress={() => nav.navigate('SignUp')} style={styles.link}>
        <Text style={styles.linkTxt}>
          É a primeira vez aqui? <Text style={styles.linkBold}>Cria sua conta</Text>
        </Text>
      </Pressable>
    </Screen>
  );
};
