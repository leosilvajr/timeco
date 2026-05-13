import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useThemedColors } from '../../../../store';
import { isSetWon, setMomentum } from '../../../../services/volleyRules';
import { VolleyMatch, VolleySetData } from '../../../../types';

interface Props {
  match: VolleyMatch;
  currentSet: VolleySetData | undefined;
  onCloseSet: () => void;
}

/**
 * Banner do Scout nativo: SET POINT / MATCH POINT / 'VENCEU O SET' (clicavel).
 * Renderiza null quando nao tem momentum significativo.
 */
export const SetMomentumBanner: React.FC<Props> = ({ match, currentSet, onCloseSet }) => {
  const c = useThemedColors();
  if (!currentSet || currentSet.finished) return null;

  const won = isSetWon(currentSet, match.format);
  if (won.won) {
    const winnerName = won.winner === 'A' ? match.teamAName : match.teamBName;
    return (
      <Pressable
        onPress={onCloseSet}
        style={{
          marginBottom: 6,
          paddingVertical: 8,
          paddingHorizontal: 12,
          borderRadius: 8,
          backgroundColor: c.success,
        }}
      >
        <Text
          style={{
            color: c.white,
            fontSize: 12,
            fontWeight: '900',
            textAlign: 'center',
            letterSpacing: 0.5,
          }}
        >
          🏆 {winnerName.toUpperCase()} VENCEU O SET — TOQUE PRA ENCERRAR
        </Text>
      </Pressable>
    );
  }

  const m = setMomentum(currentSet, match);
  if (m.kind === 'normal') return null;
  const teamName = m.team === 'A' ? match.teamAName : match.teamBName;
  const bg = m.kind === 'match_point' ? c.danger : c.warning;
  const label = m.kind === 'match_point' ? 'MATCH POINT' : 'SET POINT';
  return (
    <View
      style={{
        marginBottom: 6,
        paddingVertical: 4,
        paddingHorizontal: 10,
        borderRadius: 8,
        backgroundColor: bg,
      }}
    >
      <Text
        style={{
          color: c.white,
          fontSize: 11,
          fontWeight: '900',
          textAlign: 'center',
          letterSpacing: 0.5,
        }}
      >
        ⚡ {label} — {teamName}
      </Text>
    </View>
  );
};
