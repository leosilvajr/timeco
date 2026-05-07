import React, { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  HtmlScreen,
  HtmlHeader,
  HtmlCard,
  HtmlButton,
  HtmlInput,
} from '../../components/web';
import { useThemedColors } from '../../store';
import { drawQuickTeams, QuickDrawnTeam, QuickPlayer } from '../../services/teamDrawService';
import { shareText } from '../../services/shareService';
import { formatQuickTeams } from '../../utils/teamShareText';
import { formatError } from '../../utils/errorMessages';
import { getSport, SPORTS } from '../../constants/sports';
import { SportId } from '../../types';
import type { EventsStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<EventsStackParamList, 'QuickDraw'>;

const tempId = (() => {
  let n = 0;
  return () => {
    n += 1;
    return `q${Date.now().toString(36)}_${n}`;
  };
})();

const StarPicker: React.FC<{ value: number; onChange?: (v: number) => void; size?: number }> = ({
  value,
  onChange,
  size = 26,
}) => {
  const c = useThemedColors();
  const editable = !!onChange;
  return (
    <span style={{ display: 'inline-flex', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          onClick={() => onChange?.(n)}
          disabled={!editable}
          style={{
            background: 'transparent',
            border: 'none',
            cursor: editable ? 'pointer' : 'default',
            padding: 0,
            fontSize: size,
            color: n <= value ? c.star : c.starEmpty,
            lineHeight: 1,
            fontFamily: 'inherit',
          }}
        >
          ★
        </button>
      ))}
    </span>
  );
};

