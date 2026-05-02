import { useNotificationStore } from './notificationStore';
import { AppNotification } from '../types';

const make = (id: string, read: boolean): AppNotification => ({
  id,
  userId: 'u1',
  type: 'chat_message',
  title: 't',
  body: 'b',
  read,
  createdAt: null,
});

describe('useNotificationStore', () => {
  beforeEach(() => {
    useNotificationStore.getState().reset();
  });

  it('estado inicial vazio', () => {
    const s = useNotificationStore.getState();
    expect(s.notifications).toEqual([]);
    expect(s.seenIds.size).toBe(0);
  });

  it('setNotifications substitui a lista', () => {
    const list = [make('a', false), make('b', true)];
    useNotificationStore.getState().setNotifications(list);
    expect(useNotificationStore.getState().notifications).toEqual(list);
  });

  it('markSeen acumula ids no Set', () => {
    useNotificationStore.getState().markSeen(['a', 'b']);
    useNotificationStore.getState().markSeen(['b', 'c']);
    const seen = useNotificationStore.getState().seenIds;
    expect(seen.has('a')).toBe(true);
    expect(seen.has('b')).toBe(true);
    expect(seen.has('c')).toBe(true);
    expect(seen.size).toBe(3);
  });

  it('reset limpa lista e seenIds', () => {
    useNotificationStore.getState().setNotifications([make('a', false)]);
    useNotificationStore.getState().markSeen(['a']);
    useNotificationStore.getState().reset();
    const s = useNotificationStore.getState();
    expect(s.notifications).toEqual([]);
    expect(s.seenIds.size).toBe(0);
  });

  it('contagem de não lidas via filter', () => {
    useNotificationStore.getState().setNotifications([
      make('a', false),
      make('b', false),
      make('c', true),
    ]);
    const unread = useNotificationStore.getState().notifications.filter((n) => !n.read).length;
    expect(unread).toBe(2);
  });
});
