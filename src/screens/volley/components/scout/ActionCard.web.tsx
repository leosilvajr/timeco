import React from 'react';
import { Card, Stack, Text } from '@mantine/core';
import { useThemedColors } from '../../../../store';
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
}

/**
 * Card de uma categoria de acoes do Scout (SAQUE/ATAQUE/PASSE/etc).
 * Renderiza cada acao como uma linha com dot+label+count+(-)+(+).
 */
export const ActionCard: React.FC<Props> = React.memo(
  ({ card, playerStats, busy, isLocked, onAction }) => {
    const c = useThemedColors();

    const kindColors = (kind: ActionKind) => {
      if (kind === 'positive') return { bg: c.success, fg: c.white };
      if (kind === 'negative') return { bg: c.danger, fg: c.white };
      return { bg: c.info, fg: c.white };
    };
    const dotColor = (kind: ActionKind) => {
      if (kind === 'positive') return c.success;
      if (kind === 'negative') return c.danger;
      return c.info;
    };

    return (
      <Card withBorder radius="md" padding="sm" style={{ background: c.surface }}>
        <Text
          size="xs"
          fw={800}
          c="dimmed"
          tt="uppercase"
          mb={6}
          ta="center"
          style={{ letterSpacing: 0.8 }}
        >
          {card.emoji} {card.title}
        </Text>
        <Stack gap={2}>
          {card.actions.map((a) => {
            const count = a.read(playerStats);
            const dot = dotColor(a.kind);
            const kColors = kindColors(a.kind);
            const hasValue = count > 0;
            return (
              <div
                key={a.action}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '2px 10px',
                  borderRadius: 8,
                  background: hasValue ? `${dot}12` : 'transparent',
                  transition: 'background 120ms ease',
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    background: dot,
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    flex: 1,
                    fontSize: 15,
                    fontWeight: 600,
                    color: c.text,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {a.label}
                </span>
                <span
                  style={{
                    minWidth: 28,
                    textAlign: 'center',
                    fontSize: 20,
                    fontWeight: 900,
                    color: hasValue ? c.text : c.textMuted,
                  }}
                >
                  {count}
                </span>
                <button
                  onClick={() => onAction(a.action, -1)}
                  disabled={busy || count === 0 || isLocked}
                  aria-label={`Decrementar ${a.label}`}
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 6,
                    background:
                      count === 0 || isLocked ? c.surfaceVariant : c.border,
                    color: count === 0 || isLocked ? c.textMuted : c.text,
                    border: 'none',
                    cursor:
                      count === 0 || isLocked ? 'not-allowed' : 'pointer',
                    fontSize: 18,
                    fontWeight: 900,
                    lineHeight: 1,
                    fontFamily: 'inherit',
                    flexShrink: 0,
                    transition: 'all 120ms ease',
                    opacity: busy || isLocked ? 0.5 : 1,
                  }}
                >
                  −
                </button>
                <button
                  onClick={() => onAction(a.action, 1)}
                  disabled={busy || isLocked}
                  aria-label={`Incrementar ${a.label}`}
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 6,
                    background: isLocked ? c.surfaceVariant : kColors.bg,
                    color: isLocked ? c.textMuted : kColors.fg,
                    border: 'none',
                    cursor: isLocked ? 'not-allowed' : 'pointer',
                    fontSize: 18,
                    fontWeight: 900,
                    lineHeight: 1,
                    fontFamily: 'inherit',
                    flexShrink: 0,
                    transition: 'all 120ms ease',
                    opacity: busy || isLocked ? 0.5 : 1,
                  }}
                >
                  +
                </button>
              </div>
            );
          })}
        </Stack>
      </Card>
    );
  },
);
ActionCard.displayName = 'ActionCard';
