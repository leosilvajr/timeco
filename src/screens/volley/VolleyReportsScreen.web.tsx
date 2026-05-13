import React, { useEffect, useMemo, useState } from 'react';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  Card,
  Group,
  Stack,
  Text,
  Badge,
  ScrollArea,
  SimpleGrid,
} from '@mantine/core';
import { HtmlScreen, HtmlHeader, HtmlCard, HtmlButton } from '../../components/web';
import { exportMatchReportPdf } from '../../services/volleyReportExport';
import { toast } from '../../store/toastStore';
import { useThemedColors } from '../../store';
import { subscribeVolleyMatch } from '../../services/volleyScoutService';
import {
  accumulateAcrossSets,
  emptyPlayerStats,
  teamSummary,
} from '../../services/volleyStats';
import { PlayerVolleyStats, VolleyMatch, VolleyPlayer } from '../../types';
import { PlayerDetailCard } from './components/reports/PlayerDetailCard.web';
import type { VolleyStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<VolleyStackParamList, 'VolleyReports'>;
type Rt = RouteProp<VolleyStackParamList, 'VolleyReports'>;

type Mode = 'all' | number;

// ============================================================================
// Componentes auxiliares
// ============================================================================

const TeamSummaryBlock: React.FC<{
  label: string;
  value: number | string;
  emoji: string;
  color: string;
}> = ({ label, value, emoji, color }) => (
  <Card withBorder radius="md" padding="md" style={{ textAlign: 'center' }}>
    <Text size="xl" style={{ marginBottom: 4 }}>
      {emoji}
    </Text>
    <Text size="28px" fw={900} style={{ color, lineHeight: 1.1 }}>
      {value}
    </Text>
    <Text size="xs" c="dimmed" fw={700} tt="uppercase" mt={4}>
      {label}
    </Text>
  </Card>
);

// ============================================================================
// Main screen
// ============================================================================

export const VolleyReportsScreen: React.FC = () => {
  const c = useThemedColors();
  const nav = useNavigation<Nav>();
  const route = useRoute<Rt>();
  const [match, setMatch] = useState<VolleyMatch | null>(null);
  const [mode, setMode] = useState<Mode | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<number | null>(null);

  useEffect(() => {
    const unsub = subscribeVolleyMatch(route.params.matchId, (m) => {
      setMatch(m);
      if (m && m.players.length > 0 && selectedPlayer === null) {
        setSelectedPlayer(m.players[0].number);
      }
      if (m && mode === null) {
        // Finalizada -> visao geral; em andamento -> set atual
        setMode(m.status === 'finished' ? 'all' : m.currentSet);
      }
    });
    return () => unsub();
  }, [route.params.matchId, selectedPlayer, mode]);

  const effectiveMode: Mode = mode ?? 'all';

  const playerStatsForMode = useMemo((): Record<number, PlayerVolleyStats> => {
    if (!match) return {};
    if (effectiveMode === 'all') {
      const result: Record<number, PlayerVolleyStats> = {};
      for (const p of match.players) {
        result[p.number] = accumulateAcrossSets(match.sets, p.number);
      }
      return result;
    }
    const set = match.sets.find((s) => s.number === effectiveMode);
    return set?.playerStats ?? {};
  }, [match, effectiveMode]);

  const summary = useMemo(() => teamSummary(playerStatsForMode), [playerStatsForMode]);

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

  const selectedPlayerObj = match.players.find((p) => p.number === selectedPlayer);
  const selectedPlayerStats =
    selectedPlayer !== null
      ? playerStatsForMode[selectedPlayer] ?? emptyPlayerStats()
      : emptyPlayerStats();

  return (
    <HtmlScreen maxWidth={1100}>
      <HtmlHeader
        title="Relatórios"
        subtitle={`${match.teamAName} vs ${match.teamBName}`}
        onBack={() => nav.goBack()}
      />

      {/* Match summary */}
      <HtmlCard>
        <Stack gap="xs" align="center">
          <Text size="xs" c="dimmed" fw={700} tt="uppercase">
            Resultado
          </Text>
          <Text size="32px" fw={900} style={{ color: c.text, lineHeight: 1 }}>
            {setsWonA} <span style={{ color: c.textMuted }}>×</span> {setsWonB}
          </Text>
          {winner ? (
            <Badge size="lg" color="timeco" variant="light" radius="md">
              🏆 {winner}
            </Badge>
          ) : (
            <Text size="sm" c="dimmed">
              Em andamento
            </Text>
          )}
        </Stack>

        {/* Tabela de sets compacta */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `auto ${'1fr '.repeat(match.sets.length)}`,
            gap: 4,
            fontSize: 13,
            marginTop: 16,
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

      {/* Filtros: Visao geral + um chip por set */}
      <Text size="xs" fw={800} c="dimmed" tt="uppercase" mb={6} style={{ letterSpacing: 0.6 }}>
        Filtrar por set
      </Text>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
        <button
          onClick={() => setMode('all')}
          style={{
            padding: '6px 14px',
            borderRadius: 999,
            border: `1.5px solid ${effectiveMode === 'all' ? c.primary : c.border}`,
            background: effectiveMode === 'all' ? c.primary : c.surface,
            color: effectiveMode === 'all' ? c.onPrimary : c.text,
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          📊 Visão geral
        </button>
        {match.sets.map((s) => {
          const active = effectiveMode === s.number;
          return (
            <button
              key={s.number}
              onClick={() => setMode(s.number)}
              style={{
                padding: '6px 14px',
                borderRadius: 999,
                border: `1.5px solid ${active ? c.primary : c.border}`,
                background: active ? c.primary : c.surface,
                color: active ? c.onPrimary : c.text,
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              Set {s.number}: {s.scoreA}x{s.scoreB} {s.finished ? '✓' : ''}
            </button>
          );
        })}
      </div>

      {/* Team summary cards */}
      <Text size="xs" fw={800} c="dimmed" tt="uppercase" mb={6} style={{ letterSpacing: 0.6 }}>
        Resumo do time — {effectiveMode === 'all' ? 'Visão geral' : `Set ${effectiveMode}`}
      </Text>
      <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="sm" mb="lg">
        <TeamSummaryBlock
          label="Pontos diretos"
          value={summary.totalPoints}
          emoji="🎯"
          color={c.success}
        />
        <TeamSummaryBlock
          label="Aces"
          value={summary.totalAces}
          emoji="🎾"
          color={c.warning}
        />
        <TeamSummaryBlock
          label="Bloqueios"
          value={summary.totalBlocks}
          emoji="🛡️"
          color={c.info}
        />
        <TeamSummaryBlock
          label="Erros"
          value={summary.totalErrors}
          emoji="❌"
          color={c.danger}
        />
      </SimpleGrid>

      {/* Análise individual — tabs limpas estilo pill + card completo */}
      <Text size="xs" fw={800} c="dimmed" tt="uppercase" mb={6} style={{ letterSpacing: 0.8 }}>
        Análise individual
      </Text>
      <div
        style={{
          display: 'flex',
          gap: 8,
          overflowX: 'auto',
          paddingBottom: 8,
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'thin',
        }}
      >
        {match.players.map((p) => {
          const isSel = p.number === selectedPlayer;
          return (
            <button
              key={p.number}
              onClick={() => setSelectedPlayer(p.number)}
              style={{
                padding: '8px 16px',
                height: 40,
                borderRadius: 999,
                background: isSel ? c.primary : c.surface,
                border: `1.5px solid ${isSel ? c.primary : c.border}`,
                color: isSel ? c.onPrimary : c.text,
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontSize: 14,
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                flexShrink: 0,
                transition: 'all 120ms ease',
              }}
            >
              <span
                style={{
                  opacity: isSel ? 0.85 : 0.55,
                  fontSize: 11,
                  fontWeight: 900,
                }}
              >
                #{p.number}
              </span>
              <span>{p.name.split(' ')[0]}</span>
            </button>
          );
        })}
      </div>

      {selectedPlayerObj ? (
        <div style={{ marginTop: 8 }}>
          <PlayerDetailCard player={selectedPlayerObj} stats={selectedPlayerStats} />
        </div>
      ) : null}

      {/* Export PDF — usa print dialog do browser (Save as PDF) */}
      <div style={{ marginTop: 16 }}>
        <HtmlButton
          title={match.status === 'finished' ? '📄 Exportar e compartilhar PDF' : '📄 Exportar PDF parcial'}
          variant="secondary"
          onClick={async () => {
            try {
              await exportMatchReportPdf(match);
            } catch (e) {
              console.error('export pdf', e);
              toast.error('Não foi possível gerar o PDF.');
            }
          }}
        />
      </div>

      <div style={{ height: 32 }} />
    </HtmlScreen>
  );
};
