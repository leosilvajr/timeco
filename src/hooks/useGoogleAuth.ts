import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { signInWithGoogleIdToken } from '../services/authService';

// Necessário para fechar o pop-up de auth corretamente no web.
WebBrowser.maybeCompleteAuthSession();

const ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;
const IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

/**
 * Constrói o redirectUri "reverso" que o Google espera pra Android Client.
 * Formato: com.googleusercontent.apps.<reversed_client_id>:/oauth2redirect
 * Sem isso, expo-auth-session pode auto-gerar URI diferente do declarado
 * no AndroidManifest e o callback nunca chega no app.
 */
const buildAndroidRedirectUri = (clientId: string | undefined): string | undefined => {
  if (!clientId || clientId === 'not-configured') return undefined;
  // O Client ID já vem no formato "<id>.apps.googleusercontent.com"
  // Reverso: "com.googleusercontent.apps.<id>"
  const reversed = clientId.replace(/\.apps\.googleusercontent\.com$/, '');
  return `com.googleusercontent.apps.${reversed}:/oauth2redirect`;
};

/**
 * Verifica se a plataforma atual tem Client ID OAuth configurado.
 * No web, sempre retorna true porque o login usa Firebase popup direto
 * (não passa por esse hook).
 */
const isPlatformConfigured = (): boolean => {
  if (Platform.OS === 'web') return true;
  if (Platform.OS === 'android') return !!ANDROID_CLIENT_ID;
  if (Platform.OS === 'ios') return !!IOS_CLIENT_ID;
  return false;
};

interface UseGoogleAuthResult {
  /** Dispara o fluxo de login (abre o seletor de contas Google) */
  promptAsync: () => Promise<void>;
  /** Indica se o pedido OAuth está pronto (depende de ter clientIds) */
  ready: boolean;
  /** Se o login Google está disponível na plataforma atual (config OK) */
  available: boolean;
}

/**
 * Hook de login Google no mobile.
 *
 * Lê os Client IDs OAuth das env vars do Expo:
 * - EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID
 * - EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID
 * - EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID
 *
 * Se algum Client ID não estiver configurado, o hook retorna
 * `available: false` e `promptAsync` dispara erro claro em vez de
 * crashar o app.
 *
 * No web, o login via popup do Firebase já funciona — esse hook
 * é principalmente pra native.
 */
export const useGoogleAuth = (): UseGoogleAuthResult => {
  const available = isPlatformConfigured();

  // O hook do expo-auth-session crasha se o ID for undefined na plataforma
  // atual. Usamos placeholders pra evitar crash no carregamento; validamos
  // de verdade no promptAsync.
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    iosClientId: IOS_CLIENT_ID || 'not-configured',
    androidClientId: ANDROID_CLIENT_ID || 'not-configured',
    webClientId: WEB_CLIENT_ID || 'not-configured',
    // Força redirectUri explícito no Android pra garantir que casa com o
    // intent-filter declarado em app.json. Sem isso, alguma versões do
    // expo-auth-session auto-geram URI diferente e o callback nunca volta.
    redirectUri:
      Platform.OS === 'android' ? buildAndroidRedirectUri(ANDROID_CLIENT_ID) : undefined,
  });

  useEffect(() => {
    if (response?.type === 'success' && response.params.id_token) {
      signInWithGoogleIdToken(response.params.id_token).catch((err) => {
        console.error('Google sign-in (mobile) failed:', err);
      });
    }
  }, [response]);

  return {
    available,
    ready: !!request && available,
    promptAsync: async () => {
      if (Platform.OS === 'web') {
        // No web usamos signInWithGoogle() (popup Firebase) direto.
        return;
      }
      if (!available) {
        throw new Error(
          'Login Google não está configurado pra esta plataforma. Use email e senha por enquanto.',
        );
      }
      await promptAsync();
    },
  };
};
