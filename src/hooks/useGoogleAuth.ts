import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { signInWithGoogleIdToken } from '../services/authService';

// Necessário para fechar o pop-up de auth corretamente no web.
WebBrowser.maybeCompleteAuthSession();

interface UseGoogleAuthResult {
  /** Dispara o fluxo de login (abre o seletor de contas Google) */
  promptAsync: () => Promise<void>;
  /** Indica se o pedido OAuth está pronto (depende de ter clientIds) */
  ready: boolean;
}

/**
 * Hook de login Google no mobile.
 *
 * Lê os Client IDs OAuth das env vars do Expo:
 * - EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID
 * - EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID
 * - EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID  (usado como fallback)
 *
 * Esses IDs vêm do Google Cloud Console → Credentials. Crie um OAuth
 * client ID por plataforma e cole nas env vars.
 *
 * No web, o login via popup do Firebase já funciona — não precisa
 * desse hook. Use signInWithGoogle() direto.
 */
export const useGoogleAuth = (): UseGoogleAuthResult => {
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  });

  useEffect(() => {
    if (response?.type === 'success' && response.params.id_token) {
      signInWithGoogleIdToken(response.params.id_token).catch((err) => {
        console.error('Google sign-in (mobile) failed:', err);
      });
    }
  }, [response]);

  return {
    ready: !!request,
    promptAsync: async () => {
      if (Platform.OS === 'web') {
        // No web continuamos usando o popup do Firebase (já implementado
        // em signInWithGoogle). Esse hook é principalmente pra native.
        return;
      }
      await promptAsync();
    },
  };
};
