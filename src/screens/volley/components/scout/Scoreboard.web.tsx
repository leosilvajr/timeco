import React from 'react';
import { useThemedColors } from '../../../../store';
import { VolleyMatch, VolleySetData } from '../../../../types';

interface Props {
  match: VolleyMatch;
  currentSet: VolleySetData | undefined;
  setsWonA: number;
  setsWonB: number;
}

interface TeamBoxProps {
  name: string;
  score: number;
  sets: number;
  serving: boolean;
  highlight: boolean;
}

const TeamBox: React.FC<TeamBoxProps> = ({ name, score, sets, serving, highlight }) => {
  const c = useThemedColors();
  return (
    <div
      style={{
        flex: 1,
        background: highlight ? c.surfaceVariant : c.surface,
        border: `2px solid ${highlight ? c.primary : c.border}`,
        borderRadius: 10,
        padding: '6px 8px',
        textAlign: 'center',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        minWidth: 0,
      }}
    >
      <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
        <div
          style={{
            fontSize: 10,
            fontWeight: 800,
            color: c.textSecondary,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {name}
        </div>
        <div style={{ fontSize: 10, color: c.textMuted, marginTop: 1 }}>
          Sets {sets}
          {serving ? ' · 🎾' : ''}
        </div>
      </div>
      <div
        style={{
          fontSize: 24,
          fontWeight: 900,
          color: c.text,
          lineHeight: 1,
          minWidth: 30,
          textAlign: 'right',
        }}
      >
        {score}
      </div>
    </div>
  );
};

/** Scoreboard compacto do Scout: 2 caixas lado a lado com nome+sets+score. */
export const Scoreboard: React.FC<Props> = ({ match, currentSet, setsWonA, setsWonB }) => {
  const isLive = !currentSet?.finished;
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <TeamBox
        name={match.teamAName}
        score={currentSet?.scoreA ?? 0}
        sets={setsWonA}
        serving={isLive && match.serveTeam === 'A'}
        highlight
      />
      <TeamBox
        name={match.teamBName}
        score={currentSet?.scoreB ?? 0}
        sets={setsWonB}
        serving={isLive && match.serveTeam === 'B'}
        highlight={false}
      />
    </div>
  );
};
