import React, { useEffect, useState } from 'react';
import { HtmlButton } from './HtmlButton';
import { HtmlCard } from './HtmlCard';
import { HtmlInput } from './HtmlInput';
import { HtmlAvatar } from './HtmlAvatar';
import { useThemedColors } from '../../store';
import { getSport, SPORTS } from '../../constants/sports';
import { SportId, User } from '../../types';
import {
  isFutureDateTime,
  isValidTeamsCount,
  isValidPlayersPerTeam,
  TEAMS_COUNT_MIN,
  TEAMS_COUNT_MAX,
  PLAYERS_PER_TEAM_MIN,
  PLAYERS_PER_TEAM_MAX,
  MAX_TITLE_LEN,
  MAX_NOTES_LEN,
} from '../../utils/validators';

const pad = (n: number): string => String(n).padStart(2, '0');

const tomorrow19h = (): { date: string; time: string } => {
  const now = new Date();
  const t = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 19, 0, 0);
  return {
    date: `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())}`,
    time: `${pad(t.getHours())}:${pad(t.getMinutes())}`,
  };
};

export interface HtmlEventFormValues {
  title: string;
  sport: SportId;
  locationName: string;
  locationAddress: string;
  locationLat: number;
  locationLng: number;
  dateStr: string;
  timeStr: string;
  playersPerTeam: number;
  teamsCount: number;
  balanceByAge: boolean;
  balanceByHeight: boolean;
  balanceByWeight: boolean;
  invitedUserIds: string[];
  notes?: string;
}

export interface HtmlEventFormInitial {
  title?: string;
  sport?: SportId;
  locationName?: string;
  locationAddress?: string;
  locationLat?: number;
  locationLng?: number;
  dateStr?: string;
  timeStr?: string;
  playersPerTeam?: number;
  teamsCount?: number;
  balanceByAge?: boolean;
  balanceByHeight?: boolean;
  balanceByWeight?: boolean;
  invitedUserIds?: string[];
  notes?: string;
}

interface Props {
  submitLabel: string;
  syncSportDefaults?: boolean;
  initial?: HtmlEventFormInitial;
  friends: User[];
  submitting?: boolean;
  error?: string | null;
  onSubmit: (values: HtmlEventFormValues) => void | Promise<void>;
  onCancel?: () => void;
}

