import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useThemedColors } from '../../../../store';
import { ColorPalette, radius } from '../../../../constants/theme';
import { PlayerVolleyStats, VolleyAction } from '../../../../types';

export type ActionKind = 'positive' | 'negative' | 'neutral';

export interface ActionConfig {
  label: string;
  action: VolleyAction;
  kind: ActionKind;
  read: (s: PlayerVolleyStats) => number;
}

export interface CardConfig {
  title: string;
  emoji: string;
  actions: ActionConfig[];
}

interface Props {
  card: CardConfig;
  playerStats: PlayerVolleyStats;
  busy: boolean;
  isLocked: boolean;
  onAction: (action: VolleyAction, delta: 1 | -1) => void;
  /** Pra grid de 2 colunas em landscape (>=720px). */
  wide: boolean;
}

const dotColor = (kind: ActionKind, c: ColorPalette) =>
  kind === 'positive' ? c.success : kind === 'negative' ? c.danger : c.info;

const plusBg = (kind: ActionKind, c: ColorPalette): string =>
  kind === 'positive' ? c.success : kind === 'negative' ? c.danger : c.info;

/**
 * Card de uma categoria de acoes do Scout nativo (SAQUE/etc).
 * Em tela larga (>= 720px) ocupa 48% do width pra ficar lado-a-lado.
 */
export const ActionCard: React.FC<Props> = React.memo(
  ({ card, playerStats, busy, isLocked, onAction, wide }) => {
    const c = useThemedColors();
    const styles = StyleSheet.create({
      card: {
        backgroundColor: c.surface,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: c.border,
        padding: 8,
        marginBottom: wide ? 0 : 10,
        ...(wide ? { width: '48%' as const, flexGrow: 1 } : {}),
      },
      title: {
        fontSize: 11,
        fontWeight: '800',
        color: c.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        marginBottom: 6,
        textAlign: 'center',
      },
      row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 2,
        paddingHorizontal: 10,
        borderRadius: 8,
        marginBottom: 2,
      },
      dot: { width: 8, height: 8, borderRadius: 4 },
      label: { flex: 1, fontSize: 15, fontWeight: '600', color: c.text },
      count: {
        minWidth: 28,
        fontSize: 18,
        fontWeight: '900',
        textAlign: 'center',
      },
      btn: {
        width: 30,
        height: 30,
        borderRadius: 6,
        alignItems: 'center',
        justifyContent: 'center',
      },
      btnTxt: { fontSize: 18, fontWeight: '900', lineHeight: 22, color: c.white },
    });

    return (
      <View style={styles.card}>
        <Text style={styles.title}>
          {card.emoji} {card.title}
        </Text>
        {card.actions.map((a) => {
          const count = a.read(playerStats);
          const dot = dotColor(a.kind, c);
          const hasValue = count > 0;
          const minusDisabled = count === 0 || isLocked;
          const plusDisabled = isLocked;
          return (
            <View
              key={a.action}
              style={[styles.row, hasValue ? { backgroundColor: `${dot}14` } : null]}
            >
              <View style={[styles.dot, { backgroundColor: dot }]} />
              <Text style={styles.label} numberOfLines={1}>
                {a.label}
              </Text>
              <Text
                style={[
                  styles.count,
                  { color: hasValue ? c.text : c.textMuted },
                ]}
              >
                {count}
              </Text>
              <Pressable
                style={[
                  styles.btn,
                  {
                    backgroundColor: minusDisabled ? c.surfaceVariant : c.border,
                  },
                  isLocked ? { opacity: 0.5 } : null,
                ]}
                onPress={() => onAction(a.action, -1)}
                disabled={busy || minusDisabled}
              >
                <Text
                  style={[
                    styles.btnTxt,
                    { color: minusDisabled ? c.textMuted : c.text },
                  ]}
                >
                  −
                </Text>
              </Pressable>
              <Pressable
                style={[
                  styles.btn,
                  {
                    backgroundColor: plusDisabled
                      ? c.surfaceVariant
                      : plusBg(a.kind, c),
                  },
                  isLocked ? { opacity: 0.5 } : null,
                ]}
                onPress={() => onAction(a.action, 1)}
                disabled={busy || plusDisabled}
              >
                <Text
                  style={[
                    styles.btnTxt,
                    plusDisabled ? { color: c.textMuted } : null,
                  ]}
                >
                  +
                </Text>
              </Pressable>
            </View>
          );
        })}
      </View>
    );
  },
);
ActionCard.displayName = 'ActionCard';
