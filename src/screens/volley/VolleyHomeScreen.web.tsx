import React, { useCallback, useState } from 'react';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  HtmlScreen,
  HtmlHeader,
  HtmlCard,
  HtmlButton,
  webConfirm,
} from '../../components/web';
import { useAuthStore, useThemedColors } from '../../store';
import { listUserVolleyMatches, deleteVolleyMatch } from '../../services/volleyScoutService';
import { toast } from '../../store/toastStore';
import { VolleyMatch } from '../../types';
import type { VolleyStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<VolleyStackParamList, 'VolleyHome'>;

export const VolleyHomeScreen: React.FC = () => {
  const c = useThemedColors();
  const nav = useNavigation<Nav>();
  const user = useAuthStore((s) => s.user);
  const [matches, setMatches] = useState<VolleyMatch[]>([]);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(() => {
    if (!user) return;
    listUserVolleyMatches(user.id)
      .then(setMatches)
      .catch((e) => {
        console.error('listUserVolleyMatches', e);
        toast.error('Erro ao carregar partidas. Tente recarregar a página.');
      })
      .finally(() => setLoaded(true));
  }, [user?.id]);

  // useFocusEffect — refaz fetch toda vez que a tela ganha foco
  // (ex: depois de criar uma partida, ao voltar do MatchSetup,
  // a partida nova aparece sem precisar refresh).
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const onDelete = async (m: VolleyMatch) => {
    const ok = await webConfirm({
      title: 'Apagar partida',
      message: `Apagar a partida "${m.teamAName} x ${m.teamBName}"? Os dados de scout serão perdidos.`,
      danger: true,
      confirmLabel: 'Apagar',
    });
    if (!ok) return;
    try {
      await deleteVolleyMatch(m.id);
      setMatches((prev) => prev.filter((x) => x.id !== m.id));
      toast.success('Partida apagada.');
    } catch (e) {
      console.error('deleteVolleyMatch', e);
      toast.error('Erro ao apagar partida.');
    }
  };

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

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <HtmlButton title="+ Novo jogo" onClick={() => nav.navigate('VolleyMatchSetup')} />
        <HtmlButton
          title="👥 Meus times"
          variant="outline"
          onClick={() => nav.navigate('VolleyTeamsList')}
        />
      </div>

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
          <div
            key={m.id}
            style={{
              display: 'flex',
              alignItems: 'stretch',
              background: c.surface,
              border: `1px solid ${c.border}`,
              borderRadius: 16,
              marginBottom: 8,
              overflow: 'hidden',
            }}
          >
            <button
              onClick={() => nav.navigate('VolleyScout', { matchId: m.id })}
              style={{
                flex: 1,
                textAlign: 'left',
                padding: 12,
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'inherit',
                color: 'inherit',
                minWidth: 0,
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
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(m);
              }}
              aria-label="Apagar partida"
              style={{
                flexShrink: 0,
                padding: '0 14px',
                background: 'transparent',
                border: 'none',
                borderLeft: `1px solid ${c.border}`,
                color: c.danger,
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              🗑️ Apagar
            </button>
          </div>
        ))
      )}
    </HtmlScreen>
  );
};
