import React from 'react';
import { Text } from '@mantine/core';
import { useThemedColors } from '../../../../store';
import { VolleyPlayer } from '../../../../types';

interface Props {
  players: VolleyPlayer[];
  /** Numeros dos jogadores atualmente em quadra (6 entradas). */
  inCourtNumbers?: number[];
  selectedPlayer: number | null;
  onSelect: (playerNumber: number) => void;
}

interface PlayerRowProps {
  player: VolleyPlayer;
  isSelected: boolean;
  onClick: () => void;
  compact?: boolean;
}

const PlayerRow: React.FC<PlayerRowProps> = ({
  player,
  isSelected,
  onClick,
  compact = false,
}) => {
  const c = useThemedColors();
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%',
        padding: compact ? '4px 10px' : '6px 12px',
        borderRadius: 8,
        background: isSelected ? c.primary : c.surface,
        border: `1.5px solid ${isSelected ? c.primary : c.border}`,
        color: isSelected ? c.onPrimary : c.text,
        cursor: 'pointer',
        fontFamily: 'inherit',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        transition: 'all 120ms ease',
      }}
    >
      <span
        style={{
          minWidth: 28,
          textAlign: 'center',
          fontSize: 12,
          fontWeight: 900,
          opacity: isSelected ? 0.85 : 0.55,
        }}
      >
        #{player.number}
      </span>
      <span
        style={{
          flex: 1,
          textAlign: 'left',
          fontSize: compact ? 13 : 14,
          fontWeight: 700,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {player.name}
      </span>
      <span
        style={{
          fontSize: 11,
          opacity: isSelected ? 0.85 : 0.6,
          fontWeight: 600,
          whiteSpace: 'nowrap',
        }}
      >
        {player.position}
      </span>
    </button>
  );
};

/**
 * Lista vertical de jogadores no Scout, agrupada por 'Em quadra' (6
 * rotacionados) e 'Banco' (substitutos). Permite selecao rapida durante
 * o jogo sem rolar horizontalmente.
 */
export const PlayerTabsStrip: React.FC<Props> = ({
  players,
  inCourtNumbers,
  selectedPlayer,
  onSelect,
}) => {
  const c = useThemedColors();

  const inCourtSet = new Set(inCourtNumbers ?? []);
  const inCourt = inCourtNumbers
    ? players.filter((p) => inCourtSet.has(p.number))
    : [];
  const bench = inCourtNumbers
    ? players.filter((p) => !inCourtSet.has(p.number))
    : players;

  // Ordena por numero da camisa (mais previsivel)
  const sortByNumber = (a: VolleyPlayer, b: VolleyPlayer) => a.number - b.number;
  inCourt.sort(sortByNumber);
  bench.sort(sortByNumber);

  const sectionLabel: React.CSSProperties = {
    fontSize: 10,
    fontWeight: 800,
    color: c.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: 8,
    marginBottom: 4,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {inCourt.length > 0 ? (
        <>
          <Text size="xs" fw={800} c="dimmed" tt="uppercase" style={sectionLabel}>
            🏐 Em quadra ({inCourt.length})
          </Text>
          {inCourt.map((p) => (
            <PlayerRow
              key={p.number}
              player={p}
              isSelected={p.number === selectedPlayer}
              onClick={() => onSelect(p.number)}
            />
          ))}
        </>
      ) : null}

      {bench.length > 0 ? (
        <>
          <Text size="xs" fw={800} c="dimmed" tt="uppercase" style={sectionLabel}>
            🪑 Banco ({bench.length})
          </Text>
          {bench.map((p) => (
            <PlayerRow
              key={p.number}
              player={p}
              isSelected={p.number === selectedPlayer}
              onClick={() => onSelect(p.number)}
              compact
            />
          ))}
        </>
      ) : null}
    </div>
  );
};
