import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useFocusEffect, useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen, Header, Button, EmptyState } from '../../components';
import { ColorPalette, spacing } from '../../constants/theme';
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
import { VolleyMatch, VolleyTeam } from '../../types';
import { toast } from '../../store/toastStore';
import { KpiCard } from './components/dashboard/KpiCard';
import { HighlightRow } from './components/dashboard/HighlightRow';
import { PlayerAggregateCard } from './components/dashboard/PlayerAggregateCard';
import { MatchHistoryItem } from './components/dashboard/MatchHistoryItem';
import type { VolleyStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<VolleyStackParamList, 'VolleyTeamDashboard'>;
type Rt = RouteProp<VolleyStackParamList, 'VolleyTeamDashboard'>;

const makeStyles = (c: ColorPalette) =>
  StyleSheet.create({
    sectionTitle: {
      fontSize: 12,
      fontWeight: '800',
      color: c.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
      marginTop: spacing.md,
      marginBottom: spacing.sm,
    },
    kpiRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    recentBoxes: { flexDirection: 'row', gap: 6 },
    recentBox: {
      width: 28,
      height: 28,
      borderRadius: 6,
      alignItems: 'center',
      justifyContent: 'center',
    },
    recentTxt: { color: c.white, fontWeight: '900', fontSize: 13 },
  });

export const VolleyTeamDashboardScreen: React.FC = () => {
  const c = useThemedColors();
  const nav = useNavigation<Nav>();
  const route = useRoute<Rt>();
  const user = useAuthStore((s) => s.user);
  const styles = makeStyles(c);

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
      if (t) setMatches(matchesForTeam(allMatches, t.name));
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
      <Screen>
        <Header title="Carregando..." onBack={() => nav.goBack()} />
      </Screen>
    );
  }

  if (!team) {
    return (
      <Screen>
        <Header title="Time não encontrado" onBack={() => nav.goBack()} />
        <EmptyState
          emoji="🚫"
          title="Time não encontrado"
          description="Esse time pode ter sido apagado."
        />
      </Screen>
    );
  }

  // Memoizados: caros (O(matches * players * sets)), invalidam apenas com matches/team.players
  const overview = useMemo(() => teamOverview(matches), [matches]);
  const aggregates = useMemo(
    () => aggregatePlayerStats(matches, team.players),
    [matches, team.players],
  );
  const tops = useMemo(() => topPerformers(aggregates), [aggregates]);
  const effs = useMemo(() => teamEfficiencies(aggregates), [aggregates]);

  return (
    <Screen maxWidth={960}>
      <Header
        title={team.name}
        subtitle={`${team.players.length} jogadores · ${overview.finished} partidas finalizadas`}
        onBack={() => nav.goBack()}
      />

      <View style={{ marginBottom: spacing.sm }}>
        <Button
          title="✏️ Editar time"
          variant="outline"
          onPress={() => nav.navigate('VolleyTeamEdit', { teamId: team.id })}
        />
      </View>

      <Text style={styles.sectionTitle}>📊 Visão geral</Text>
      <View style={styles.kpiRow}>
        <KpiCard label="Vitórias" value={overview.wins} sub={`${overview.losses} derrotas`} />
        <KpiCard label="Taxa" value={`${overview.winRate.toFixed(0)}%`} sub={`${overview.finished} jogos`} />
        <KpiCard label="Sets" value={`${overview.setsWon} - ${overview.setsLost}`} />
        <KpiCard label="Pontos" value={overview.pointsScored} sub={`${overview.pointsConceded} sofridos`} />
      </View>

      {overview.recentForm.length > 0 ? (
        <View style={{ marginTop: 12 }}>
          <Text style={{ fontSize: 11, color: c.textSecondary, fontWeight: '700', marginBottom: 6 }}>
            Últimas 5
          </Text>
          <View style={styles.recentBoxes}>
            {overview.recentForm.map((w, i) => (
              <View
                key={i}
                style={[
                  styles.recentBox,
                  { backgroundColor: w === 'W' ? c.success : c.danger },
                ]}
              >
                <Text style={styles.recentTxt}>{w}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      <Text style={styles.sectionTitle}>⚡ Eficiência do time</Text>
      <View style={styles.kpiRow}>
        <KpiCard label="Ataque" value={`${effs.attackPct.toFixed(1)}%`} sub={`${effs.totalAttacks} totais`} />
        <KpiCard label="Saque" value={`${effs.servePct.toFixed(1)}%`} sub={`${effs.totalServes} totais`} />
        <KpiCard label="Passe" value={`${effs.passPct.toFixed(1)}%`} sub={`${effs.totalPasses} totais`} />
        <KpiCard label="Bloqueio" value={`${effs.blockPct.toFixed(1)}%`} sub={`${effs.totalBlocks} totais`} />
      </View>

      <Text style={styles.sectionTitle}>🏆 Destaques</Text>
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
          title="Melhor passador"
          playerNumber={tops.passer.player.number}
          playerName={tops.passer.player.name}
          value={`${tops.passer.passPct.toFixed(0)}%`}
        />
      ) : null}
      {!tops.scorer && !tops.server && !tops.blocker && !tops.passer ? (
        <Text style={{ color: c.textMuted, fontSize: 13 }}>
          Ainda não há partidas finalizadas pra calcular destaques.
        </Text>
      ) : null}

      <Text style={styles.sectionTitle}>👥 Desempenho individual</Text>
      {aggregates.length === 0 ? (
        <Text style={{ color: c.textMuted, fontSize: 13 }}>
          Sem jogadores cadastrados.
        </Text>
      ) : (
        aggregates.map((agg) => (
          <PlayerAggregateCard key={agg.player.number} agg={agg} />
        ))
      )}

      <Text style={styles.sectionTitle}>📅 Últimas partidas</Text>
      {matches.length === 0 ? (
        <EmptyState
          emoji="🏐"
          title="Nenhuma partida ainda"
          description="Crie uma partida pra começar a registrar estatísticas pro time."
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

      <View style={{ height: spacing.xxl }} />
    </Screen>
  );
};
