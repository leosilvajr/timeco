import { Platform } from 'react-native';
import { AppNotification } from '../types';

/**
 * Solicita permissão pra exibir notificações do navegador.
 * No-op em mobile e em browsers sem suporte.
 */
export const requestWebNotificationPermission = async (): Promise<NotificationPermission | null> => {
  if (Platform.OS !== 'web' || typeof window === 'undefined' || typeof Notification === 'undefined') {
    return null;
  }
  if (Notification.permission === 'granted' || Notification.permission === 'denied') {
    return Notification.permission;
  }
  try {
    return await Notification.requestPermission();
  } catch {
    return null;
  }
};

/**
 * Mostra uma notificação nativa do navegador para uma AppNotification recém-recebida.
 * Silenciosa quando não há permissão ou estamos fora da web.
 */
export const showWebNotification = (n: AppNotification): void => {
  if (Platform.OS !== 'web' || typeof window === 'undefined' || typeof Notification === 'undefined') {
    return;
  }
  if (Notification.permission !== 'granted') return;
  // Não notifica se a aba já está focada — o usuário está vendo o app em primeiro plano.
  if (typeof document !== 'undefined' && document.visibilityState === 'visible' && document.hasFocus()) {
    return;
  }
  try {
    const notif = new Notification(n.title, {
      body: n.body,
      tag: n.id,
      icon: '/favicon.png',
    });
    notif.onclick = () => {
      window.focus();
      notif.close();
    };
  } catch (err) {
    console.warn('showWebNotification', err);
  }
};
