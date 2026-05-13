import React, { useEffect, useState } from 'react';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  HtmlScreen,
  HtmlHeader,
  HtmlCard,
  HtmlInput,
  HtmlButton,
} from '../../components/web';
import { useAuthStore, useThemedColors } from '../../store';
import {
  createVolleyTeam,
  updateVolleyTeam,
  getVolleyTeam,
} from '../../services/volleyTeamService';
import { invalidateVolleyTeamsCache } from '../../services/volleyCacheService';
import { isValidJerseyNumber } from '../../utils/validators';
import { formatError } from '../../utils/errorMessages';
import { VolleyPlayer, VolleyPosition } from '../../types';
import { toast } from '../../store/toastStore';
import type { VolleyStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<VolleyStackParamList, 'VolleyTeamEdit'>;
type Rt = RouteProp<VolleyStackParamList, 'VolleyTeamEdit'>;

const POSITIONS: VolleyPosition[] = ['Oposto', 'Ponteiro', 'Central', 'Levantador', 'Líbero'];

export const VolleyTeamEditScreen: React.FC = () => {
  const c = useThemedColors();
  const nav = useNavigation<Nav>();
  const route = useRoute<Rt>();
  const user = useAuthStore((s) => s.user);
  const teamId = route.params?.teamId;
  const isEdit = !!teamId;

  const [name, setName] = useState('');
  const [players, setPlayers] = useState<VolleyPlayer[]>([]);
  const [pName, setPName] = useState('');
  const [pNumber, setPNumber] = useState('');
  const [pPosition, setPPosition] = useState<VolleyPosition>('Ponteiro');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!teamId) return;
    setLoading(true);
    getVolleyTeam(teamId)
      .then((team) => {
        if (team) {
          setName(team.name);
          setPlayers(team.players);
        }
      })
      .catch((e) => console.warn('getVolleyTeam', e))
      .finally(() => setLoading(false));
  }, [teamId]);

  const addPlayer = () => {
    setError(null);
    const pn = pName.trim();
    const num = parseInt(pNumber, 10);
    if (!pn) return setError('Digite o nome do jogador.');
    if (!isValidJerseyNumber(num))
      return setError('O número precisa ser inteiro entre 1 e 99.');
    if (players.some((p) => p.number === num))
      return setError(`Já existe um jogador com o número ${num}.`);
    setPlayers((prev) => [...prev, { name: pn, number: num, position: pPosition }]);
    setPName('');
    setPNumber('');
  };

  const removePlayer = (n: number) => setPlayers((prev) => prev.filter((p) => p.number !== n));

  const onSave = async () => {
    setError(null);
    if (!user) return;
    if (!name.trim()) return setError('Informe o nome do time.');
    if (players.length === 0) return setError('Cadastre pelo menos 1 jogador.');

    setSaving(true);
    try {
      const sorted = [...players].sort((a, b) => a.number - b.number);
      if (isEdit && teamId) {
        await updateVolleyTeam(teamId, { name: name.trim(), players: sorted });
        toast.success('Time atualizado!');
      } else {
        await createVolleyTeam({ ownerId: user.id, name: name.trim(), players: sorted });
        toast.success('Time criado!');
      }
      invalidateVolleyTeamsCache(user.id);
      nav.goBack();
    } catch (e: unknown) {
      setError(formatError(e, 'Não conseguimos salvar o time agora. Tente de novo.'));
    } finally {
      setSaving(false);
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

  const posBtn = (active: boolean): React.CSSProperties => ({
    flex: '1 1 31%',
    minHeight: 44,
    padding: '10px 12px',
    borderRadius: 10,
    border: `1.5px solid ${active ? c.primary : c.border}`,
    background: active ? c.primary : c.surface,
    color: active ? c.onPrimary : c.text,
    fontSize: 13,
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: 'inherit',
  });

  if (loading) {
    return (
      <HtmlScreen>
        <HtmlHeader title="Carregando..." onBack={() => nav.goBack()} />
      </HtmlScreen>
    );
  }

  return (
    <HtmlScreen maxWidth={760}>
      <HtmlHeader
        title={isEdit ? 'Editar time' : 'Novo time'}
        subtitle="Cadastre os jogadores fixos da sua equipe"
        onBack={() => nav.goBack()}
      />

      <HtmlInput
        label="Nome do time"
        value={name}
        onChange={setName}
        placeholder="Ex: Vôlei do Lucas"
      />

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
          style={{ fontSize: 14, fontWeight: 600, color: c.text, marginBottom: 6, marginTop: 4 }}
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
                    color: c.onPrimary,
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
        <HtmlButton
          title={isEdit ? 'Salvar alterações' : 'Criar time'}
          onClick={onSave}
          loading={saving}
        />
        <HtmlButton
          title="Cancelar"
          variant="ghost"
          onClick={() => nav.goBack()}
          disabled={saving}
        />
      </div>
    </HtmlScreen>
  );
};
