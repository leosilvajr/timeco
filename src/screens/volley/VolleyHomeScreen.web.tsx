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

const formatDateBR = (iso: string): string => {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
};

const winsCount = (match: VolleyMatch): { a: number; b: number } => {
  let a = 0;
  let b = 0;
  for (const s of match.sets) {
    if (!s.finished) continue;
    if (s.scoreA > s.scoreB) a += 1;
    else if (s.scoreB > s.scoreA) b += 1;
  }
  return { a, b };
};

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
        matches.map((m) => {
          const w = winsCount(m);
          const isFinished = m.status === 'finished';
          return (
            <div
              key={m.id}
              onClick={() => nav.navigate('VolleyScout', { matchId: m.id })}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  nav.navigate('VolleyScout', { matchId: m.id });
                }
              }}
              style={{
                background: c.surface,
                border: `1px solid ${c.border}`,
                borderRadius: 16,
                padding: 14,
                marginBottom: 8,
                cursor: 'pointer',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 6,
                  gap: 8,
                }}
              >
                <span style={{ fontSize: 16, fontWeight: 800, color: c.text }}>
                  {m.teamAName} x {m.teamBName}
                </span>
                <span
                  style={{
                    padding: '2px 10px',
                    borderRadius: 999,
                    fontSize: 11,
                    fontWeight: 700,
                    background: isFinished ? `${c.success}33` : `${c.warning}33`,
                    color: isFinished ? c.success : c.warning,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {isFinished ? 'FINALIZADO' : `SET ${m.currentSet}`}
                </span>
              </div>
              <div style={{ fontSize: 13, color: c.textSecondary }}>
                {formatDateBR(m.date)} · {m.location} · Melhor de {m.format}
              </div>
              <div
                style={{
                  fontSize: 22,
                  fontWeight: 900,
                  color: c.primary,
                  marginTop: 4,
                }}
              >
                {w.a} x {w.b} sets
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginTop: 8,
                }}
              >
                <span style={{ fontSize: 13, color: c.textSecondary }}>
                  {m.players.length} jogadores
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(m);
                  }}
                  style={{
                    padding: '4px 8px',
                    background: 'transparent',
                    border: 'none',
                    color: c.danger,
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  Apagar
                </button>
              </div>
            </div>
          );
        })
      )}
    </HtmlScreen>
  );
};
