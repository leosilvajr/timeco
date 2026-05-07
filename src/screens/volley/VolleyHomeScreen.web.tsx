import React, { useEffect, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { HtmlScreen, HtmlHeader, HtmlCard, HtmlButton } from '../../components/web';
import { useAuthStore, useThemedColors } from '../../store';
import { listUserVolleyMatches } from '../../services/volleyScoutService';
import { VolleyMatch } from '../../types';
import type { VolleyStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<VolleyStackParamList, 'VolleyHome'>;

export const VolleyHomeScreen: React.FC = () => {
  const c = useThemedColors();
  const nav = useNavigation<Nav>();
  const user = useAuthStore((s) => s.user);
  const [matches, setMatches] = useState<VolleyMatch[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user) return;
    listUserVolleyMatches(user.id)
      .then(setMatches)
      .catch(() => undefined)
      .finally(() => setLoaded(true));
  }, [user?.id]);

  return (
    <HtmlScreen maxWidth={760}>
      <HtmlHeader
        title="Vôlei avançado"
        subtitle="Scout profissional · seus jogos"
        onBack={() => nav.goBack()}
      />

      <HtmlCard style={{ background: c.surfaceVariant }}>
        <p style={{ fontSize: 13, color: c.text, lineHeight: 1.5, margin: 0 }}>
          📊 Cadastre jogadores com posição e número e marque saques, ataques, blocos e
          levantamentos durante a partida. Vê estatísticas detalhadas no fim.
        </p>
      </HtmlCard>

      <HtmlButton title="+ Novo jogo" onClick={() => nav.navigate('VolleyMatchSetup')} />

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
        Seus jogos
      </div>

      {!loaded ? null : matches.length === 0 ? (
        <p style={{ color: c.textSecondary, fontSize: 13, padding: '12px 0' }}>
          Nenhum jogo ainda.
        </p>
      ) : (
        matches.map((m) => (
          <button
            key={m.id}
            onClick={() => nav.navigate('VolleyScout', { matchId: m.id })}
            style={{
              display: 'block',
              width: '100%',
              textAlign: 'left',
              padding: 12,
              background: c.surface,
              border: `1px solid ${c.border}`,
              borderRadius: 16,
              marginBottom: 8,
              cursor: 'pointer',
              fontFamily: 'inherit',
              color: 'inherit',
            }}
          >
            <div style={{ fontSize: 15, fontWeight: 700, color: c.text }}>
              {m.teamAName} vs {m.teamBName}
            </div>
            <div style={{ fontSize: 12, color: c.textSecondary, marginTop: 2 }}>
              {m.date} · {m.location} · Set {m.currentSet}
            </div>
            <div style={{ fontSize: 12, color: c.textMuted, marginTop: 2 }}>
              Status: {m.status === 'finished' ? '✅ Finalizado' : '⏱️ Em andamento'}
            </div>
          </button>
        ))
      )}
    </HtmlScreen>
  );
};
