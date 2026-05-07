import React, { useEffect, useState } from 'react';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { HtmlScreen, HtmlHeader, HtmlCard } from '../../components/web';
import { useThemedColors } from '../../store';
import { getVolleyMatch } from '../../services/volleyScoutService';
import { VolleyMatch } from '../../types';
import type { VolleyStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<VolleyStackParamList, 'VolleyReports'>;
type Rt = RouteProp<VolleyStackParamList, 'VolleyReports'>;

export const VolleyReportsScreen: React.FC = () => {
  const c = useThemedColors();
  const nav = useNavigation<Nav>();
  const route = useRoute<Rt>();
  const [match, setMatch] = useState<VolleyMatch | null>(null);

  useEffect(() => {
    getVolleyMatch(route.params.matchId).then(setMatch);
  }, [route.params.matchId]);

  if (!match) {
    return (
      <HtmlScreen>
        <HtmlHeader title="Carregando..." onBack={() => nav.goBack()} />
      </HtmlScreen>
    );
  }

  const setsWonA = match.sets.filter((s) => s.finished && s.scoreA > s.scoreB).length;
  const setsWonB = match.sets.filter((s) => s.finished && s.scoreB > s.scoreA).length;
  const winner =
    match.status === 'finished'
      ? setsWonA > setsWonB
        ? match.teamAName
        : match.teamBName
      : null;

  return (
    <HtmlScreen maxWidth={840}>
      <HtmlHeader
        title="Relatórios"
        subtitle={`${match.teamAName} vs ${match.teamBName}`}
        onBack={() => nav.goBack()}
      />

      <HtmlCard>
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 13, color: c.textSecondary, fontWeight: 700, textTransform: 'uppercase' }}>
            Resultado
          </div>
          <div style={{ fontSize: 32, fontWeight: 900, color: c.text, marginTop: 8 }}>
            {setsWonA} <span style={{ color: c.textMuted }}>×</span> {setsWonB}
          </div>
          {winner ? (
            <div style={{ fontSize: 16, fontWeight: 700, color: c.primary, marginTop: 8 }}>
              🏆 {winner}
            </div>
          ) : (
            <div style={{ fontSize: 13, color: c.textSecondary, marginTop: 8 }}>Em andamento</div>
          )}
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${match.sets.length + 1}, 1fr)`,
            gap: 4,
            fontSize: 13,
          }}
        >
          <div style={{ fontWeight: 700, color: c.textSecondary }}>Set</div>
          {match.sets.map((s) => (
            <div
              key={s.number}
              style={{
                fontWeight: 700,
                color: c.textSecondary,
                textAlign: 'center',
              }}
            >
              {s.number}
            </div>
          ))}

          <div style={{ fontWeight: 700, color: c.text }}>{match.teamAName}</div>
          {match.sets.map((s) => (
            <div
              key={`a-${s.number}`}
              style={{
                textAlign: 'center',
                color: s.scoreA > s.scoreB ? c.primary : c.text,
                fontWeight: s.scoreA > s.scoreB ? 800 : 600,
              }}
            >
              {s.scoreA}
            </div>
          ))}

          <div style={{ fontWeight: 700, color: c.text }}>{match.teamBName}</div>
          {match.sets.map((s) => (
            <div
              key={`b-${s.number}`}
              style={{
                textAlign: 'center',
                color: s.scoreB > s.scoreA ? c.primary : c.text,
                fontWeight: s.scoreB > s.scoreA ? 800 : 600,
              }}
            >
              {s.scoreB}
            </div>
          ))}
        </div>
      </HtmlCard>

      <HtmlCard style={{ background: c.surfaceVariant }}>
        <p style={{ fontSize: 13, color: c.text, lineHeight: 1.5, margin: 0 }}>
          📈 Para estatísticas detalhadas por jogador (eficiência de ataque, % de aces, índice de
          recepção, etc), abra essa partida no app nativo Android/iOS.
        </p>
      </HtmlCard>
    </HtmlScreen>
  );
};
