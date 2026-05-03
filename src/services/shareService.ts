import { Share, Platform } from 'react-native';

interface WebShareNavigator {
  share?: (data: { title?: string; text?: string; url?: string }) => Promise<void>;
}

/**
 * Compartilha texto cross-platform.
 * - Web: usa Web Share API quando disponível; fallback abre WhatsApp Web.
 * - Native: usa o sheet nativo de share do iOS/Android.
 *
 * Não levanta erro se o usuário cancelar — o fluxo continua tranquilo.
 */
export const shareText = async (text: string, title?: string): Promise<void> => {
  if (Platform.OS === 'web') {
    const nav =
      typeof navigator !== 'undefined' ? (navigator as WebShareNavigator) : undefined;
    if (nav?.share) {
      try {
        await nav.share({ text, title });
        return;
      } catch {
        // Cancelado ou bloqueado — cai no fallback
      }
    }
    if (typeof window !== 'undefined') {
      const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    }
    return;
  }

  try {
    await Share.share({ message: text, title });
  } catch {
    // Usuário cancelou — silencioso
  }
};