/** Form de criar/editar evento — versao web HTML pura. */
export const HtmlEventForm: React.FC<Props> = ({
  submitLabel,
  syncSportDefaults = false,
  initial = {},
  friends,
  submitting = false,
  error,
  onSubmit,
  onCancel,
}) => {
  const c = useThemedColors();
  const def = tomorrow19h();

  const [title, setTitle] = useState(initial.title ?? '');
  const [sport, setSport] = useState<SportId>(initial.sport ?? 'soccer');
  const [locationName, setLocationName] = useState(initial.locationName ?? '');
  const [locationAddress, setLocationAddress] = useState(initial.locationAddress ?? '');
  const [dateStr, setDateStr] = useState(initial.dateStr ?? def.date);
  const [timeStr, setTimeStr] = useState(initial.timeStr ?? def.time);
  const [playersPerTeam, setPlayersPerTeam] = useState(
    initial.playersPerTeam != null ? String(initial.playersPerTeam) : '5',
  );
  const [teamsCount, setTeamsCount] = useState(
    initial.teamsCount != null ? String(initial.teamsCount) : '2',
  );
  const [balanceByAge, setBalanceByAge] = useState(initial.balanceByAge ?? false);
  const [balanceByHeight, setBalanceByHeight] = useState(initial.balanceByHeight ?? false);
  const [balanceByWeight, setBalanceByWeight] = useState(initial.balanceByWeight ?? false);
  const [notes, setNotes] = useState(initial.notes ?? '');
  const [selected, setSelected] = useState<Set<string>>(new Set(initial.invitedUserIds ?? []));
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (!syncSportDefaults) return;
    const cfg = getSport(sport);
    setPlayersPerTeam(String(cfg.defaultPlayersPerTeam));
    setTeamsCount(String(cfg.defaultTeamsCount));
    setBalanceByAge(cfg.usesAgeBalance);
    setBalanceByHeight(cfg.usesHeightBalance);
    setBalanceByWeight(cfg.usesWeightBalance ?? false);
  }, [sport, syncSportDefaults]);

  const toggleFriend = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const handleSubmit = async () => {
    setValidationError(null);
    if (!title.trim()) return setValidationError('Informe um título pro evento.');
    if (title.trim().length > MAX_TITLE_LEN)
      return setValidationError(`O título pode ter no máximo ${MAX_TITLE_LEN} caracteres.`);
    if (!locationName.trim()) return setValidationError('Informe o local do evento.');
    if (!dateStr || !timeStr) return setValidationError('Informe a data e o horário.');
    const scheduledAt = new Date(`${dateStr}T${timeStr}:00`);
    if (Number.isNaN(scheduledAt.getTime()))
      return setValidationError('Data ou horário em formato inválido.');
    if (!isFutureDateTime(dateStr, timeStr))
      return setValidationError('A data e o horário precisam ser no futuro.');

    const playersPerTeamN = parseInt(playersPerTeam, 10);
    if (!isValidPlayersPerTeam(playersPerTeamN))
      return setValidationError(
        `Jogadores por time deve estar entre ${PLAYERS_PER_TEAM_MIN} e ${PLAYERS_PER_TEAM_MAX}.`,
      );

    const teamsCountN = parseInt(teamsCount, 10);
    if (!isValidTeamsCount(teamsCountN))
      return setValidationError(
        `Quantidade de times deve estar entre ${TEAMS_COUNT_MIN} e ${TEAMS_COUNT_MAX}.`,
      );

    if (notes.trim().length > MAX_NOTES_LEN)
      return setValidationError(`Observações pode ter no máximo ${MAX_NOTES_LEN} caracteres.`);

    await onSubmit({
      title: title.trim(),
      sport,
      locationName: locationName.trim(),
      locationAddress: locationAddress.trim() || locationName.trim(),
      locationLat: initial.locationLat ?? 0,
      locationLng: initial.locationLng ?? 0,
      dateStr,
      timeStr,
      playersPerTeam: playersPerTeamN,
      teamsCount: teamsCountN,
      balanceByAge,
      balanceByHeight,
      balanceByWeight,
      invitedUserIds: Array.from(selected),
      notes: notes.trim() || undefined,
    });
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 14,
    fontWeight: 700,
    color: c.text,
    marginBottom: 8,
    display: 'block',
  };

  const toggleStyle = (active: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 0',
    borderBottom: `1px solid ${c.border}`,
    cursor: 'pointer',
    background: 'transparent',
    border: 'none',
    width: '100%',
    fontFamily: 'inherit',
    color: c.text,
    fontSize: 14,
    fontWeight: 600,
    textAlign: 'left',
  });

  const switchTrackStyle = (on: boolean): React.CSSProperties => ({
    width: 40,
    height: 22,
    borderRadius: 11,
    background: on ? c.primary : c.border,
    position: 'relative',
    transition: 'background 0.2s',
    flexShrink: 0,
  });

  const switchThumbStyle = (on: boolean): React.CSSProperties => ({
    position: 'absolute',
    top: 2,
    left: on ? 20 : 2,
    width: 18,
    height: 18,
    borderRadius: 9,
    background: c.white,
    transition: 'left 0.2s',
  });

  return (
    <>
      {/* Esporte */}
      <label style={labelStyle}>Esporte</label>
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

      <HtmlInput
        label="Título do evento"
        value={title}
        onChange={setTitle}
        placeholder="Pelada de quarta"
      />

      <HtmlInput
        label="Local"
        value={locationName}
        onChange={setLocationName}
        placeholder="Quadra do bairro, arena, estabelecimento..."
      />
      <HtmlInput
        label="Endereço (opcional)"
        value={locationAddress}
        onChange={setLocationAddress}
        placeholder="Rua, número, bairro"
      />

      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Data</label>
          <input
            type="date"
            value={dateStr}
            onChange={(e) => setDateStr(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 14px',
              borderRadius: 10,
              border: `1px solid ${c.border}`,
              background: c.surface,
              color: c.text,
              fontSize: 15,
              fontFamily: 'inherit',
              boxSizing: 'border-box',
              marginBottom: 12,
            }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Horário</label>
          <input
            type="time"
            value={timeStr}
            onChange={(e) => setTimeStr(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 14px',
              borderRadius: 10,
              border: `1px solid ${c.border}`,
              background: c.surface,
              color: c.text,
              fontSize: 15,
              fontFamily: 'inherit',
              boxSizing: 'border-box',
              marginBottom: 12,
            }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <HtmlInput
            label="Jog./time"
            type="number"
            value={playersPerTeam}
            onChange={setPlayersPerTeam}
          />
        </div>
        <div style={{ flex: 1 }}>
          <HtmlInput
            label="Qtd. times"
            type="number"
            value={teamsCount}
            onChange={setTeamsCount}
          />
        </div>
      </div>

      <HtmlCard>
        <label style={labelStyle}>Equilibrar também por:</label>
        <button
          type="button"
          onClick={() => setBalanceByAge((v) => !v)}
          style={toggleStyle(balanceByAge)}
        >
          <span>👶 Idade</span>
          <span style={switchTrackStyle(balanceByAge)}>
            <span style={switchThumbStyle(balanceByAge)} />
          </span>
        </button>
        <button
          type="button"
          onClick={() => setBalanceByHeight((v) => !v)}
          style={toggleStyle(balanceByHeight)}
        >
          <span>📏 Altura</span>
          <span style={switchTrackStyle(balanceByHeight)}>
            <span style={switchThumbStyle(balanceByHeight)} />
          </span>
        </button>
        <button
          type="button"
          onClick={() => setBalanceByWeight((v) => !v)}
          style={{ ...toggleStyle(balanceByWeight), borderBottom: 'none' }}
        >
          <span>⚖️ Peso (privado)</span>
          <span style={switchTrackStyle(balanceByWeight)}>
            <span style={switchThumbStyle(balanceByWeight)} />
          </span>
        </button>
      </HtmlCard>

      <label style={labelStyle}>Convidados ({selected.size} selecionados)</label>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
        {friends.length === 0 ? (
          <p style={{ fontSize: 13, color: c.textSecondary, padding: '8px 0' }}>
            Você ainda não tem amigos. Adicione amigos para convidá-los.
          </p>
        ) : null}
        {friends.map((f) => {
          const sel = selected.has(f.id);
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => toggleFriend(f.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: 10,
                background: sel ? `${c.primary}22` : c.surface,
                border: `1.5px solid ${sel ? c.primary : c.border}`,
                borderRadius: 10,
                cursor: 'pointer',
                width: '100%',
                textAlign: 'left',
                fontFamily: 'inherit',
                color: 'inherit',
              }}
            >
              <HtmlAvatar name={f.name} photoURL={f.photoURL} size={36} />
              <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: c.text }}>
                {f.name}
              </span>
              {sel ? <span style={{ color: c.primary, fontSize: 18 }}>✓</span> : null}
            </button>
          );
        })}
      </div>

      <HtmlInput
        label="Observações (opcional)"
        value={notes}
        onChange={setNotes}
        multiline
        rows={3}
      />

      {error || validationError ? (
        <p style={{ color: c.danger, textAlign: 'center', marginBottom: 12 }}>
          {error || validationError}
        </p>
      ) : null}

      <HtmlButton title={submitLabel} onClick={handleSubmit} loading={submitting} />
      {onCancel ? (
        <div style={{ marginTop: 8 }}>
          <HtmlButton
            title="Cancelar"
            variant="ghost"
            onClick={onCancel}
            disabled={submitting}
          />
        </div>
      ) : null}
      <div style={{ height: 32 }} />
    </>
  );
};
