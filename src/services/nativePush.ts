import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

/**
 * Push notifications nativo via Expo Push (que internamente usa FCM no
 * Android e APNs no iOS). Mantém compatibilidade com a infra existente
 * de webPush — quem chama decide qual usar baseado em Platform.OS.
 */

// Comportamento padrão quando notificação chega com app aberto
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Pede permissão e obtém o Expo push token do dispositivo.
 * No web ou em emulador, retorna null silenciosamente.
 */
export const registerForPushNotifications = async (): Promise<string | null> => {
  if (Platform.OS === 'web') return null;
  if (!Device.isDevice) {
    console.warn('Push notifications só funcionam em device físico');
    return null;
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;
  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') {
    return null;
  }

  // Configuração de canal Android (obrigatória pra que apareça com som/vibração)
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#0F9D58',
    });
  }

  try {
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
    const tokenData = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    );
    return tokenData.data;
  } catch (e) {
    console.error('Erro ao obter expo push token:', e);
    return null;
  }
};

/**
 * Salva o token push do dispositivo associado ao usuário no Firestore.
 * Documentos em users/{uid}/pushTokens/{token} permitem múltiplos
 * dispositivos por user. O backend (futuro Cloud Function) lê esses
 * tokens pra disparar notificações via Expo Push API.
 */
export const savePushTokenForUser = async (userId: string, token: string): Promise<void> => {
  const safeId = encodeURIComponent(token);
  await setDoc(doc(db, 'users', userId, 'pushTokens', safeId), {
    token,
    platform: Platform.OS,
    createdAt: serverTimestamp(),
  });
};

/** Remove um token (chamado no logout). */
export const removePushTokenForUser = async (userId: string, token: string): Promise<void> => {
  const safeId = encodeURIComponent(token);
  await deleteDoc(doc(db, 'users', userId, 'pushTokens', safeId));
};
