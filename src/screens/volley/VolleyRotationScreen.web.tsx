import React, { useEffect, useState } from 'react';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { HtmlScreen, HtmlHeader, HtmlCard, HtmlButton } from '../../components/web';
import { useThemedColors } from '../../store';
import {
  getVolleyMatch,
  rotateManual,
  rotateManualBack,
  resetRotation,
} from '../../services/volleyScoutService';
import { VolleyMatch } from '../../types';
import type { VolleyStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<VolleyStackParamList, 'VolleyRotation'>;
type Rt = RouteProp<VolleyStackParamList, 'VolleyRotation'>;

const POSITIONS = ['P4', 'P3', 'P2', 'P5', 'P6', 'P1'];

export const VolleyRotationScreen: React.FC = () => {
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

  const onRotate = async () => {
    setBusy(true);
    try {
      await rotateManual(match);
      await load();
    } finally {
      setBusy(false);
    }
  };

  const onRotateBack = async () => {
    setBusy(true);
    try {
      await rotateManualBack(match);
      await load();
    } finally {
      setBusy(false);
    }
  };

  const onReset = async () => {
    if (!window.confirm('Voltar à rotação inicial?')) return;
    setBusy(true);
    try {
      await resetRotation(match);
      await load();
    } finally {
      setBusy(false);
    }
  };

  return (
    <HtmlScreen maxWidth={600}>
      <HtmlHeader
        title="Rotação"
        subtitle={`${match.teamAName} · sistema ${match.rotationSystem}`}
        onBack={() => nav.goBack()}
      />

      <HtmlCard>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 8,
            marginBottom: 12,
          }}
        >
          {match.currentRotation.map((num, idx) => {
            const player = match.players.find((p) => p.number === num);
            return (
              <div
                key={idx}
                style={{
                  padding: 16,
                  background: c.surfaceVariant,
                  borderRadius: 10,
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 700, color: c.textSecondary }}>
                  {POSITIONS[idx]}
                </div>
                <div style={{ fontSize: 22, fontWeight: 900, color: c.primary, marginTop: 4 }}>
                  #{num}
                </div>
                <div style={{ fontSize: 12, color: c.text, fontWeight: 600 }}>
                  {player?.name ?? '-'}
                </div>
                <div style={{ fontSize: 10, color: c.textSecondary }}>
                  {player?.position ?? ''}
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ fontSize: 12, color: c.textSecondary, textAlign: 'center' }}>
          Total de rotações: {match.rotationCount}
        </div>
      </HtmlCard>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
        <HtmlButton title="🔄 Rotacionar (horário)" onClick={onRotate} loading={busy} />
        <HtmlButton title="↩️ Desrotacionar" variant="outline" onClick={onRotateBack} disabled={busy} />
        <HtmlButton title="🔁 Voltar à inicial" variant="ghost" onClick={onReset} disabled={busy} />
      </div>
    </HtmlScreen>
  );
};
