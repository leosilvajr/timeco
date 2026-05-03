/**
 * Cloud Functions do Timeco.
 *
 * Estratégia de push notifications:
 * - O app cliente cria documentos em /notifications/{id} via notifySafe()
 *   sempre que algo relevante acontece (convite, mensagem, evento atualizado)
 * - Esse trigger escuta criações nesse path, lê os push tokens do user
 *   destinatário e dispara push via Expo Push API
 * - Web push continua funcionando via Notification API direto no cliente
 *   (este trigger é principalmente pra Android/iOS quando o app está
 *   fechado ou em background)
 */
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions/v2';

initializeApp();

interface NotificationDoc {
  userId: string;
  type: string;
  title: string;
  body: string;
  link?: string;
  read?: boolean;
}

interface PushTokenDoc {
  token: string;
  platform: 'ios' | 'android' | 'web';
}

interface ExpoPushMessage {
  to: string;
  sound?: 'default';
  title?: string;
  body?: string;
  data?: Record<string, unknown>;
  channelId?: string;
}

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

/**
 * Trigger: notification doc criado → dispara push para todos os tokens
 * registrados do usuário destinatário.
 */
export const onNotificationCreated = onDocumentCreated(
  'notifications/{notificationId}',
  async (event) => {
    const snap = event.data;
    if (!snap) return;
    const notif = snap.data() as NotificationDoc;
    if (!notif?.userId) return;

    try {
      // 1. Busca push tokens do user (subcoleção users/{uid}/pushTokens)
      const db = getFirestore();
      const tokensSnap = await db
        .collection('users')
        .doc(notif.userId)
        .collection('pushTokens')
        .get();

      if (tokensSnap.empty) {
        logger.info(`User ${notif.userId} sem push tokens registrados (web only?)`);
        return;
      }

      // 2. Filtra só native (web push é tratado no cliente)
      const tokens: PushTokenDoc[] = tokensSnap.docs
        .map((d) => d.data() as PushTokenDoc)
        .filter((t) => t.platform !== 'web' && t.token);

      if (tokens.length === 0) {
        logger.info(`User ${notif.userId} sem tokens nativos`);
        return;
      }

      // 3. Monta mensagens Expo Push (limita 100 por request)
      const messages: ExpoPushMessage[] = tokens.map((t) => ({
        to: t.token,
        sound: 'default',
        title: notif.title,
        body: notif.body,
        data: {
          type: notif.type,
          link: notif.link ?? '',
          notificationId: event.params.notificationId,
        },
        channelId: 'default',
      }));

      // 4. POST em chunks de 100
      const chunks: ExpoPushMessage[][] = [];
      for (let i = 0; i < messages.length; i += 100) {
        chunks.push(messages.slice(i, i + 100));
      }

      for (const chunk of chunks) {
        const res = await fetch(EXPO_PUSH_URL, {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Accept-encoding': 'gzip, deflate',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(chunk),
        });

        if (!res.ok) {
          const errBody = await res.text();
          logger.error(`Expo Push falhou (${res.status}):`, errBody);
          continue;
        }
        const result = await res.json();
        logger.info(`Push enviado pra ${notif.userId}:`, result);
      }
    } catch (err) {
      logger.error('Erro disparando push:', err);
    }
  },
);
