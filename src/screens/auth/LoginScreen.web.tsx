import React, { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { HtmlScreen, HtmlButton, HtmlInput } from '../../components/web';
import { signIn, signInWithGoogle } from '../../services/authService';
import { formatError } from '../../utils/errorMessages';
import { isValidEmail } from '../../utils/validators';
import { useThemedColors } from '../../store';
import type { AuthStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

const TAGLINES = [
  'Bora montar seu time?',
  'Pelada no fim de semana?',
  'Vôlei, basquete, futsal — só clicar.',
  'Times equilibrados em segundos.',
];

export const LoginScreen: React.FC = () => {
  const c = useThemedColors();
  const nav = useNavigation<Nav>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tagline] = useState(() => TAGLINES[Math.floor(Math.random() * TAGLINES.length)]);

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
      await signInWithGoogle();
    } catch (e: unknown) {
      const msg = formatError(e, 'Não conseguimos fazer login com Google agora. Tente de novo.');
      if (msg) setError(msg);
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <HtmlScreen maxWidth={480}>
      {/* Hero */}
      <div style={{ textAlign: 'center', padding: '32px 0 24px' }}>
        <div
          style={{
            width: 132,
            height: 132,
            borderRadius: 66,
            background: c.surface,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `0 8px 24px ${c.primary}33`,
          }}
        >
          <img
            src="/_expo/static/media/logo.9dbee76072dcec6f1a8e0f2a44d950c1.png"
            alt="Timeco"
            style={{ width: 96, height: 72, objectFit: 'contain' }}
          />
        </div>
        <h1
          style={{
            fontSize: 44,
            fontWeight: 900,
            color: c.primary,
            letterSpacing: -1.2,
            margin: '8px 0 4px',
          }}
        >
          Timeco
        </h1>
        <p style={{ fontSize: 16, color: c.textSecondary, margin: 0, fontWeight: 500 }}>
          {tagline}
        </p>
      </div>

      {/* Form card */}
      <div
        style={{
          background: c.surface,
          borderRadius: 24,
          padding: 16,
          border: `1px solid ${c.border}`,
          marginBottom: 16,
        }}
      >
        <HtmlInput
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="seu@email.com"
          value={email}
          onChange={setEmail}
        />
        <HtmlInput
          label="Senha"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          value={password}
          onChange={setPassword}
        />

        {error ? (
          <p
            style={{
              color: c.danger,
              textAlign: 'center',
              fontWeight: 600,
              fontSize: 14,
              margin: '0 0 8px',
            }}
          >
            {error}
          </p>
        ) : null}

        <HtmlButton title="Entrar" onClick={onSubmit} loading={loading} />

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            margin: '16px 0',
            gap: 12,
          }}
        >
          <div style={{ flex: 1, height: 1, background: c.border }} />
          <span
            style={{
              color: c.textMuted,
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: 0.5,
              textTransform: 'uppercase',
            }}
          >
            ou
          </span>
          <div style={{ flex: 1, height: 1, background: c.border }} />
        </div>

        <button
          onClick={onGoogle}
          disabled={googleLoading}
          style={{
            width: '100%',
            minHeight: 50,
            borderRadius: 10,
            border: `1px solid ${c.border}`,
            background: c.surface,
            color: c.text,
            fontSize: 15,
            fontWeight: 700,
            cursor: googleLoading ? 'wait' : 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            opacity: googleLoading ? 0.6 : 1,
          }}
        >
          {googleLoading ? '...' : (
            <>
              <span style={{ fontSize: 18 }}>G</span>
              Entrar com Google
            </>
          )}
        </button>
      </div>

      <button
        onClick={() => nav.navigate('SignUp')}
        style={{
          marginTop: 16,
          padding: 12,
          background: 'transparent',
          border: 'none',
          width: '100%',
          textAlign: 'center',
          cursor: 'pointer',
          color: c.textSecondary,
          fontSize: 15,
          fontFamily: 'inherit',
        }}
      >
        É a primeira vez aqui?{' '}
        <span style={{ color: c.primary, fontWeight: 800 }}>Cria sua conta</span>
      </button>
    </HtmlScreen>
  );
};
