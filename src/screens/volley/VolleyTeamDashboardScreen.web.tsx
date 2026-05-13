import React, { useCallback, useMemo, useState } from 'react';
import { useFocusEffect, useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  HtmlScreen,
  HtmlHeader,
  HtmlButton,
  HtmlEmpty,
} from '../../components/web';
import { useAuthStore, useThemedColors } from '../../store';
import { getVolleyTeam } from '../../services/volleyTeamService';
import { listUserVolleyMatchesCached } from '../../services/volleyCacheService';
import {
  aggregatePlayerStats,
  matchesForTeam,
  teamEfficiencies,
  teamOverview,
  topPerformers,
} from '../../services/volleyTeamStats';
import { KpiCard } from './components/dashboard/KpiCard.web';
import { HighlightRow } from './components/dashboard/HighlightRow.web';
import { PlayerAggregateCard } from './components/dashboard/PlayerAggregateCard.web';
import { MatchHistoryItem } from './components/dashboard/MatchHistoryItem.web';
import { VolleyMatch, VolleyTeam } from '../../types';
import { toast } from '../../store/toastStore';
import type { VolleyStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<VolleyStackParamList, 'VolleyTeamDashboard'>;
type Rt = RouteProp<VolleyStackParamList, 'VolleyTeamDashboard'>;

export const VolleyTeamDashboardScreen: React.FC = () => {
  const c = useThemedColors();
  const nav = useNavigation<Nav>();
  const route = useRoute<Rt>();
  const user = useAuthStore((s) => s.user);

  const [team, setTeam] = useState<VolleyTeam | null>(null);
  const [matches, setMatches] = useState<VolleyMatch[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [t, allMatches] = await Promise.all([
        getVolleyTeam(route.params.teamId),
        listUserVolleyMatchesCached(user.id),
      ]);
      setTeam(t);
      if (t) {
        setMatches(matchesForTeam(allMatches, t.name));
      }
    } catch (e) {
      console.error('TeamDashboard load', e);
      toast.error('Erro ao carregar dados do time.');
    } finally {
      setLoading(false);
    }
  }, [user, route.params.teamId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  if (loading) {
    return (
      <HtmlScreen>
        <HtmlHeader title="Carregando..." onBack={() => nav.goBack()} />
      </HtmlScreen>
    );
  }

  if (!team) {
    return (
      <HtmlScreen>
        <HtmlHeader title="Time não encontrado" onBack={() => nav.goBack()} />
        <HtmlEmpty
          emoji="🚫"
          title="Time não encontrado"
          subtitle="Esse time pode ter sido apagado."
        />
      </HtmlScreen>
    );
  }

  // Memoizados: O(matches * players * sets); invalidam apenas com matches/team.players
  const overview = useMemo(() => teamOverview(matches), [matches]);
  const aggregates = useMemo(
    () => aggregatePlayerStats(matches, team.players),
    [matches, team.players],
  );
  const tops = useMemo(() => topPerformers(aggregates), [aggregates]);
  const effs = useMemo(() => teamEfficiencies(aggregates), [aggregates]);

  const sectionTitle: React.CSSProperties = {
    fontSize: 12,
    fontWeight: 800,
    color: c.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    margin: '16px 0 8px',
  };

  return (
    <HtmlScreen maxWidth={960}>
      <HtmlHeader
        title={team.name}
        subtitle={`${team.players.length} jogadores · ${overview.finished} partidas finalizadas`}
        onBack={() => nav.goBack()}
      />

      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <HtmlButton title="✏️ Editar time" variant="outline" onClick={() => nav.navigate('VolleyTeamEdit', { teamId: team.id })} />
        </div>
      </div>

      {/* Visão geral */}
      <div style={sectionTitle}>📊 Visão geral</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <KpiCard label="Vitórias" value={overview.wins} sub={`${overview.losses} derrotas`} />
        <KpiCard
          label="Taxa"
          value={`${overview.winRate.toFixed(0)}%`}
          sub={`${overview.finished} jogos`}
        />
        <KpiCard label="Sets" value={`${overview.setsWon} - ${overview.setsLost}`} />
        <KpiCard
          label="Pontos"
          value={`${overview.pointsScored}`}
          sub={`${overview.pointsConceded} sofridos`}
        />
      </div>

      {overview.recentForm.length > 0 ? (
        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 11, color: c.textSecondary, fontWeight: 700, marginBottom: 6 }}>
            Últimas 5
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {overview.recentForm.map((w, i) => (
              <div
                key={i}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 6,
                  background: w === 'W' ? c.success : c.danger,
                  color: c.white,
                  fontWeight: 900,
                  fontSize: 13,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {w}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Eficiencias do time */}
      <div style={sectionTitle}>⚡ Eficiência do time</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <KpiCard label="Ataque" value={`${effs.attackPct.toFixed(1)}%`} sub={`${effs.totalAttacks} totais`} />
        <KpiCard label="Saque" value={`${effs.servePct.toFixed(1)}%`} sub={`${effs.totalServes} totais`} />
        <KpiCard label="Passe" value={`${effs.passPct.toFixed(1)}%`} sub={`${effs.totalPasses} totais`} />
        <KpiCard label="Bloqueio" value={`${effs.blockPct.toFixed(1)}%`} sub={`${effs.totalBlocks} totais`} />
      </div>

      {/* Destaques */}
      <div style={sectionTitle}>🏆 Destaques</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {tops.scorer ? (
          <HighlightRow
            emoji="🎯"
            title="Maior pontuador"
            playerNumber={tops.scorer.player.number}
            playerName={tops.scorer.player.name}
            playerPosition={tops.scorer.player.position}
            value={tops.scorer.directPoints}
          />
        ) : null}
        {tops.server ? (
          <HighlightRow
            emoji="🎾"
            title="Melhor sacador (aces)"
            playerNumber={tops.server.player.number}
            playerName={tops.server.player.name}
            value={tops.server.stats.serves.ace}
          />
        ) : null}
        {tops.blocker ? (
          <HighlightRow
            emoji="🛡️"
            title="Melhor bloqueador"
            playerNumber={tops.blocker.player.number}
            playerName={tops.blocker.player.name}
            value={tops.blocker.stats.blocks.success}
          />
        ) : null}
        {tops.passer ? (
          <HighlightRow
            emoji="✋"
            title="Melhor passador (%A+B)"
            playerNumber={tops.passer.player.number}
            playerName={tops.passer.player.name}
            value={`${tops.passer.passPct.toFixed(0)}%`}
          />
        ) : null}
        {!tops.scorer && !tops.server && !tops.blocker && !tops.passer ? (
          <p style={{ color: c.textMuted, fontSize: 13 }}>
            Ainda não há partidas finalizadas pra calcular destaques.
          </p>
        ) : null}
      </div>

      {/* Tabela de jogadores */}
      <div style={sectionTitle}>👥 Desempenho individual</div>
      {aggregates.length === 0 ? (
        <p style={{ color: c.textMuted, fontSize: 13 }}>Sem jogadores cadastrados.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {aggregates.map((agg) => (
            <PlayerAggregateCard key={agg.player.number} agg={agg} />
          ))}
        </div>
      )}

      {/* Últimas partidas */}
      <div style={sectionTitle}>📅 Últimas partidas</div>
      {matches.length === 0 ? (
        <HtmlEmpty
          emoji="🏐"
          title="Nenhuma partida ainda"
          subtitle="Crie uma partida pra começar a registrar estatísticas pro time."
        />
      ) : (
        [...matches]
          .sort((a, b) => b.date.localeCompare(a.date))
          .slice(0, 10)
          .map((m) => (
            <MatchHistoryItem
              key={m.id}
              match={m}
              onPress={() => nav.navigate('VolleyReports', { matchId: m.id })}
            />
          ))
      )}

      <div style={{ height: 32 }} />
    </HtmlScreen>
  );
};
