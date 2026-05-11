import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import * as Crypto from 'expo-crypto';
import { signInWithAppleIdToken } from '../services/authService';

/**
 * Hook de login com Apple Sign-In (iOS only).
 *
 * Apple exige nonce pra prevenir replay attacks:
 * 1. Gera um rawNonce aleatorio (UUID)
 * 2. Calcula SHA-256 do rawNonce — esse hash vai pro Apple
 * 3. Apple devolve o identityToken (JWT) contendo o hash
 * 4. Passamos identityToken + rawNonce pro Firebase, que valida internamente
 *
 * Disponivel apenas em iOS 13+ (e simulador iOS 13.4+). Em Android e Web,
 * o hook retorna available=false e botao nao deve aparecer.
 */

interface UseAppleAuthResult {
  /** Dispara o fluxo de login (abre a sheet nativa do Apple Sign-In). */
  signIn: () => Promise<void>;
  /** Se Apple Sign-In esta disponivel na plataforma + device. */
  available: boolean;
  /** Erro durante o ultimo signIn, se houver. */
  error: string | null;
  /** Loading durante o fluxo. */
  loading: boolean;
}

export const useAppleAuth = (): UseAppleAuthResult => {
  const [available, setAvailable] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (Platform.OS !== 'ios') {
      setAvailable(false);
      return;
    }
    // Carrega o modulo dinamicamente — evita import side-effects em Android/Web
    (async () => {
      try {
        const AppleAuthentication = await import('expo-apple-authentication');
        const isAvailable = await AppleAuthentication.isAvailableAsync();
        if (!cancelled) setAvailable(isAvailable);
      } catch (e) {
        console.warn('Apple Sign-In nao disponivel:', e);
        if (!cancelled) setAvailable(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = async () => {
    if (Platform.OS !== 'ios') {
      throw new Error('Apple Sign-In so funciona em iOS.');
    }
    if (!available) {
      throw new Error('Apple Sign-In nao esta disponivel neste device.');
    }
    setError(null);
    setLoading(true);
    try {
      const AppleAuthentication = await import('expo-apple-authentication');

      // 1. Gera nonce aleatorio (rawNonce)
      const rawNonce = Crypto.randomUUID();
      // 2. SHA-256 do rawNonce — esse vai pro Apple
      const hashedNonce = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        rawNonce,
      );

      // 3. Dispara o fluxo nativo da Apple
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
        nonce: hashedNonce,
      });

      if (!credential.identityToken) {
        throw new Error('Apple nao retornou identityToken.');
      }

      // 4. Troca pelo Firebase auth credential
      await signInWithAppleIdToken(credential.identityToken, rawNonce, credential.fullName);
    } catch (e: unknown) {
      // Apple lanca ERR_REQUEST_CANCELED se user cancelar — silenciar
      const err = e as { code?: string; message?: string };
      if (err.code === 'ERR_REQUEST_CANCELED') {
        setError(null);
      } else {
        const msg = err.message || 'Falha ao entrar com Apple. Tente de novo.';
        setError(msg);
        throw e;
      }
    } finally {
      setLoading(false);
    }
  };

  return { signIn, available, error, loading };
};
