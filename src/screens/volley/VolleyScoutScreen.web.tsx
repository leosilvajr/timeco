import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Card, Stack, Text } from '@mantine/core';
import { HtmlScreen, HtmlHeader, HtmlButton, webConfirm } from '../../components/web';
import { useThemedColors } from '../../store';
import {
  getVolleyMatch,
  subscribeVolleyMatch,
  performScoutAction,
  finishCurrentSet,
  undoLastPoint,
  resetVolleyMatch,
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
      { label: 'A — Perfeito', action: 'pass_a', kind: 'positive', read: (s) => s.passes.a },
      { label: 'B — Bom', action: 'pass_b', kind: 'neutral', read: (s) => s.passes.b },
      { label: 'C — Mediano', action: 'pass_c', kind: 'neutral', read: (s) => s.passes.c },
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
  const [showHelp, setShowHelp] = useState(false);

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

  const onResetAll = async () => {
    if (!match) return;
    const proceed = await webConfirm({
      title: 'Zerar tudo',
      message:
        'Todos os sets, placares e estatísticas vão ser apagados. Essa ação não pode ser desfeita. Continuar?',
      confirmLabel: 'Zerar tudo',
      danger: true,
    });
    if (!proceed) return;
    setBusy(true);
    try {
      await resetVolleyMatch(match);
      toast.success('Tudo zerado! Partida começa do zero.');
      await load();
    } catch (e) {
      console.error('resetVolleyMatch', e);
      toast.error('Erro ao zerar partida.');
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

  // Cor pra cada kind
  const kindColors = (kind: ActionKind) => {
    if (kind === 'positive') return { bg: c.success, fg: c.white };
    if (kind === 'negative') return { bg: c.danger, fg: c.white };
    return { bg: c.info, fg: c.white };
  };
  const dotColor = (kind: ActionKind) => {
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

      {/* Scoreboard compacto e sticky no topo do scroll */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          background: c.background,
          marginLeft: -12,
          marginRight: -12,
          paddingLeft: 12,
          paddingRight: 12,
          paddingTop: 6,
          paddingBottom: 6,
          marginBottom: 8,
        }}
      >
        <div style={{ display: 'flex', gap: 8 }}>
          <div
            style={{
              flex: 1,
              background: c.surfaceVariant,
              border: `2px solid ${c.primary}`,
              borderRadius: 10,
              padding: '6px 8px',
              textAlign: 'center',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              minWidth: 0,
            }}
          >
            <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  color: c.textSecondary,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {match.teamAName}
              </div>
              <div style={{ fontSize: 10, color: c.textMuted, marginTop: 1 }}>
                Sets {setsWonA}
                {match.serveTeam === 'A' && !currentSet?.finished ? ' · 🎾' : ''}
              </div>
            </div>
            <div
              style={{
                fontSize: 24,
                fontWeight: 900,
                color: c.text,
                lineHeight: 1,
                minWidth: 30,
                textAlign: 'right',
              }}
            >
              {currentSet?.scoreA ?? 0}
            </div>
          </div>
          <div
            style={{
              flex: 1,
              background: c.surface,
              border: `2px solid ${c.border}`,
              borderRadius: 10,
              padding: '6px 8px',
              textAlign: 'center',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              minWidth: 0,
            }}
          >
            <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  color: c.textSecondary,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {match.teamBName}
              </div>
              <div style={{ fontSize: 10, color: c.textMuted, marginTop: 1 }}>
                Sets {setsWonB}
                {match.serveTeam === 'B' && !currentSet?.finished ? ' · 🎾' : ''}
              </div>
            </div>
            <div
              style={{
                fontSize: 24,
                fontWeight: 900,
                color: c.text,
                lineHeight: 1,
                minWidth: 30,
                textAlign: 'right',
              }}
            >
              {currentSet?.scoreB ?? 0}
            </div>
          </div>
        </div>
      </div>

      {/* Player tabs — pill flat */}
      <Text
        size="xs"
        fw={800}
        c="dimmed"
        tt="uppercase"
        mb={6}
        style={{ letterSpacing: 0.8 }}
      >
        Jogador
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

      {/* Player heading */}
      {selectedPlayerObj ? (
        <div style={{ marginTop: 8, marginBottom: 10 }}>
          <Text size="lg" fw={900} style={{ color: c.text }}>
            #{selectedPlayerObj.number} {selectedPlayerObj.name}
          </Text>
          <Text size="xs" c="dimmed" mt={2}>
            {selectedPlayerObj.position}
          </Text>
        </div>
      ) : null}

      {/* Painel Como funciona? — colapsavel */}
      <button
        onClick={() => setShowHelp((v) => !v)}
        style={{
          marginBottom: 8,
          padding: '8px 12px',
          borderRadius: 10,
          background: c.surfaceVariant,
          border: `1px dashed ${c.border}`,
          color: c.text,
          fontSize: 13,
          fontWeight: 700,
          cursor: 'pointer',
          fontFamily: 'inherit',
          textAlign: 'left',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
        aria-expanded={showHelp}
      >
        <span>{showHelp ? '▾' : '▸'}</span>
        <span>ℹ️ Como funciona o Scout?</span>
      </button>
      {showHelp ? (
        <Card
          withBorder
          radius="md"
          padding="md"
          mb={10}
          style={{ background: c.surface }}
        >
          <Text size="sm" style={{ color: c.text, lineHeight: 1.55 }}>
            <strong>Como usar:</strong> selecione o jogador no topo e use{' '}
            <strong>+</strong> pra registrar uma ação ou <strong>−</strong> pra
            desfazer. Quando a ação gera ponto, o placar e a rotação atualizam
            sozinhos. Cores: <span style={{ color: c.success, fontWeight: 700 }}>verde</span> =
            gera ponto, <span style={{ color: c.danger, fontWeight: 700 }}>vermelho</span> =
            entrega ponto, <span style={{ color: c.info, fontWeight: 700 }}>azul</span> =
            neutro (só estatística).
          </Text>

          <div style={{ height: 10 }} />

          <Text size="sm" fw={800} mb={4} style={{ color: c.text }}>
            🎾 SAQUE
          </Text>
          <Text size="sm" style={{ color: c.textSecondary, lineHeight: 1.55 }}>
            • <strong>Certo</strong>: saque dentro, adversário recebeu (sem impacto no placar).<br />
            • <strong>Erro</strong>: saque na rede ou fora → ponto pro adversário.<br />
            • <strong>Ace</strong>: saque direto, ninguém tocou ou caiu → ponto pra você.
          </Text>

          <div style={{ height: 8 }} />
          <Text size="sm" fw={800} mb={4} style={{ color: c.text }}>
            ⚡ ATAQUE
          </Text>
          <Text size="sm" style={{ color: c.textSecondary, lineHeight: 1.55 }}>
            • <strong>Ponto</strong>: ataque virou ponto direto → +1 pra você.<br />
            • <strong>Normal</strong>: ataque defendido, o rali continua.<br />
            • <strong>Erro</strong>: bola fora ou na rede → ponto pro adversário.
          </Text>

          <div style={{ height: 8 }} />
          <Text size="sm" fw={800} mb={4} style={{ color: c.text }}>
            ✋ PASSE
          </Text>
          <Text size="sm" style={{ color: c.textSecondary, lineHeight: 1.55 }}>
            Qualidade da recepção do saque adversário.<br />
            • <strong>A — Perfeito</strong>: levantador recebe no alvo, qualquer jogada possível.<br />
            • <strong>B — Bom</strong>: levantador trabalha confortável.<br />
            • <strong>C — Mediano</strong>: passe ruim, jogada limitada (geralmente bola alta).<br />
            • <strong>Erro</strong>: bola caiu ou foi direto pro adversário → ponto contra.
          </Text>

          <div style={{ height: 8 }} />
          <Text size="sm" fw={800} mb={4} style={{ color: c.text }}>
            🛡️ BLOQUEIO
          </Text>
          <Text size="sm" style={{ color: c.textSecondary, lineHeight: 1.55 }}>
            • <strong>Sucesso</strong>: bola morta na quadra adversária → +1 pra você.<br />
            • <strong>Normal</strong>: tocou e voltou pra sua defesa montar a jogada.<br />
            • <strong>Falha</strong>: bola caiu na sua quadra ou mãos fora → ponto contra.
          </Text>

          <div style={{ height: 8 }} />
          <Text size="sm" fw={800} mb={4} style={{ color: c.text }}>
            🎯 LEVANTAMENTO
          </Text>
          <Text size="sm" style={{ color: c.textSecondary, lineHeight: 1.55 }}>
            • <strong>Certo / Erro</strong>: avaliação geral do levantamento.<br />
            • <strong>Ponta / Saída / Meio / F.Meio / F.Saída</strong>: pra qual zona da rede
            a bola foi distribuída (estatística de distribuição do levantador).
          </Text>

          <div style={{ height: 10 }} />

          <Text size="sm" style={{ color: c.text, lineHeight: 1.55 }}>
            <strong>Botões do rodapé:</strong>
            <br />• <strong>↶ Desfazer ponto</strong> — reverte o último ponto registrado (placar + rotação).
            <br />• <strong>🏁 Encerrar set</strong> — fecha o set atual e abre o próximo.
            <br />• <strong>📊 Relatórios</strong> — estatísticas por jogador no set atual ou acumuladas.
            <br />• <strong>🔄 Rotação</strong> — visualiza/ajusta a rotação dos 6 jogadores em quadra.
            <br />• <strong>🗑️ Zerar tudo</strong> — apaga tudo e reinicia a partida do zero (não dá pra desfazer).
          </Text>
        </Card>
      ) : null}

      {/* Cards de ações — grid responsivo, mais compactos */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 10,
        }}
      >
        {CARDS.map((card) => (
          <Card
            key={card.title}
            withBorder
            radius="md"
            padding="sm"
            style={{ background: c.surface }}
          >
            <Text
              size="xs"
              fw={800}
              c="dimmed"
              tt="uppercase"
              mb={6}
              ta="center"
              style={{ letterSpacing: 0.8 }}
            >
              {card.emoji}  {card.title}
            </Text>
            <Stack gap={2}>
              {card.actions.map((a) => {
                const count = a.read(playerStats);
                const dot = dotColor(a.kind);
                const kColors = kindColors(a.kind);
                const hasValue = count > 0;
                return (
                  <div
                    key={a.action}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '2px 10px',
                      borderRadius: 8,
                      background: hasValue ? `${dot}12` : 'transparent',
                      transition: 'background 120ms ease',
                    }}
                  >
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 4,
                        background: dot,
                        flexShrink: 0,
                      }}
                    />
                    <span
                      style={{
                        flex: 1,
                        fontSize: 15,
                        fontWeight: 600,
                        color: c.text,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {a.label}
                    </span>
                    <span
                      style={{
                        minWidth: 28,
                        textAlign: 'center',
                        fontSize: 20,
                        fontWeight: 900,
                        color: hasValue ? c.text : c.textMuted,
                      }}
                    >
                      {count}
                    </span>
                    <button
                      onClick={() => handleAction(a.action, -1)}
                      disabled={busy || count === 0}
                      aria-label={`Decrementar ${a.label}`}
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: 6,
                        background: count === 0 ? c.surfaceVariant : c.border,
                        color: count === 0 ? c.textMuted : c.text,
                        border: 'none',
                        cursor: count === 0 ? 'not-allowed' : 'pointer',
                        fontSize: 18,
                        fontWeight: 900,
                        lineHeight: 1,
                        fontFamily: 'inherit',
                        flexShrink: 0,
                        transition: 'all 120ms ease',
                        opacity: busy ? 0.5 : 1,
                      }}
                    >
                      −
                    </button>
                    <button
                      onClick={() => handleAction(a.action, 1)}
                      disabled={busy}
                      aria-label={`Incrementar ${a.label}`}
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: 6,
                        background: kColors.bg,
                        color: kColors.fg,
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: 18,
                        fontWeight: 900,
                        lineHeight: 1,
                        fontFamily: 'inherit',
                        flexShrink: 0,
                        transition: 'all 120ms ease',
                        opacity: busy ? 0.5 : 1,
                      }}
                    >
                      +
                    </button>
                  </div>
                );
              })}
            </Stack>
          </Card>
        ))}
      </div>

      {/* Footer actions */}
      <Stack gap={8} mt="md">
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ flex: 1 }}>
            <HtmlButton title="↶ Desfazer ponto" variant="outline" onClick={onUndoLastPoint} />
          </div>
          {!currentSet?.finished ? (
            <div style={{ flex: 1 }}>
              <HtmlButton title="🏁 Encerrar set" variant="ghost" onClick={onCloseSet} />
            </div>
          ) : null}
        </div>
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
        <HtmlButton
          title="🗑️  Zerar tudo"
          variant="danger"
          onClick={onResetAll}
        />
      </Stack>

      <div style={{ height: 32 }} />
    </HtmlScreen>
  );
};
