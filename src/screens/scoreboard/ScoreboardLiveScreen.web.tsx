import React from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { HtmlScreen, HtmlHeader, HtmlButton } from '../../components/web';
import { useThemedColors } from '../../store';
import { useScoreboardStore } from '../../store/scoreboardStore';
import type { ScoreboardStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<ScoreboardStackParamList, 'ScoreboardLive'>;

export const ScoreboardLiveScreen: React.FC = () => {
  const c = useThemedColors();
  const nav = useNavigation<Nav>();
  const state = useScoreboardStore((s) => s.state);
  const point = useScoreboardStore((s) => s.point);
  const undo = useScoreboardStore((s) => s.undo);
  const reset = useScoreboardStore((s) => s.reset);
  const swap = useScoreboardStore((s) => s.swap);
  const clear = useScoreboardStore((s) => s.clear);

  if (!state) {
    return (
      <HtmlScreen>
        <HtmlHeader title="Configure primeiro" onBack={() => nav.goBack()} />
        <HtmlButton title="Voltar e configurar" onClick={() => nav.replace('ScoreboardSetup')} />
      </HtmlScreen>
    );
  }

  const currentSet = state.sets[state.currentSetIndex];
  const setsWonA = state.sets.filter((s) => s.winner === 'A').length;
  const setsWonB = state.sets.filter((s) => s.winner === 'B').length;

  const teamColumn = (team: 'A' | 'B') => {
    const score = team === 'A' ? currentSet?.a ?? 0 : currentSet?.b ?? 0;
    const setsWon = team === 'A' ? setsWonA : setsWonB;
    const name = team === 'A' ? state.config.teamAName : state.config.teamBName;
    const isMine = team === 'A';
    return (
      <button
        onClick={() => point(team)}
        disabled={!!state.winner}
        style={{
          flex: 1,
          padding: 24,
          background: isMine ? c.primary : c.surface,
          color: isMine ? c.white : c.text,
          border: isMine ? 'none' : `2px solid ${c.border}`,
          borderRadius: 16,
          textAlign: 'center',
          cursor: state.winner ? 'default' : 'pointer',
          fontFamily: 'inherit',
          opacity: state.winner ? 0.6 : 1,
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 700, opacity: 0.9 }}>{name}</div>
        <div
          style={{
            fontSize: 96,
            fontWeight: 900,
            lineHeight: 1,
            margin: '16px 0',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {score}
        </div>
        <div style={{ fontSize: 12, opacity: 0.85 }}>Sets ganhos: {setsWon}</div>
      </button>
    );
  };

  return (
    <HtmlScreen maxWidth={1000}>
      <HtmlHeader
        title={state.config.modalityLabel ?? 'Placar'}
        subtitle={`Set ${state.currentSetIndex + 1} · até ${state.config.pointsToWin} pts`}
        onBack={() => nav.goBack()}
      />

      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>{teamColumn('A')}{teamColumn('B')}</div>

      {state.winner ? (
        <div
          style={{
            textAlign: 'center',
            padding: 16,
            marginBottom: 16,
            background: c.primary,
            color: c.white,
            borderRadius: 16,
            fontSize: 18,
            fontWeight: 800,
          }}
        >
          🏆 Vencedor:{' '}
          {state.winner === 'A' ? state.config.teamAName : state.config.teamBName}
        </div>
      ) : null}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <HtmlButton title="↩️ Desfazer último ponto" variant="outline" onClick={undo} />
        <HtmlButton title="🔄 Trocar lados" variant="outline" onClick={swap} />
        <HtmlButton title="♻️ Reiniciar partida" variant="ghost" onClick={reset} />
        <HtmlButton
          title="🆕 Nova partida"
          variant="ghost"
          onClick={() => {
            clear();
            nav.replace('ScoreboardSetup');
          }}
        />
      </div>
    </HtmlScreen>
  );
};
