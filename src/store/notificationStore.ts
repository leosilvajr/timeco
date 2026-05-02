import { create } from 'zustand';
import { AppNotification } from '../types';

interface NotificationState {
  notifications: AppNotification[];
  /** Conjunto de IDs já vistos pelo cliente — usado pra evitar disparar
   *  push de notificações antigas no primeiro carregamento. */
  seenIds: Set<string>;
  setNotifications: (n: AppNotification[]) => void;
  markSeen: (ids: string[]) => void;
  reset: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  seenIds: new Set<string>(),
  setNotifications: (n) => set({ notifications: n }),
  markSeen: (ids) =>
    set((s) => {
      const next = new Set(s.seenIds);
      ids.forEach((i) => next.add(i));
      return { seenIds: next };
    }),
  reset: () => set({ notifications: [], seenIds: new Set<string>() }),
}));

/** Helper hook: contagem de notificações não lidas. */
export const useUnreadCount = (): number =>
  useNotificationStore((s) => s.notifications.filter((n) => !n.read).length);
