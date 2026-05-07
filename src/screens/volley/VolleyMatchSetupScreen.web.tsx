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
import { useAuthStore, useThemedColors } from '../../store';
import { createVolleyMatch } from '../../services/volleyScoutService';
import { formatError } from '../../utils/errorMessages';
import { isValidJerseyNumber } from '../../utils/validators';
import { VolleyFormat, VolleyPlayer, VolleyPosition, VolleyRotationSystem } from '../../types';
import type { VolleyStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<VolleyStackParamList, 'VolleyMatchSetup'>;

const POSITIONS: VolleyPosition[] = ['Oposto', 'Ponteiro', 'Central', 'Levantador', 'Líbero'];

const todayISO = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const VolleyMatchSetupScreen: React.FC = () => {
  const c = useThemedColors();
  const nav = useNavigation<Nav>();
  const user = useAuthStore((s) => s.user);

  const [date, setDate] = useState(todayISO());
  const [location, setLocation] = useState('');
  const [teamAName, setTeamAName] = useState('');
  const [teamBName, setTeamBName] = useState('');
  const [format, setFormat] = useState<VolleyFormat>(3);
  const [rotationSystem, setRotationSystem] = useState<VolleyRotationSystem>('5x1');

  const [players, setPlayers] = useState<VolleyPlayer[]>([]);
  const [pName, setPName] = useState('');
  const [pNumber, setPNumber] = useState('');
  const [pPosition, setPPosition] = useState<VolleyPosition>('Ponteiro');

  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const addPlayer = () => {
    setError(null);
    const name = pName.trim();
    const num = parseInt(pNumber, 10);
    if (!name) return setError('Digite o nome do jogador.');
    if (!isValidJerseyNumber(num)) return setError('O número precisa ser inteiro entre 1 e 99.');
    if (players.some((p) => p.number === num))
      return setError(`Já existe um jogador com o número ${num}.`);
    setPlayers((prev) => [...prev, { name, number: num, position: pPosition }]);
    setPName('');
    setPNumber('');
  };

  const removePlayer = (n: number) => setPlayers((prev) => prev.filter((p) => p.number !== n));

  const onCreate = async () => {
    setError(null);
    if (!user) return;
    if (!teamAName.trim() || !teamBName.trim())
      return setError('Informe o nome das duas equipes.');
    if (!location.trim()) return setError('Informe o local da partida.');
    if (players.length === 0) return setError('Cadastre pelo menos 1 jogador antes de iniciar.');
    setCreating(true);
    try {
      const id = await createVolleyMatch({
        ownerId: user.id,
        date,
        location: location.trim(),
        teamAName: teamAName.trim(),
        teamBName: teamBName.trim(),
        format,
        rotationSystem,
        players: players.sort((a, b) => a.number - b.number),
      });
      nav.replace('VolleyScout', { matchId: id });
    } catch (e: unknown) {
      setError(formatError(e, 'Não conseguimos criar a partida agora. Tente de novo.'));
    } finally {
      setCreating(false);
    }
  };

  const sectionTitle: React.CSSProperties = {
    fontSize: 14,
    fontWeight: 800,
    color: c.text,
    margin: '8px 0',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  };

  const chip = (active: boolean): React.CSSProperties => ({
    padding: '8px 14px',
    borderRadius: 999,
    border: `1.5px solid ${active ? c.primary : c.border}`,
    background: active ? c.primary : c.surface,
    color: active ? c.white : c.text,
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
  });

  const posBtn = (active: boolean): React.CSSProperties => ({
    flex: '1 1 31%',
    minHeight: 44,
    padding: '10px 12px',
    borderRadius: 10,
    border: `1.5px solid ${active ? c.primary : c.border}`,
    background: active ? c.primary : c.surface,
    color: active ? c.white : c.text,
    fontSize: 13,
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: 'inherit',
  });

  return (
    <HtmlScreen maxWidth={840}>
      <HtmlHeader title="Nova partida" onBack={() => nav.goBack()} />

      <div style={sectionTitle}>📋 Informações do jogo</div>
      <label style={{ fontSize: 14, fontWeight: 700, color: c.text, marginBottom: 8, display: 'block' }}>
        Data
      </label>
      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        style={{
          width: '100%',
          padding: '12px 14px',
          borderRadius: 10,
          border: `1px solid ${c.border}`,
          background: c.surface,
          color: c.text,
          fontSize: 15,
          marginBottom: 12,
          boxSizing: 'border-box',
          fontFamily: 'inherit',
        }}
      />
      <HtmlInput label="Local" value={location} onChange={setLocation} placeholder="Ginásio ou quadra" />
      <HtmlInput label="Sua equipe" value={teamAName} onChange={setTeamAName} placeholder="Ex: Vôlei do Lucas" />
      <HtmlInput
        label="Equipe adversária"
        value={teamBName}
        onChange={setTeamBName}
        placeholder="Nome da equipe B"
      />

      <div style={sectionTitle}>🏆 Formato</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        {([3, 5] as VolleyFormat[]).map((f) => (
          <button key={f} onClick={() => setFormat(f)} style={chip(format === f)}>
            Melhor de {f}
          </button>
        ))}
      </div>

      <div style={sectionTitle}>🔄 Sistema de rodízio</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        {(['5x1', '4x2', '6x0'] as VolleyRotationSystem[]).map((r) => (
          <button key={r} onClick={() => setRotationSystem(r)} style={chip(rotationSystem === r)}>
            {r}
          </button>
        ))}
      </div>

      <div style={sectionTitle}>👥 Jogadores ({players.length})</div>
      <HtmlCard>
        <HtmlInput label="Nome" value={pName} onChange={setPName} placeholder="Nome do jogador" />
        <HtmlInput
          label="Número"
          type="number"
          value={pNumber}
          onChange={setPNumber}
          placeholder="1-99"
        />
        <div
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: c.text,
            marginBottom: 6,
            marginTop: 4,
          }}
        >
          Posição
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
          {POSITIONS.map((p) => (
            <button key={p} onClick={() => setPPosition(p)} style={posBtn(pPosition === p)}>
              {p}
            </button>
          ))}
        </div>
        <div style={{ height: 8 }} />
        <HtmlButton title="Adicionar jogador" variant="outline" onClick={addPlayer} />
      </HtmlCard>

      {players.length > 0 ? (
        <HtmlCard>
          {players
            .slice()
            .sort((a, b) => a.number - b.number)
            .map((p) => (
              <div
                key={p.number}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '8px 0',
                  borderBottom: `1px solid ${c.border}`,
                }}
              >
                <span
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    background: c.primary,
                    color: c.white,
                    fontWeight: 900,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {p.number}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: c.text }}>{p.name}</div>
                  <div style={{ fontSize: 12, color: c.textSecondary }}>{p.position}</div>
                </div>
                <button
                  onClick={() => removePlayer(p.number)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: c.danger,
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    fontSize: 14,
                  }}
                >
                  Remover
                </button>
              </div>
            ))}
        </HtmlCard>
      ) : null}

      {error ? (
        <p style={{ color: c.danger, margin: '8px 0', textAlign: 'center' }}>{error}</p>
      ) : null}

      <div style={{ marginTop: 16, marginBottom: 32, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <HtmlButton title="🏐  Iniciar partida" onClick={onCreate} loading={creating} />
        <HtmlButton
          title="Cancelar"
          variant="ghost"
          onClick={() => nav.goBack()}
          disabled={creating}
        />
      </div>
    </HtmlScreen>
  );
};
