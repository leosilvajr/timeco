import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  HtmlScreen,
  HtmlHeader,
  HtmlButton,
  webConfirm,
} from '../../components/web';
import { useThemedColors } from '../../store';
import {
  getVolleyMatch,
  subscribeVolleyMatch,
  performScoutAction,
  finishCurrentSet,
  undoLastPoint,
} from '../../services/volleyScoutService';
import { emptyPlayerStats } from '../../services/volleyStats';
import { toast } from '../../store/toastStore';
import { VolleyAction, VolleyMatch, VolleyPlayer, PlayerVolleyStats } from '../../types';
import type { VolleyStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<VolleyStackParamList, 'VolleyScout'>;
type Rt = RouteProp<VolleyStackParamList, 'VolleyScout'>;

type ActionKind = 'positive' | 'negative' | 'neutral';

interface ActionConfig {
  label: string;
  action: VolleyAction;
  kind: ActionKind;
  read: (s: PlayerVolleyStats) => number;
}

interface CardConfig {
  title: string;
  emoji: string;
  actions: ActionConfig[];
}

const CARDS: CardConfig[] = [
  {
    title: 'SAQUE',
    emoji: '🎾',
    actions: [
      { label: 'Certo', action: 'serve_success', kind: 'neutral', read: (s) => s.serves.success },
      { label: 'Erro', action: 'serve_error', kind: 'negative', read: (s) => s.serves.error },
      { label: 'Ace', action: 'ace', kind: 'positive', read: (s) => s.serves.ace },
    ],
  },
  {
    title: 'ATAQUE',
    emoji: '⚡',
    actions: [
      { label: 'Ponto', action: 'attack_point', kind: 'positive', read: (s) => s.attacks.success },
      { label: 'Normal', action: 'attack', kind: 'neutral', read: (s) => s.attacks.normal },
      { label: 'Erro', action: 'attack_error', kind: 'negative', read: (s) => s.attacks.error },
    ],
  },
  {
    title: 'PASSE',
    emoji: '✋',
    actions: [
      { label: 'A', action: 'pass_a', kind: 'positive', read: (s) => s.passes.a },
      { label: 'B', action: 'pass_b', kind: 'neutral', read: (s) => s.passes.b },
      { label: 'C', action: 'pass_c', kind: 'neutral', read: (s) => s.passes.c },
      { label: 'Erro', action: 'pass_error', kind: 'negative', read: (s) => s.passes.error },
    ],
  },
  {
    title: 'BLOQUEIO',
    emoji: '🛡️',
    actions: [
      { label: 'Sucesso', action: 'block_success', kind: 'positive', read: (s) => s.blocks.success },
      { label: 'Normal', action: 'block_normal', kind: 'neutral', read: (s) => s.blocks.normal },
      { label: 'Falha', action: 'block_error', kind: 'negative', read: (s) => s.blocks.error },
    ],
  },
  {
    title: 'LEVANTAMENTO',
    emoji: '🎯',
    actions: [
      { label: 'Certo', action: 'set_success', kind: 'positive', read: (s) => s.sets.success },
      { label: 'Erro', action: 'set_error', kind: 'negative', read: (s) => s.sets.error },
      { label: 'Ponta', action: 'set_ponta', kind: 'neutral', read: (s) => s.sets.ponta },
      { label: 'Saída', action: 'set_saida', kind: 'neutral', read: (s) => s.sets.saida },
      { label: 'Meio', action: 'set_meio', kind: 'neutral', read: (s) => s.sets.meio },
      { label: 'F.Meio', action: 'set_fundo_meio', kind: 'neutral', read: (s) => s.sets.fundo_meio },
      { label: 'F.Saída', action: 'set_fundo_saida', kind: 'neutral', read: (s) => s.sets.fundo_saida },
    ],
  },
];

export const VolleyScoutScreen: React.FC = () => {
  const c = useThemedColors();
  const nav = useNavigation<Nav>();
  const route = useRoute<Rt>();

  const [match, setMatch] = useState<VolleyMatch | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const m = await getVolleyMatch(route.params.matchId);
    setMatch(m);
    if (m && m.players.length > 0 && selectedPlayer === null) {
      setSelectedPlayer(m.players[0].number);
    }
  }, [route.params.matchId, selectedPlayer]);

  useEffect(() => {
    load();
    const unsub = subscribeVolleyMatch(route.params.matchId, (m) => {
      if (m) setMatch(m);
    });
    return () => unsub();
  }, [route.params.matchId]);

  const currentSet = match?.sets[match.currentSet - 1];
  const setsWonA = match?.sets.filter((s) => s.finished && s.scoreA > s.scoreB).length ?? 0;
  const setsWonB = match?.sets.filter((s) => s.finished && s.scoreB > s.scoreA).length ?? 0;

  const playerStats: PlayerVolleyStats = useMemo(() => {
    if (!currentSet || selectedPlayer === null) return emptyPlayerStats();
    return currentSet.playerStats[selectedPlayer] ?? emptyPlayerStats();
  }, [currentSet, selectedPlayer]);

  const handleAction = async (action: VolleyAction, delta: 1 | -1) => {
    if (busy || !match || selectedPlayer === null) return;
    setBusy(true);
    try {
      await performScoutAction(match, selectedPlayer, action, delta);
    } catch (e) {
      console.error('performScoutAction', e);
      toast.error('Erro ao registrar ação. Tente de novo.');
    } finally {
      setBusy(false);
    }
  };

  const onUndoLastPoint = async () => {
    if (!match) return;
    setBusy(true);
    try {
      await undoLastPoint(match);
      toast.info('Último ponto desfeito.');
    } catch (e) {
      console.error('undoLastPoint', e);
      toast.error('Erro ao desfazer ponto.');
    } finally {
      setBusy(false);
    }
  };

  const onCloseSet = async () => {
    if (!match || !currentSet || currentSet.finished) return;
    const proceed = await webConfirm({
      title: 'Encerrar set',
      message: 'Tem certeza que quer encerrar este set?',
    });
    if (!proceed) return;
    setBusy(true);
    try {
      await finishCurrentSet(match);
      toast.success('Set encerrado!');
      await load();
    } finally {
      setBusy(false);
    }
  };

  if (!match) {
    return (
      <HtmlScreen>
        <HtmlHeader title="Carregando..." onBack={() => nav.goBack()} />
      </HtmlScreen>
    );
  }

  const selectedPlayerObj: VolleyPlayer | undefined = match.players.find(
    (p) => p.number === selectedPlayer,
  );

  // Cores baseadas em ActionKind
  const colorFor = (kind: ActionKind) => {
    if (kind === 'positive') return c.success;
    if (kind === 'negative') return c.danger;
    return c.info;
  };

  return (
    <HtmlScreen maxWidth={1200}>
      <HtmlHeader
        title={`Set ${match.currentSet}`}
        subtitle={`${match.teamAName} vs ${match.teamBName}`}
        onBack={() => nav.goBack()}
      />

      {/* Scoreboard */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <div
          style={{
            flex: 1,
            padding: 16,
            border: `2px solid ${c.primary}`,
            background: c.surfaceVariant,
            borderRadius: 10,
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 700, color: c.textSecondary }}>
            {match.teamAName}
          </div>
          <div style={{ fontSize: 38, fontWeight: 900, color: c.text, lineHeight: 1.1 }}>
            {currentSet?.scoreA ?? 0}
          </div>
          <div style={{ fontSize: 11, color: c.textMuted, marginTop: 2 }}>Sets: {setsWonA}</div>
          {match.serveTeam === 'A' && !currentSet?.finished ? (
            <div style={{ fontSize: 10, fontWeight: 800, color: c.primary, marginTop: 2 }}>
              🎾 SAQUE
            </div>
          ) : null}
        </div>
        <div
          style={{
            flex: 1,
            padding: 16,
            border: `2px solid ${c.border}`,
            background: c.surface,
            borderRadius: 10,
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 700, color: c.textSecondary }}>
            {match.teamBName}
          </div>
          <div style={{ fontSize: 38, fontWeight: 900, color: c.text, lineHeight: 1.1 }}>
            {currentSet?.scoreB ?? 0}
          </div>
          <div style={{ fontSize: 11, color: c.textMuted, marginTop: 2 }}>Sets: {setsWonB}</div>
          {match.serveTeam === 'B' && !currentSet?.finished ? (
            <div style={{ fontSize: 10, fontWeight: 800, color: c.primary, marginTop: 2 }}>
              🎾 SAQUE
            </div>
          ) : null}
        </div>
      </div>

      {/* Tab navigator de jogadores */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          paddingBottom: 8,
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {match.players.map((p) => {
          const isSel = p.number === selectedPlayer;
          return (
            <button
              key={p.number}
              onClick={() => setSelectedPlayer(p.number)}
              style={{
                padding: '8px 12px',
                borderRadius: 999,
                background: isSel ? c.primary : c.surface,
                border: `2px solid ${isSel ? c.primary : c.border}`,
                color: isSel ? c.onPrimary : c.text,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                cursor: 'pointer',
                fontFamily: 'inherit',
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  background: isSel ? c.surface : c.primary,
                  color: isSel ? c.primary : c.onPrimary,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 900,
                  fontSize: 12,
                }}
              >
                {p.number}
              </span>
              <span style={{ fontSize: 13, fontWeight: 700 }}>
                {p.name.split(' ')[0].toUpperCase()}
              </span>
            </button>
          );
        })}
      </div>

      {/* Jogador selecionado */}
      {selectedPlayerObj ? (
        <div style={{ marginTop: 16, marginBottom: 8 }}>
          <div style={{ fontSize: 18, fontWeight: 900, color: c.text }}>
            #{selectedPlayerObj.number} {selectedPlayerObj.name}
          </div>
          <div style={{ fontSize: 13, color: c.textSecondary, marginTop: 2 }}>
            {selectedPlayerObj.position}
          </div>
        </div>
      ) : null}

      {/* Cards de ações — grid responsivo (1 col mobile, 2-3 cols desktop) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 12,
          marginTop: 12,
        }}
      >
        {CARDS.map((card) => (
          <div
            key={card.title}
            style={{
              background: c.surface,
              borderRadius: 16,
              border: `1px solid ${c.border}`,
              padding: 12,
            }}
          >
            <div
              style={{
                fontSize: 13,
                fontWeight: 800,
                color: c.textSecondary,
                textTransform: 'uppercase',
                letterSpacing: 0.6,
                marginBottom: 8,
                textAlign: 'center',
              }}
            >
              {card.emoji}  {card.title}
            </div>
            {card.actions.map((a) => {
              const count = a.read(playerStats);
              const labelBg = colorFor(a.kind);
              return (
                <div
                  key={a.action}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: 8,
                  }}
                >
                  <div
                    style={{
                      flex: 1,
                      padding: '10px 12px',
                      borderRadius: 10,
                      background: labelBg,
                      color: c.white,
                      fontSize: 14,
                      fontWeight: 800,
                      textAlign: 'center',
                    }}
                  >
                    {a.label}
                  </div>
                  <div
                    style={{
                      minWidth: 36,
                      fontSize: 18,
                      fontWeight: 900,
                      color: c.text,
                      textAlign: 'center',
                    }}
                  >
                    {count}
                  </div>
                  <button
                    onClick={() => handleAction(a.action, 1)}
                    disabled={busy}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 6,
                      background: c.success,
                      color: c.white,
                      border: 'none',
                      fontSize: 18,
                      fontWeight: 900,
                      cursor: busy ? 'wait' : 'pointer',
                      fontFamily: 'inherit',
                    }}
                  >
                    +
                  </button>
                  <button
                    onClick={() => handleAction(a.action, -1)}
                    disabled={busy || count === 0}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 6,
                      background: c.danger,
                      color: c.white,
                      border: 'none',
                      fontSize: 18,
                      fontWeight: 900,
                      cursor: busy || count === 0 ? 'not-allowed' : 'pointer',
                      opacity: count === 0 ? 0.4 : 1,
                      fontFamily: 'inherit',
                    }}
                  >
                    −
                  </button>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Footer actions */}
      <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
        <div style={{ flex: 1 }}>
          <HtmlButton title="↶ Desfazer ponto" variant="outline" onClick={onUndoLastPoint} />
        </div>
        {!currentSet?.finished ? (
          <div style={{ flex: 1 }}>
            <HtmlButton title="🏁 Encerrar set" variant="ghost" onClick={onCloseSet} />
          </div>
        ) : null}
      </div>

      <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <HtmlButton
          title="📊 Relatórios"
          variant="secondary"
          onClick={() => nav.navigate('VolleyReports', { matchId: match.id })}
        />
        <HtmlButton
          title="🔄 Rotação"
          variant="ghost"
          onClick={() => nav.navigate('VolleyRotation', { matchId: match.id })}
        />
      </div>

      <div style={{ height: 32 }} />
    </HtmlScreen>
  );
};
