import React, { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  HtmlScreen,
  HtmlHeader,
  HtmlCard,
  HtmlInput,
  HtmlButton,
} from '../../components/web';
import { useThemedColors } from '../../store';
import { useScoreboardStore } from '../../store/scoreboardStore';
import { ScoreboardConfig } from '../../services/scoreboardLogic';
import type { ScoreboardStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<ScoreboardStackParamList, 'ScoreboardSetup'>;

interface Preset {
  id: string;
  emoji: string;
  label: string;
  desc: string;
  config: Omit<ScoreboardConfig, 'teamAName' | 'teamBName'>;
}

const PRESETS: Preset[] = [
  {
    id: 'volley_official',
    emoji: '🏐',
    label: 'Vôlei oficial',
    desc: 'Melhor de 5 sets · 25 pts (15 no decisivo) · vantagem 2',
    config: { pointsToWin: 25, winByTwo: true, bestOfSets: 5, finalSetPointsToWin: 15 },
  },
  {
    id: 'volley_amateur',
    emoji: '🏐',
    label: 'Vôlei amador',
    desc: 'Melhor de 3 sets · 25 pts · vantagem 2',
    config: { pointsToWin: 25, winByTwo: true, bestOfSets: 3, finalSetPointsToWin: 15 },
  },
  {
    id: 'tabletennis',
    emoji: '🏓',
    label: 'Tênis de mesa',
    desc: 'Melhor de 5 sets · 11 pts · vantagem 2',
    config: { pointsToWin: 11, winByTwo: true, bestOfSets: 5 },
  },
  {
    id: 'casual',
    emoji: '⚽',
    label: 'Pelada / Futebol',
    desc: '1 set · 10 pts · sem vantagem',
    config: { pointsToWin: 10, winByTwo: false, bestOfSets: 1 },
  },
  {
    id: 'beach',
    emoji: '🏖️',
    label: 'Vôlei de praia',
    desc: 'Melhor de 3 sets · 21 pts (15 no decisivo) · vantagem 2',
    config: { pointsToWin: 21, winByTwo: true, bestOfSets: 3, finalSetPointsToWin: 15 },
  },
  {
    id: 'truco',
    emoji: '🃏',
    label: 'Truco',
    desc: '1 partida · 12 pontos · sem vantagem',
    config: { pointsToWin: 12, winByTwo: false, bestOfSets: 1 },
  },
];

export const ScoreboardSetupScreen: React.FC = () => {
  const c = useThemedColors();
  const nav = useNavigation<Nav>();
  const init = useScoreboardStore((s) => s.init);

  const [teamAName, setTeamAName] = useState('Time 1');
  const [teamBName, setTeamBName] = useState('Time 2');
  const [presetId, setPresetId] = useState<string>('volley_amateur');
  const [pointsToWin, setPointsToWin] = useState('25');
  const [winByTwo, setWinByTwo] = useState(true);
  const [bestOfSets, setBestOfSets] = useState('3');
  const [finalSetPointsToWin, setFinalSetPointsToWin] = useState('15');

  const isCustom = presetId === 'custom';

  const onSelectPreset = (p: Preset) => {
    setPresetId(p.id);
    setPointsToWin(String(p.config.pointsToWin));
    setWinByTwo(p.config.winByTwo);
    setBestOfSets(String(p.config.bestOfSets));
    setFinalSetPointsToWin(String(p.config.finalSetPointsToWin ?? p.config.pointsToWin));
  };

  const onStart = () => {
    const selectedPreset = PRESETS.find((p) => p.id === presetId);
    const modalityLabel = isCustom ? 'Personalizado' : selectedPreset?.label;
    const config: ScoreboardConfig = {
      teamAName: teamAName.trim() || 'Time 1',
      teamBName: teamBName.trim() || 'Time 2',
      pointsToWin: parseInt(pointsToWin, 10) || 25,
      winByTwo,
      bestOfSets: parseInt(bestOfSets, 10) || 1,
      finalSetPointsToWin: finalSetPointsToWin ? parseInt(finalSetPointsToWin, 10) : undefined,
      modalityLabel,
    };
    init(config);
    nav.replace('ScoreboardLive');
  };

  const presetCard = (active: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    marginBottom: 8,
    borderRadius: 10,
    border: `1.5px solid ${active ? c.primary : c.border}`,
    background: active ? c.surfaceVariant : c.surface,
    width: '100%',
    textAlign: 'left',
    cursor: 'pointer',
    fontFamily: 'inherit',
    color: 'inherit',
  });

  const sectionTitle: React.CSSProperties = {
    fontSize: 12,
    fontWeight: 800,
    color: c.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: 16,
    marginBottom: 8,
  };

  return (
    <HtmlScreen maxWidth={680}>
      <HtmlHeader
        title="Placar eletrônico"
        subtitle="Configure a partida"
        onBack={() => nav.goBack()}
      />

      <HtmlCard style={{ background: c.surfaceVariant }}>
        <p style={{ fontSize: 14, color: c.text, lineHeight: 1.4, margin: 0 }}>
          🏆 Marque pontos durante o jogo. Os números ficam grandes e dá pra deixar o celular fixo
          no banco do reserva.
        </p>
      </HtmlCard>

      <div style={sectionTitle}>Times</div>
      <HtmlInput label="Time 1 (esquerda)" value={teamAName} onChange={setTeamAName} />
      <HtmlInput label="Time 2 (direita)" value={teamBName} onChange={setTeamBName} />

      <div style={sectionTitle}>Modalidade</div>
      {PRESETS.map((p) => (
        <button key={p.id} onClick={() => onSelectPreset(p)} style={presetCard(presetId === p.id)}>
          <span style={{ fontSize: 28, flexShrink: 0 }}>{p.emoji}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: c.text }}>{p.label}</div>
            <div style={{ fontSize: 12, color: c.textSecondary, marginTop: 2 }}>{p.desc}</div>
          </div>
        </button>
      ))}
      <button onClick={() => setPresetId('custom')} style={presetCard(isCustom)}>
        <span style={{ fontSize: 28, flexShrink: 0 }}>⚙️</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: c.text }}>Personalizado</div>
          <div style={{ fontSize: 12, color: c.textSecondary, marginTop: 2 }}>
            Configure manualmente abaixo
          </div>
        </div>
      </button>

      {isCustom ? (
        <HtmlCard>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <HtmlInput
                label="Pontos por set"
                type="number"
                value={pointsToWin}
                onChange={setPointsToWin}
              />
            </div>
            <div style={{ flex: 1 }}>
              <HtmlInput
                label="Melhor de N sets"
                type="number"
                value={bestOfSets}
                onChange={setBestOfSets}
              />
            </div>
          </div>
          <HtmlInput
            label="Pontos no set decisivo"
            type="number"
            value={finalSetPointsToWin}
            onChange={setFinalSetPointsToWin}
          />
          <button
            onClick={() => setWinByTwo((v) => !v)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 0',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              width: '100%',
              textAlign: 'left',
              fontFamily: 'inherit',
              color: 'inherit',
            }}
          >
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, color: c.text, fontWeight: 600 }}>
                Vencer por 2 pontos
              </div>
              <div style={{ fontSize: 12, color: c.textSecondary, marginTop: 2 }}>
                Se 24x24, joga até alguém abrir 2pt (regra clássica do vôlei)
              </div>
            </div>
            <span
              style={{
                width: 44,
                height: 26,
                borderRadius: 13,
                background: winByTwo ? c.primary : c.border,
                position: 'relative',
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  position: 'absolute',
                  top: 3,
                  left: winByTwo ? 21 : 3,
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  background: c.surface,
                  transition: 'left 0.2s',
                }}
              />
            </span>
          </button>
        </HtmlCard>
      ) : null}

      <div style={{ marginTop: 24, marginBottom: 32, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <HtmlButton title="🏁  Iniciar partida" onClick={onStart} />
        <HtmlButton title="Cancelar" variant="ghost" onClick={() => nav.goBack()} />
      </div>
    </HtmlScreen>
  );
};
