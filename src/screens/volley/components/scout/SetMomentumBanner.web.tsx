import React from 'react';
import { useThemedColors } from '../../../../store';
import { isSetWon, setMomentum } from '../../../../services/volleyRules';
import { VolleyMatch, VolleySetData } from '../../../../types';

interface Props {
  match: VolleyMatch;
  currentSet: VolleySetData | undefined;
  onCloseSet: () => void;
}

/**
 * Banner que aparece no topo do scoreboard sticky quando o set tem
 * momentum significativo:
 * - Verde clicavel "VENCEU O SET" quando algum time fechou (regra FIVB)
 * - Vermelho "MATCH POINT" quando 1 ponto fecha o jogo
 * - Amarelo "SET POINT" quando 1 ponto fecha o set
 * - Nada quando o set esta em ritmo normal
 */
export const SetMomentumBanner: React.FC<Props> = ({ match, currentSet, onCloseSet }) => {
  const c = useThemedColors();
  if (!currentSet || currentSet.finished) return null;

  const won = isSetWon(currentSet, match.format);
  if (won.won) {
    const winnerName = won.winner === 'A' ? match.teamAName : match.teamBName;
    return (
      <div
        onClick={onCloseSet}
        role="button"
        tabIndex={0}
        style={{
          marginBottom: 6,
          padding: '8px 12px',
          borderRadius: 8,
          background: c.success,
          color: c.white,
          fontSize: 12,
          fontWeight: 900,
          textAlign: 'center',
          cursor: 'pointer',
          letterSpacing: 0.5,
        }}
        title="Clique pra encerrar este set"
      >
        🏆 {winnerName.toUpperCase()} VENCEU O SET — TOQUE PRA ENCERRAR
      </div>
    );
  }

  const m = setMomentum(currentSet, match);
  if (m.kind === 'normal') return null;
  const teamName = m.team === 'A' ? match.teamAName : match.teamBName;
  const bg = m.kind === 'match_point' ? c.danger : c.warning;
  const label = m.kind === 'match_point' ? 'MATCH POINT' : 'SET POINT';
  return (
    <div
      style={{
        marginBottom: 6,
        padding: '4px 10px',
        borderRadius: 8,
        background: bg,
        color: c.white,
        fontSize: 11,
        fontWeight: 900,
        textAlign: 'center',
        letterSpacing: 0.5,
      }}
    >
      ⚡ {label} — {teamName}
    </div>
  );
};
