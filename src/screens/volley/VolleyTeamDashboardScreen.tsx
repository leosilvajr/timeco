import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useFocusEffect, useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen, Header, Button, EmptyState } from '../../components';
import { ColorPalette, spacing, radius } from '../../constants/theme';
import { useAuthStore, useThemedColors } from '../../store';
import { getVolleyTeam } from '../../services/volleyTeamService';
import { listUserVolleyMatches } from '../../services/volleyScoutService';
import {
  aggregatePlayerStats,
  matchOutcome,
  matchesForTeam,
  teamEfficiencies,
  teamOverview,
  topPerformers,
} from '../../services/volleyTeamStats';
import { efficiencyThresholds } from '../../services/volleyStats';
import { VolleyMatch, VolleyTeam } from '../../types';
import { toast } from '../../store/toastStore';
import type { VolleyStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<VolleyStackParamList, 'VolleyTeamDashboard'>;
type Rt = RouteProp<VolleyStackParamList, 'VolleyTeamDashboard'>;

const formatDateBR = (iso: string): string => {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
};

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
    kpiCard: {
      flex: 1,
      minWidth: 120,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 10,
      padding: 12,
      alignItems: 'center',
    },
    kpiLabel: {
      fontSize: 11,
      color: c.textSecondary,
      fontWeight: '700',
      textTransform: 'uppercase',
    },
    kpiValue: {
      fontSize: 22,
      fontWeight: '900',
      color: c.text,
      marginTop: 4,
    },
    kpiSub: { fontSize: 11, color: c.textMuted, marginTop: 2 },
    recentBoxes: { flexDirection: 'row', gap: 6 },
    recentBox: {
      width: 28,
      height: 28,
      borderRadius: 6,
      alignItems: 'center',
      justifyContent: 'center',
    },
    recentTxt: { color: c.white, fontWeight: '900', fontSize: 13 },
    highlightCard: {
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 10,
      padding: 12,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginBottom: 6,
    },
    playerCard: {
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 10,
      padding: 10,
      marginBottom: 6,
    },
    playerHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
    pBadge: {
      backgroundColor: c.primary,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 999,
    },
    pBadgeTxt: { color: c.onPrimary, fontSize: 11, fontWeight: '900' },
    pChip: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 6,
      backgroundColor: c.surfaceVariant,
    },
    matchCard: {
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 10,
      padding: 12,
      marginBottom: 6,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
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
        listUserVolleyMatches(user.id),
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

  const overview = teamOverview(matches);
  const aggregates = aggregatePlayerStats(matches, team.players);
  const tops = topPerformers(aggregates);
  const effs = teamEfficiencies(aggregates);

  const pctColor = (pct: number, threshold: number) =>
    pct >= threshold ? c.success : pct >= threshold * 0.7 ? c.warning : c.danger;

  const Kpi = ({ label, value, sub }: { label: string; value: string | number; sub?: string }) => (
    <View style={styles.kpiCard}>
      <Text style={styles.kpiLabel}>{label}</Text>
      <Text style={styles.kpiValue}>{value}</Text>
      {sub ? <Text style={styles.kpiSub}>{sub}</Text> : null}
    </View>
  );

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
        <Kpi label="Vitórias" value={overview.wins} sub={`${overview.losses} derrotas`} />
        <Kpi label="Taxa" value={`${overview.winRate.toFixed(0)}%`} sub={`${overview.finished} jogos`} />
        <Kpi label="Sets" value={`${overview.setsWon} - ${overview.setsLost}`} />
        <Kpi label="Pontos" value={overview.pointsScored} sub={`${overview.pointsConceded} sofridos`} />
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
        <Kpi label="Ataque" value={`${effs.attackPct.toFixed(1)}%`} sub={`${effs.totalAttacks} totais`} />
        <Kpi label="Saque" value={`${effs.servePct.toFixed(1)}%`} sub={`${effs.totalServes} totais`} />
        <Kpi label="Passe" value={`${effs.passPct.toFixed(1)}%`} sub={`${effs.totalPasses} totais`} />
        <Kpi label="Bloqueio" value={`${effs.blockPct.toFixed(1)}%`} sub={`${effs.totalBlocks} totais`} />
      </View>

      <Text style={styles.sectionTitle}>🏆 Destaques</Text>
      {tops.scorer ? (
        <View style={styles.highlightCard}>
          <Text style={{ fontSize: 22 }}>🎯</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 11, color: c.textSecondary, fontWeight: '700', textTransform: 'uppercase' }}>Maior pontuador</Text>
            <Text style={{ fontSize: 15, fontWeight: '800', color: c.text }}>
              #{tops.scorer.player.number} {tops.scorer.player.name}
              <Text style={{ color: c.textMuted, fontWeight: '600' }}> · {tops.scorer.player.position}</Text>
            </Text>
          </View>
          <Text style={{ fontSize: 20, fontWeight: '900', color: c.primary }}>{tops.scorer.directPoints}</Text>
        </View>
      ) : null}
      {tops.server ? (
        <View style={styles.highlightCard}>
          <Text style={{ fontSize: 22 }}>🎾</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 11, color: c.textSecondary, fontWeight: '700', textTransform: 'uppercase' }}>Melhor sacador (aces)</Text>
            <Text style={{ fontSize: 15, fontWeight: '800', color: c.text }}>
              #{tops.server.player.number} {tops.server.player.name}
            </Text>
          </View>
          <Text style={{ fontSize: 20, fontWeight: '900', color: c.primary }}>{tops.server.stats.serves.ace}</Text>
        </View>
      ) : null}
      {tops.blocker ? (
        <View style={styles.highlightCard}>
          <Text style={{ fontSize: 22 }}>🛡️</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 11, color: c.textSecondary, fontWeight: '700', textTransform: 'uppercase' }}>Melhor bloqueador</Text>
            <Text style={{ fontSize: 15, fontWeight: '800', color: c.text }}>
              #{tops.blocker.player.number} {tops.blocker.player.name}
            </Text>
          </View>
          <Text style={{ fontSize: 20, fontWeight: '900', color: c.primary }}>{tops.blocker.stats.blocks.success}</Text>
        </View>
      ) : null}
      {tops.passer ? (
        <View style={styles.highlightCard}>
          <Text style={{ fontSize: 22 }}>✋</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 11, color: c.textSecondary, fontWeight: '700', textTransform: 'uppercase' }}>Melhor passador</Text>
            <Text style={{ fontSize: 15, fontWeight: '800', color: c.text }}>
              #{tops.passer.player.number} {tops.passer.player.name}
            </Text>
          </View>
          <Text style={{ fontSize: 20, fontWeight: '900', color: c.primary }}>{tops.passer.passPct.toFixed(0)}%</Text>
        </View>
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
          <View key={agg.player.number} style={styles.playerCard}>
            <View style={styles.playerHead}>
              <View style={styles.pBadge}>
                <Text style={styles.pBadgeTxt}>#{agg.player.number}</Text>
              </View>
              <Text style={{ fontSize: 14, fontWeight: '800', color: c.text }}>{agg.player.name}</Text>
              <Text style={{ fontSize: 11, color: c.textMuted }}>{agg.player.position}</Text>
              <View style={{ flex: 1 }} />
              <Text style={{ fontSize: 11, color: c.textSecondary }}>
                {agg.matchesPlayed} {agg.matchesPlayed === 1 ? 'jogo' : 'jogos'}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              <View style={styles.pChip}>
                <Text style={{ fontSize: 11 }}>
                  Ataque <Text style={{ color: pctColor(agg.attackPct, efficiencyThresholds.attack), fontWeight: '800' }}>{agg.attackPct.toFixed(0)}%</Text>
                </Text>
              </View>
              <View style={styles.pChip}>
                <Text style={{ fontSize: 11 }}>
                  Saque <Text style={{ color: pctColor(agg.servePct, efficiencyThresholds.serve), fontWeight: '800' }}>{agg.servePct.toFixed(0)}%</Text>
                </Text>
              </View>
              <View style={styles.pChip}>
                <Text style={{ fontSize: 11 }}>
                  Passe <Text style={{ color: pctColor(agg.passPct, efficiencyThresholds.pass), fontWeight: '800' }}>{agg.passPct.toFixed(0)}%</Text>
                </Text>
              </View>
              <View style={styles.pChip}>
                <Text style={{ fontSize: 11 }}>
                  Bloq <Text style={{ color: pctColor(agg.blockPct, efficiencyThresholds.block), fontWeight: '800' }}>{agg.blockPct.toFixed(0)}%</Text>
                </Text>
              </View>
              <View style={styles.pChip}>
                <Text style={{ fontSize: 11 }}>
                  Pontos <Text style={{ color: c.primary, fontWeight: '800' }}>{agg.directPoints}</Text>
                </Text>
              </View>
              <View style={styles.pChip}>
                <Text style={{ fontSize: 11 }}>
                  Aces <Text style={{ fontWeight: '800' }}>{agg.stats.serves.ace}</Text>
                </Text>
              </View>
              <View style={styles.pChip}>
                <Text style={{ fontSize: 11 }}>
                  Blocks <Text style={{ fontWeight: '800' }}>{agg.stats.blocks.success}</Text>
                </Text>
              </View>
            </View>
          </View>
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
          .map((m) => {
            const o = matchOutcome(m);
            const isFinished = m.status === 'finished';
            return (
              <Pressable
                key={m.id}
                style={styles.matchCard}
                onPress={() => nav.navigate('VolleyReports', { matchId: m.id })}
              >
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={{ fontSize: 14, fontWeight: '800', color: c.text }}>
                    vs {m.teamBName}
                  </Text>
                  <Text style={{ fontSize: 12, color: c.textSecondary }}>
                    {formatDateBR(m.date)} · {m.location}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ fontSize: 16, fontWeight: '900', color: c.text }}>
                    {o.setsA} x {o.setsB}
                  </Text>
                  <Text
                    style={{
                      fontSize: 10,
                      fontWeight: '700',
                      color: !isFinished ? c.warning : o.won ? c.success : c.danger,
                    }}
                  >
                    {!isFinished ? 'EM ANDAMENTO' : o.won ? 'VITÓRIA' : 'DERROTA'}
                  </Text>
                </View>
              </Pressable>
            );
          })
      )}

      <View style={{ height: spacing.xxl }} />
    </Screen>
  );
};
