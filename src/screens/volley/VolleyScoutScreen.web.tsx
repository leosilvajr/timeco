import React, { useEffect, useState } from 'react';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  HtmlScreen,
  HtmlHeader,
  HtmlCard,
  HtmlButton,
} from '../../components/web';
import { useThemedColors } from '../../store';
import {
  getVolleyMatch,
  registerPoint,
  finishCurrentSet,
} from '../../services/volleyScoutService';
import { VolleyMatch } from '../../types';
import type { VolleyStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<VolleyStackParamList, 'VolleyScout'>;
type Rt = RouteProp<VolleyStackParamList, 'VolleyScout'>;

export const VolleyScoutScreen: React.FC = () => {
  const c = useThemedColors();
  const nav = useNavigation<Nav>();
  const route = useRoute<Rt>();
  const [match, setMatch] = useState<VolleyMatch | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const m = await getVolleyMatch(route.params.matchId);
    setMatch(m);
  };

  useEffect(() => {
    load();
  }, [route.params.matchId]);

  if (!match) {
    return (
      <HtmlScreen>
        <HtmlHeader title="Carregando..." onBack={() => nav.goBack()} />
      </HtmlScreen>
    );
  }

  const set = match.sets[match.currentSet - 1];
  const currentRotationActive = match.currentRotation;
  const setsWonA = match.sets.filter((s) => s.finished && s.scoreA > s.scoreB).length;
  const setsWonB = match.sets.filter((s) => s.finished && s.scoreB > s.scoreA).length;

  const onPoint = async (team: 'A' | 'B') => {
    if (busy || !set || set.finished || !match) return;
    setBusy(true);
    try {
      await registerPoint(match, team, true);
      await load();
    } finally {
      setBusy(false);
    }
  };

  const onCloseSet = async () => {
    if (!set || set.finished || !match) return;
    if (!window.confirm('Encerrar este set?')) return;
    setBusy(true);
    try {
      await finishCurrentSet(match);
      await load();
    } finally {
      setBusy(false);
    }
  };

  return (
    <HtmlScreen maxWidth={840}>
      <HtmlHeader
        title={`Set ${match.currentSet}`}
        subtitle={`${match.teamAName} vs ${match.teamBName}`}
        onBack={() => nav.goBack()}
      />

      <HtmlCard style={{ background: c.surfaceVariant }}>
        <p style={{ fontSize: 13, color: c.text, lineHeight: 1.5, margin: 0 }}>
          🏐 Versão simplificada do scout para web. Use o APK nativo para tracking detalhado de
          ataques/saques/blocos por jogador.
        </p>
      </HtmlCard>

      {/* Placar grande */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <div
          style={{
            flex: 1,
            padding: 16,
            background: c.primary,
            borderRadius: 16,
            color: c.white,
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 700, opacity: 0.9 }}>{match.teamAName}</div>
          <div style={{ fontSize: 64, fontWeight: 900, lineHeight: 1, marginTop: 8 }}>
            {set?.scoreA ?? 0}
          </div>
          <div style={{ fontSize: 12, opacity: 0.85, marginTop: 4 }}>Sets: {setsWonA}</div>
        </div>
        <div
          style={{
            flex: 1,
            padding: 16,
            background: c.surface,
            border: `2px solid ${c.border}`,
            borderRadius: 16,
            textAlign: 'center',
            color: c.text,
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 700, color: c.textSecondary }}>
            {match.teamBName}
          </div>
          <div style={{ fontSize: 64, fontWeight: 900, lineHeight: 1, marginTop: 8 }}>
            {set?.scoreB ?? 0}
          </div>
          <div style={{ fontSize: 12, color: c.textSecondary, marginTop: 4 }}>
            Sets: {setsWonB}
          </div>
        </div>
      </div>

      {set && !set.finished ? (
        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <HtmlButton title="+ Ponto A" onClick={() => onPoint('A')} disabled={busy} />
          <HtmlButton title="+ Ponto B" onClick={() => onPoint('B')} variant="outline" disabled={busy} />
        </div>
      ) : null}

      <div
        style={{
          fontSize: 12,
          fontWeight: 800,
          color: c.textSecondary,
          textTransform: 'uppercase',
          letterSpacing: 0.6,
          marginTop: 16,
          marginBottom: 8,
        }}
      >
        Rotação atual
      </div>
      <HtmlCard>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {currentRotationActive.map((num, idx) => {
            const player = match.players.find((p) => p.number === num);
            return (
              <div
                key={idx}
                style={{
                  padding: 12,
                  background: c.surfaceVariant,
                  borderRadius: 10,
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: 18, fontWeight: 900, color: c.primary }}>#{num}</div>
                <div style={{ fontSize: 11, color: c.text, fontWeight: 600 }}>
                  {player?.name ?? '-'}
                </div>
                <div style={{ fontSize: 10, color: c.textSecondary }}>
                  {player?.position ?? ''}
                </div>
              </div>
            );
          })}
        </div>
      </HtmlCard>

      <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {set && !set.finished ? (
          <HtmlButton title="Encerrar este set" variant="outline" onClick={onCloseSet} />
        ) : null}
        <HtmlButton
          title="📊 Ver relatórios"
          variant="secondary"
          onClick={() => nav.navigate('VolleyReports', { matchId: match.id })}
        />
        <HtmlButton
          title="🔄 Rotação"
          variant="ghost"
          onClick={() => nav.navigate('VolleyRotation', { matchId: match.id })}
        />
        {match.status !== 'finished' ? (
          <HtmlButton title="🏁 Encerrar set (auto-finaliza partida no último)" variant="danger" onClick={onCloseSet} />
        ) : null}
      </div>
    </HtmlScreen>
  );
};
