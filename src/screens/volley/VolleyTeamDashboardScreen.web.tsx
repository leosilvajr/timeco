import React, { useCallback, useEffect, useState } from 'react';
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
        listUserVolleyMatches(user.id),
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

  const overview = teamOverview(matches);
  const aggregates = aggregatePlayerStats(matches, team.players);
  const tops = topPerformers(aggregates);
  const effs = teamEfficiencies(aggregates);

  const sectionTitle: React.CSSProperties = {
    fontSize: 12,
    fontWeight: 800,
    color: c.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    margin: '16px 0 8px',
  };

  const kpiCard = (label: string, value: string | number, sub?: string): React.ReactNode => (
    <div
      style={{
        background: c.surface,
        border: `1px solid ${c.border}`,
        borderRadius: 10,
        padding: 12,
        flex: 1,
        minWidth: 120,
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: 11, color: c.textSecondary, fontWeight: 700, textTransform: 'uppercase' }}>
        {label}
      </div>
      <div style={{ fontSize: 22, fontWeight: 900, color: c.text, marginTop: 4 }}>{value}</div>
      {sub ? <div style={{ fontSize: 11, color: c.textMuted, marginTop: 2 }}>{sub}</div> : null}
    </div>
  );

  const pctColor = (pct: number, threshold: number): string =>
    pct >= threshold ? c.success : pct >= threshold * 0.7 ? c.warning : c.danger;

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
        {kpiCard('Vitórias', overview.wins, `${overview.losses} derrotas`)}
        {kpiCard('Taxa', `${overview.winRate.toFixed(0)}%`, `${overview.finished} jogos`)}
        {kpiCard('Sets', `${overview.setsWon} - ${overview.setsLost}`)}
        {kpiCard('Pontos', `${overview.pointsScored}`, `${overview.pointsConceded} sofridos`)}
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
        {kpiCard('Ataque', `${effs.attackPct.toFixed(1)}%`, `${effs.totalAttacks} totais`)}
        {kpiCard('Saque', `${effs.servePct.toFixed(1)}%`, `${effs.totalServes} totais`)}
        {kpiCard('Passe', `${effs.passPct.toFixed(1)}%`, `${effs.totalPasses} totais`)}
        {kpiCard('Bloqueio', `${effs.blockPct.toFixed(1)}%`, `${effs.totalBlocks} totais`)}
      </div>

      {/* Destaques */}
      <div style={sectionTitle}>🏆 Destaques</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {tops.scorer ? (
          <div style={{ background: c.surface, border: `1px solid ${c.border}`, borderRadius: 10, padding: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 22 }}>🎯</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: c.textSecondary, fontWeight: 700, textTransform: 'uppercase' }}>Maior pontuador</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: c.text }}>
                #{tops.scorer.player.number} {tops.scorer.player.name} <span style={{ color: c.textMuted, fontWeight: 600 }}>· {tops.scorer.player.position}</span>
              </div>
            </div>
            <div style={{ fontSize: 20, fontWeight: 900, color: c.primary }}>{tops.scorer.directPoints}</div>
          </div>
        ) : null}
        {tops.server ? (
          <div style={{ background: c.surface, border: `1px solid ${c.border}`, borderRadius: 10, padding: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 22 }}>🎾</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: c.textSecondary, fontWeight: 700, textTransform: 'uppercase' }}>Melhor sacador (aces)</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: c.text }}>
                #{tops.server.player.number} {tops.server.player.name}
              </div>
            </div>
            <div style={{ fontSize: 20, fontWeight: 900, color: c.primary }}>{tops.server.stats.serves.ace}</div>
          </div>
        ) : null}
        {tops.blocker ? (
          <div style={{ background: c.surface, border: `1px solid ${c.border}`, borderRadius: 10, padding: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 22 }}>🛡️</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: c.textSecondary, fontWeight: 700, textTransform: 'uppercase' }}>Melhor bloqueador</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: c.text }}>
                #{tops.blocker.player.number} {tops.blocker.player.name}
              </div>
            </div>
            <div style={{ fontSize: 20, fontWeight: 900, color: c.primary }}>{tops.blocker.stats.blocks.success}</div>
          </div>
        ) : null}
        {tops.passer ? (
          <div style={{ background: c.surface, border: `1px solid ${c.border}`, borderRadius: 10, padding: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 22 }}>✋</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: c.textSecondary, fontWeight: 700, textTransform: 'uppercase' }}>Melhor passador (%A+B)</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: c.text }}>
                #{tops.passer.player.number} {tops.passer.player.name}
              </div>
            </div>
            <div style={{ fontSize: 20, fontWeight: 900, color: c.primary }}>{tops.passer.passPct.toFixed(0)}%</div>
          </div>
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
        <p style={{ color: c.textMuted, fontSize: 13 }}>
          Sem jogadores cadastrados.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {aggregates.map((agg) => (
            <div
              key={agg.player.number}
              style={{
                background: c.surface,
                border: `1px solid ${c.border}`,
                borderRadius: 10,
                padding: 10,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{
                  background: c.primary,
                  color: c.onPrimary,
                  fontSize: 11,
                  fontWeight: 900,
                  padding: '2px 8px',
                  borderRadius: 999,
                }}>
                  #{agg.player.number}
                </span>
                <span style={{ fontSize: 14, fontWeight: 800, color: c.text }}>{agg.player.name}</span>
                <span style={{ fontSize: 11, color: c.textMuted }}>{agg.player.position}</span>
                <span style={{ flex: 1 }} />
                <span style={{ fontSize: 11, color: c.textSecondary }}>
                  {agg.matchesPlayed} {agg.matchesPlayed === 1 ? 'jogo' : 'jogos'}
                </span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, fontSize: 11 }}>
                <span style={{ padding: '2px 8px', borderRadius: 6, background: c.surfaceVariant }}>
                  Ataque <strong style={{ color: pctColor(agg.attackPct, efficiencyThresholds.attack) }}>{agg.attackPct.toFixed(0)}%</strong>
                </span>
                <span style={{ padding: '2px 8px', borderRadius: 6, background: c.surfaceVariant }}>
                  Saque <strong style={{ color: pctColor(agg.servePct, efficiencyThresholds.serve) }}>{agg.servePct.toFixed(0)}%</strong>
                </span>
                <span style={{ padding: '2px 8px', borderRadius: 6, background: c.surfaceVariant }}>
                  Passe <strong style={{ color: pctColor(agg.passPct, efficiencyThresholds.pass) }}>{agg.passPct.toFixed(0)}%</strong>
                </span>
                <span style={{ padding: '2px 8px', borderRadius: 6, background: c.surfaceVariant }}>
                  Bloq <strong style={{ color: pctColor(agg.blockPct, efficiencyThresholds.block) }}>{agg.blockPct.toFixed(0)}%</strong>
                </span>
                <span style={{ padding: '2px 8px', borderRadius: 6, background: c.surfaceVariant }}>
                  Pontos <strong style={{ color: c.primary }}>{agg.directPoints}</strong>
                </span>
                <span style={{ padding: '2px 8px', borderRadius: 6, background: c.surfaceVariant }}>
                  Aces <strong>{agg.stats.serves.ace}</strong>
                </span>
                <span style={{ padding: '2px 8px', borderRadius: 6, background: c.surfaceVariant }}>
                  Blocks <strong>{agg.stats.blocks.success}</strong>
                </span>
              </div>
            </div>
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
          .map((m) => {
            const o = matchOutcome(m);
            const isFinished = m.status === 'finished';
            const isScheduled = m.status === 'scheduled';
            const statusLabel = isScheduled
              ? 'EM BREVE'
              : !isFinished
              ? 'EM ANDAMENTO'
              : o.won
              ? 'VITÓRIA'
              : 'DERROTA';
            const statusColor = isScheduled
              ? c.info
              : !isFinished
              ? c.warning
              : o.won
              ? c.success
              : c.danger;
            return (
              <div
                key={m.id}
                onClick={() => nav.navigate('VolleyReports', { matchId: m.id })}
                role="button"
                tabIndex={0}
                style={{
                  background: c.surface,
                  border: `1px solid ${c.border}`,
                  borderRadius: 10,
                  padding: 12,
                  marginBottom: 6,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: c.text }}>
                    vs {m.teamBName}
                  </div>
                  <div style={{ fontSize: 12, color: c.textSecondary }}>
                    {formatDateBR(m.date)} · {m.location}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 16, fontWeight: 900, color: c.text }}>
                    {o.setsA} x {o.setsB}
                  </div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: statusColor }}>
                    {statusLabel}
                  </div>
                </div>
              </div>
            );
          })
      )}

      <div style={{ height: 32 }} />
    </HtmlScreen>
  );
};
