import React, { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  HtmlScreen,
  HtmlHeader,
  HtmlButton,
  HtmlInput,
  LOGO_URL,
  GoogleG,
} from '../../components/web';
import { signUp, signInWithGoogle } from '../../services/authService';
import { formatError } from '../../utils/errorMessages';
import { isValidEmail, isValidBirthDate } from '../../utils/validators';
import { maskDecimal, parseDecimal } from '../../utils/masks';
import { useThemedColors } from '../../store';
import type { AuthStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'SignUp'>;

export const SignUpScreen: React.FC = () => {
  const c = useThemedColors();
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
      const msg = formatError(e, 'Não conseguimos criar a conta com Google agora. Tente de novo.');
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

  return (
    <HtmlScreen maxWidth={520}>
      <HtmlHeader title="" onBack={() => nav.goBack()} />

      {/* Hero */}
      <div style={{ textAlign: 'center', padding: '8px 0 16px' }}>
        <div
          style={{
            width: 88,
            height: 88,
            borderRadius: 44,
            background: c.surface,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `0 6px 16px ${c.primary}33`,
          }}
        >
          {LOGO_URL ? (
            <img
              src={LOGO_URL}
              alt="Timeco"
              style={{ width: 64, height: 48, objectFit: 'contain' }}
            />
          ) : (
            <span style={{ fontSize: 36 }}>⚽</span>
          )}
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 900, color: c.text, margin: '8px 0 4px' }}>
          Bora começar! 🏆
        </h1>
        <p style={{ fontSize: 14, color: c.textSecondary, margin: 0 }}>
          Cria sua conta em 30 segundos e já chama a galera pra jogar.
        </p>
      </div>

      <div
        style={{
          background: c.surface,
          borderRadius: 24,
          padding: 16,
          border: `1px solid ${c.border}`,
          marginBottom: 16,
        }}
      >
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
            marginBottom: 12,
            opacity: googleLoading ? 0.6 : 1,
          }}
        >
          {googleLoading ? '...' : (
            <>
              <GoogleG size={20} />
              Criar conta com Google
            </>
          )}
        </button>

        <div style={{ display: 'flex', alignItems: 'center', margin: '12px 0', gap: 12 }}>
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
            ou preencha seus dados
          </span>
          <div style={{ flex: 1, height: 1, background: c.border }} />
        </div>

        <HtmlInput
          label="Nome completo"
          value={name}
          onChange={setName}
          placeholder="João Silva"
          autoComplete="name"
        />
        <HtmlInput
          label="Email"
          type="email"
          value={email}
          onChange={setEmail}
          placeholder="seu@email.com"
          autoComplete="email"
        />
        <HtmlInput
          label="Senha"
          type="password"
          value={password}
          onChange={setPassword}
          placeholder="••••••••"
          autoComplete="new-password"
        />
        <HtmlInput
          label="Confirmar senha"
          type="password"
          value={confirm}
          onChange={setConfirm}
          placeholder="••••••••"
          autoComplete="new-password"
        />
        <HtmlInput
          label="Data de nascimento (opcional)"
          value={birthDate}
          onChange={setBirthDate}
          placeholder="AAAA-MM-DD"
        />
        <HtmlInput
          label="Altura em cm (opcional)"
          value={height}
          onChange={(v) => setHeight(maskDecimal(v))}
          placeholder="Ex: 175.5"
        />

        {error ? (
          <p
            style={{
              color: c.danger,
              textAlign: 'center',
              fontWeight: 600,
              fontSize: 14,
              margin: '0 0 12px',
            }}
          >
            {error}
          </p>
        ) : null}

        <HtmlButton title="🚀  Criar conta" onClick={onSubmit} loading={loading} />
      </div>

      <button
        onClick={() => nav.goBack()}
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
        Já tem conta?{' '}
        <span style={{ color: c.primary, fontWeight: 800 }}>Entrar</span>
      </button>
    </HtmlScreen>
  );
};
