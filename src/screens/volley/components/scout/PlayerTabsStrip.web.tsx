import React from 'react';
import { Text } from '@mantine/core';
import { useThemedColors } from '../../../../store';
import { VolleyPlayer } from '../../../../types';

interface Props {
  players: VolleyPlayer[];
  selectedPlayer: number | null;
  onSelect: (playerNumber: number) => void;
}

/** Tabs horizontais de jogadores no sticky do Scout. */
export const PlayerTabsStrip: React.FC<Props> = ({ players, selectedPlayer, onSelect }) => {
  const c = useThemedColors();
  return (
    <>
      <Text
        size="xs"
        fw={800}
        c="dimmed"
        tt="uppercase"
        mt={8}
        mb={4}
        style={{ letterSpacing: 0.8 }}
      >
        Jogador
      </Text>
      <div
        className="volley-tabs-strip"
        style={{
          display: 'flex',
          gap: 6,
          overflowX: 'auto',
          paddingBottom: 2,
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {players.map((p) => {
          const isSel = p.number === selectedPlayer;
          return (
            <button
              key={p.number}
              onClick={() => onSelect(p.number)}
              style={{
                padding: '6px 12px',
                height: 32,
                borderRadius: 999,
                background: isSel ? c.primary : c.surface,
                border: `1.5px solid ${isSel ? c.primary : c.border}`,
                color: isSel ? c.onPrimary : c.text,
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontSize: 13,
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                flexShrink: 0,
                transition: 'all 120ms ease',
              }}
            >
              <span
                style={{
                  opacity: isSel ? 0.85 : 0.55,
                  fontSize: 10,
                  fontWeight: 900,
                }}
              >
                #{p.number}
              </span>
              <span>{p.name.split(' ')[0]}</span>
            </button>
          );
        })}
      </div>
    </>
  );
};