export const QuickDrawScreen: React.FC = () => {
  const c = useThemedColors();
  const nav = useNavigation<Nav>();

  const [sport, setSport] = useState<SportId>('soccer');
  const [players, setPlayers] = useState<QuickPlayer[]>([]);
  const [pendingName, setPendingName] = useState('');
  const [pendingStars, setPendingStars] = useState(3);
  const [teamsCount, setTeamsCount] = useState(2);
  const [result, setResult] = useState<QuickDrawnTeam[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const addPlayer = () => {
    setError(null);
    const name = pendingName.trim();
    if (!name) return setError('Digite um nome antes de adicionar.');
    setPlayers((prev) => [...prev, { id: tempId(), name, stars: pendingStars }]);
    setPendingName('');
    setPendingStars(3);
  };

  const removePlayer = (id: string) => {
    setPlayers((prev) => prev.filter((p) => p.id !== id));
    setResult(null);
  };

  const updateStars = (id: string, stars: number) => {
    setPlayers((prev) => prev.map((p) => (p.id === id ? { ...p, stars } : p)));
    setResult(null);
  };

  const onDraw = () => {
    setError(null);
    if (teamsCount < 2) return setError('Você precisa de pelo menos 2 times.');
    if (players.length < teamsCount) {
      return setError(`Adicione pelo menos ${teamsCount} jogadores pra montar os times.`);
    }
    try {
      setResult(drawQuickTeams(players, teamsCount));
    } catch (e: unknown) {
      setError(formatError(e, 'Não conseguimos sortear os times agora. Tente de novo.'));
    }
  };

  const onClear = () => {
    if (!window.confirm('Limpar tudo e começar de novo?')) return;
    setPlayers([]);
    setResult(null);
    setError(null);
  };

  const onShare = () => {
    if (!result) return;
    const sportCfg = getSport(sport);
    const txt = formatQuickTeams(
      result.map((t) => ({
        name: t.name,
        players: t.players.map((p) => ({ name: p.name, stars: p.stars })),
        totalStars: t.totalStars,
      })),
      { sportEmoji: sportCfg.emoji, sportLabel: sportCfg.label },
    );
    shareText(txt, 'Sorteio rápido · Timeco');
  };

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
    <HtmlScreen maxWidth={720}>
      <HtmlHeader
        title="Sorteio rápido"
        subtitle="Sem cadastro · só para esta vez"
        onBack={() => nav.goBack()}
      />

      <HtmlCard style={{ background: c.surfaceVariant }}>
        <p style={{ fontSize: 13, color: c.text, lineHeight: 1.5, margin: 0 }}>
          🎲 Adicione os jogadores que estão na pelada agora, dê estrelas para cada um e sorteie os
          times. Nada é salvo — quando sair da tela, some.
        </p>
      </HtmlCard>

      <div style={sectionTitle}>Esporte</div>
      <select
        value={sport}
        onChange={(e) => setSport(e.target.value as SportId)}
        style={{
          width: '100%',
          padding: '12px 14px',
          borderRadius: 10,
          border: `1px solid ${c.border}`,
          background: c.surface,
          color: c.text,
          fontSize: 15,
          fontFamily: 'inherit',
          marginBottom: 12,
          boxSizing: 'border-box',
        }}
      >
        {SPORTS.map((s) => (
          <option key={s.id} value={s.id}>
            {s.emoji} {s.label}
          </option>
        ))}
      </select>

      <div style={sectionTitle}>Adicionar jogador</div>
      <HtmlCard>
        <HtmlInput
          label="Nome"
          value={pendingName}
          onChange={setPendingName}
          placeholder="Ex: João"
        />
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 8,
          }}
        >
          <span style={{ fontSize: 13, color: c.textSecondary, fontWeight: 600 }}>
            Estrelas (1 a 5)
          </span>
          <StarPicker value={pendingStars} onChange={setPendingStars} />
        </div>
        <HtmlButton title="+ Adicionar jogador" variant="secondary" onClick={addPlayer} />
      </HtmlCard>

      {players.length > 0 ? (
        <>
          <div style={sectionTitle}>Jogadores ({players.length})</div>
          <HtmlCard>
            {players.map((p) => (
              <div
                key={p.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '4px 0',
                }}
              >
                <span style={{ flex: 1, fontSize: 15, fontWeight: 700, color: c.text }}>
                  {p.name}
                </span>
                <StarPicker
                  value={p.stars}
                  onChange={(v) => updateStars(p.id, v)}
                  size={18}
                />
                <button
                  onClick={() => removePlayer(p.id)}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    background: c.surfaceVariant,
                    border: 'none',
                    color: c.danger,
                    fontWeight: 900,
                    fontSize: 14,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </HtmlCard>
        </>
      ) : null}

      <div style={sectionTitle}>Quantidade de times</div>
      <HtmlCard>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 0',
          }}
        >
          <span style={{ color: c.text, fontSize: 15, fontWeight: 600 }}>Times</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={() => setTeamsCount((n) => Math.max(2, n - 1))}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                background: c.surfaceVariant,
                border: 'none',
                color: c.primary,
                fontSize: 18,
                fontWeight: 900,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              −
            </button>
            <span
              style={{
                fontSize: 22,
                fontWeight: 900,
                color: c.text,
                minWidth: 28,
                textAlign: 'center',
              }}
            >
              {teamsCount}
            </span>
            <button
              onClick={() => setTeamsCount((n) => Math.min(8, n + 1))}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                background: c.surfaceVariant,
                border: 'none',
                color: c.primary,
                fontSize: 18,
                fontWeight: 900,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              +
            </button>
          </div>
        </div>
      </HtmlCard>

      {error ? (
        <p style={{ color: c.danger, margin: '12px 0', textAlign: 'center', fontWeight: 600 }}>
          {error}
        </p>
      ) : null}

      <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <HtmlButton title="🎲 Sortear times" onClick={onDraw} />
        <HtmlButton title="Cancelar" variant="ghost" onClick={() => nav.popToTop()} />
      </div>

      {result ? (
        <>
          <div style={sectionTitle}>Resultado</div>
          {result.map((t, idx) => (
            <div
              key={idx}
              style={{
                marginBottom: 12,
                border: `2px solid ${t.color}`,
                borderRadius: 16,
                overflow: 'hidden',
                background: c.surface,
              }}
            >
              <div style={{ padding: '12px 16px', background: t.color }}>
                <div style={{ color: c.white, fontSize: 17, fontWeight: 900 }}>{t.name}</div>
                <div style={{ color: c.white, opacity: 0.9, fontSize: 12, marginTop: 2 }}>
                  ⭐ {t.totalStars.toFixed(1)} • média{' '}
                  {(t.totalStars / Math.max(1, t.players.length)).toFixed(1)}
                </div>
              </div>
              <div style={{ padding: '8px 0' }}>
                {t.players.map((p) => (
                  <div
                    key={p.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '4px 16px',
                    }}
                  >
                    <span
                      style={{
                        flex: 1,
                        fontSize: 14,
                        fontWeight: 600,
                        color: c.text,
                      }}
                    >
                      {p.name}
                    </span>
                    <StarPicker value={p.stars} size={14} />
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <HtmlButton title="📲 Compartilhar times" variant="secondary" onClick={onShare} />
            <HtmlButton title="🎲 Sortear de novo" variant="outline" onClick={onDraw} />
            <HtmlButton title="🗑️ Limpar tudo" variant="ghost" onClick={onClear} />
          </div>
        </>
      ) : null}

      <div style={{ height: 32 }} />
    </HtmlScreen>
  );
};
