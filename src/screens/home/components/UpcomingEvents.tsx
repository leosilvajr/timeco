import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Card } from '../../../components';
import { colors, spacing, radius } from '../../../constants/theme';
import { useThemedColors } from '../../../store';
import { listEventsForUser } from '../../../services/eventService';
import { Event } from '../../../types';
import { getSport } from '../../../constants/sports';
import { Timestamp } from 'firebase/firestore';

interface Props {
  userId: string;
  onPressEvent: (eventId: string) => void;
  onPressViewAll: () => void;
  /** Quantos eventos mostrar (default 3) */
  limit?: number;
}

const eventDate = (e: Event): Date | null => {
  const ts = e.scheduledAt as Timestamp | Date | null;
  if (!ts) return null;
  const d = (ts as Timestamp)?.toDate?.() ?? (ts as Date);
  return d && !Number.isNaN(d.getTime()) ? d : null;
};

const isUpcoming = (e: Event): boolean => {
  if (e.status === 'finished' || e.status === 'cancelled') return false;
  const d = eventDate(e);
  if (!d) return true;
  return d.getTime() >= Date.now() - 1000 * 60 * 60 * 4; // tolerância de 4h
};

const formatRelative = (d: Date): string => {
  const diffMs = d.getTime() - Date.now();
  const diffHr = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHr / 24);
  if (diffDays > 1) return `Em ${diffDays} dias`;
  if (diffDays === 1) return 'Amanhã';
  if (diffHr > 1) return `Em ${diffHr}h`;
  if (diffHr >= 0) return 'Hoje';
  return 'Em andamento';
};

const formatDateTime = (d: Date): string =>
  d.toLocaleString('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

/**
 * Lista os próximos N eventos do usuário (organizador ou convidado).
 * Mostra um EmptyState amigável quando não há eventos futuros.
 */
export const UpcomingEvents: React.FC<Props> = ({ userId, onPressEvent, onPressViewAll, limit = 3 }) => {
  useThemedColors();
  const [events, setEvents] = useState<Event[]>([]);
  const [loaded, setLoaded] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      listEventsForUser(userId)
        .then((all) => {
          if (!alive) return;
          const upcoming = all
            .filter(isUpcoming)
            .sort((a, b) => {
              const da = eventDate(a)?.getTime() ?? Infinity;
              const db = eventDate(b)?.getTime() ?? Infinity;
              return da - db;
            })
            .slice(0, limit);
          setEvents(upcoming);
          setLoaded(true);
        })
        .catch(() => {
          if (alive) setLoaded(true);
        });
      return () => {
        alive = false;
      };
    }, [userId, limit]),
  );

  const styles = StyleSheet.create({
    list: { gap: spacing.sm },
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      padding: spacing.md,
    },
    emoji: { fontSize: 30 },
    body: { flex: 1, gap: 2 },
    title: { fontSize: 15, fontWeight: '800', color: colors.text },
    when: { fontSize: 13, color: colors.primary, fontWeight: '700' },
    meta: { fontSize: 12, color: colors.textSecondary },
    chev: { fontSize: 22, color: colors.textMuted },
    empty: {
      padding: spacing.lg,
      alignItems: 'center',
      backgroundColor: colors.surfaceVariant,
      borderRadius: radius.md,
      gap: 6,
    },
    emptyEmoji: { fontSize: 36 },
    emptyTitle: { fontSize: 14, fontWeight: '700', color: colors.text },
    emptyDesc: { fontSize: 12, color: colors.textSecondary, textAlign: 'center' },
    viewAll: { alignSelf: 'flex-end', paddingVertical: 6, paddingHorizontal: 4 },
    viewAllTxt: { fontSize: 12, fontWeight: '800', color: colors.primary },
  });

  if (!loaded) return null;

  if (events.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyEmoji}>🏟️</Text>
        <Text style={styles.emptyTitle}>Nenhum jogo marcado</Text>
        <Text style={styles.emptyDesc}>
          Crie um evento e chame a galera. É rápido!
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.list}>
      {events.map((ev) => {
        const sport = getSport(ev.sport);
        const d = eventDate(ev);
        return (
          <Card key={ev.id} style={styles.card} onPress={() => onPressEvent(ev.id)}>
            <Text style={styles.emoji}>{sport.emoji}</Text>
            <View style={styles.body}>
              <Text style={styles.title} numberOfLines={1}>
                {ev.title}
              </Text>
              <Text style={styles.when}>{d ? formatRelative(d) : 'Sem data'}</Text>
              <Text style={styles.meta} numberOfLines={1}>
                {d ? formatDateTime(d) : ''} · 📍 {ev.location}
              </Text>
            </View>
            <Text style={styles.chev}>›</Text>
          </Card>
        );
      })}
      <Pressable onPress={onPressViewAll} style={styles.viewAll}>
        <Text style={styles.viewAllTxt}>Ver todos os jogos ›</Text>
      </Pressable>
    </View>
  );
};
