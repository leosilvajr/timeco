import React, { useCallback, useEffect, useState } from 'react';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  HtmlScreen,
  HtmlHeader,
  HtmlCard,
  HtmlInput,
  HtmlButton,
  HtmlEmpty,
} from '../../components/web';
import { useAuthStore, useThemedColors } from '../../store';
import { createVolleyMatch } from '../../services/volleyScoutService';
import {
  listUserVolleyTeamsCached,
  invalidateVolleyMatchesCache,
} from '../../services/volleyCacheService';
import { formatError } from '../../utils/errorMessages';
import { VolleyFormat, VolleyRotationSystem, VolleyTeam } from '../../types';
import { toast } from '../../store/toastStore';
import type { VolleyStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<VolleyStackParamList, 'VolleyMatchSetup'>;

const todayISO = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const VolleyMatchSetupScreen: React.FC = () => {
  const c = useThemedColors();
  const nav = useNavigation<Nav>();
  const user = useAuthStore((s) => s.user);

  const [date, setDate] = useState<string>(todayISO());
  const [location, setLocation] = useState('');
  const [teamBName, setTeamBName] = useState('');
  const [format, setFormat] = useState<VolleyFormat>(3);
  const [rotationSystem, setRotationSystem] = useState<VolleyRotationSystem>('5x1');
  const [showHelp, setShowHelp] = useState(false);

  const [myTeams, setMyTeams] = useState<VolleyTeam[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [loadingTeams, setLoadingTeams] = useState(true);

  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const loadTeams = useCallback(async () => {
    if (!user) return;
    setLoadingTeams(true);
    try {
      const list = await listUserVolleyTeamsCached(user.id);
      setMyTeams(list);
      if (list.length > 0 && !selectedTeamId) {
        setSelectedTeamId(list[0].id);
      }
    } catch (e) {
      console.warn('listUserVolleyTeams', e);
    } finally {
      setLoadingTeams(false);
    }
  }, [user, selectedTeamId]);

  useFocusEffect(
    useCallback(() => {
      loadTeams();
    }, [loadTeams]),
  );

  useEffect(() => {
    if (selectedTeamId && !myTeams.find((t) => t.id === selectedTeamId)) {
      setSelectedTeamId(null);
    }
  }, [myTeams, selectedTeamId]);

  const onCreate = async () => {
    setError(null);
    if (!user) return;
    if (!selectedTeamId) return setError('Selecione um time pra começar.');
    const team = myTeams.find((t) => t.id === selectedTeamId);
    if (!team) return setError('Time não encontrado. Tente recarregar.');
    if (!teamBName.trim()) return setError('Informe o nome do adversário.');
    if (!location.trim()) return setError('Informe o local da partida.');
    if (team.players.length === 0)
      return setError('O time selecionado não tem jogadores cadastrados.');

    setCreating(true);
    try {
      await createVolleyMatch({
        ownerId: user.id,
        date,
        location: location.trim(),
        teamAName: team.name,
        teamBName: teamBName.trim(),
        format,
        rotationSystem,
        players: [...team.players].sort((a, b) => a.number - b.number),
      });
      invalidateVolleyMatchesCache(user.id);
      toast.success('Partida criada! Acesse ela na lista quando for jogar.');
      // Volta pro VolleyHome — partida fica na lista pro user acessar
      // quando for o dia do jogo (ou a qualquer momento).
      nav.goBack();
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
    color: active ? c.onPrimary : c.text,
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
  });

  const teamCard = (active: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 10,
    border: `2px solid ${active ? c.primary : c.border}`,
    background: active ? c.surfaceVariant : c.surface,
    marginBottom: 8,
    cursor: 'pointer',
    width: '100%',
    textAlign: 'left',
    fontFamily: 'inherit',
    color: 'inherit',
  });

  return (
    <HtmlScreen maxWidth={840}>
      <HtmlHeader title="Nova partida" onBack={() => nav.goBack()} />

      {/* Painel Como funciona o Scout? — colapsavel */}
      <button
        onClick={() => setShowHelp((v) => !v)}
        style={{
          width: '100%',
          marginBottom: 8,
          padding: '10px 14px',
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
        <span>ℹ️ Como funciona o Scout? (leia antes de começar)</span>
      </button>
      {showHelp ? (
        <div
          style={{
            background: c.surface,
            border: `1px solid ${c.border}`,
            borderRadius: 10,
            padding: 14,
            marginBottom: 12,
            fontSize: 13,
            lineHeight: 1.55,
            color: c.text,
          }}
        >
          <p style={{ margin: 0 }}>
            <strong>Como usar:</strong> durante o jogo, selecione o jogador no
            topo da tela do Scout e use <strong>+</strong> pra registrar uma
            ação ou <strong>−</strong> pra desfazer. Quando a ação gera ponto, o
            placar e a rotação atualizam sozinhos. Cores:{' '}
            <span style={{ color: c.success, fontWeight: 700 }}>verde</span> =
            gera ponto,{' '}
            <span style={{ color: c.danger, fontWeight: 700 }}>vermelho</span> =
            entrega ponto, <span style={{ color: c.info, fontWeight: 700 }}>azul</span> =
            neutro (só estatística).
          </p>

          <p style={{ margin: '12px 0 4px', fontWeight: 800 }}>🎾 SAQUE</p>
          <p style={{ margin: 0, color: c.textSecondary }}>
            • <strong>Certo</strong>: saque dentro, adversário recebeu (sem impacto no placar).<br />
            • <strong>Erro</strong>: saque na rede ou fora → ponto pro adversário.<br />
            • <strong>Ace</strong>: saque direto, ninguém tocou ou caiu → ponto pra você.
          </p>

          <p style={{ margin: '10px 0 4px', fontWeight: 800 }}>⚡ ATAQUE</p>
          <p style={{ margin: 0, color: c.textSecondary }}>
            • <strong>Ponto</strong>: ataque virou ponto direto → +1 pra você.<br />
            • <strong>Normal</strong>: ataque defendido, o rali continua.<br />
            • <strong>Erro</strong>: bola fora ou na rede → ponto pro adversário.
          </p>

          <p style={{ margin: '10px 0 4px', fontWeight: 800 }}>✋ PASSE</p>
          <p style={{ margin: 0, color: c.textSecondary }}>
            Qualidade da recepção do saque adversário.<br />
            • <strong>A — Perfeito</strong>: levantador recebe no alvo, qualquer jogada possível.<br />
            • <strong>B — Bom</strong>: levantador trabalha confortável.<br />
            • <strong>C — Mediano</strong>: passe ruim, jogada limitada (geralmente bola alta).<br />
            • <strong>Erro</strong>: bola caiu ou foi direto pro adversário → ponto contra.
          </p>

          <p style={{ margin: '10px 0 4px', fontWeight: 800 }}>🛡️ BLOQUEIO</p>
          <p style={{ margin: 0, color: c.textSecondary }}>
            • <strong>Sucesso</strong>: bola morta na quadra adversária → +1 pra você.<br />
            • <strong>Normal</strong>: tocou e voltou pra sua defesa montar a jogada.<br />
            • <strong>Falha</strong>: bola caiu na sua quadra ou mãos fora → ponto contra.
          </p>

          <p style={{ margin: '10px 0 4px', fontWeight: 800 }}>🎯 LEVANTAMENTO</p>
          <p style={{ margin: 0, color: c.textSecondary }}>
            • <strong>Certo / Erro</strong>: avaliação geral do levantamento.<br />
            • <strong>Ponta / Saída / Meio / F.Meio / F.Saída</strong>: pra qual zona da rede
            a bola foi distribuída (estatística de distribuição do levantador).
          </p>

          <p style={{ margin: '12px 0 0' }}>
            <strong>Botões do rodapé do Scout:</strong>
            <br />• <strong>↶ Desfazer ponto</strong> — reverte o último ponto registrado (placar + rotação).
            <br />• <strong>🏁 Encerrar set</strong> — fecha o set atual e abre o próximo.
            <br />• <strong>📊 Relatórios</strong> — estatísticas por jogador no set atual ou acumuladas.
            <br />• <strong>🔄 Rotação</strong> — visualiza/ajusta a rotação dos 6 jogadores em quadra.
            <br />• <strong>🗑️ Zerar tudo</strong> — apaga tudo e reinicia a partida do zero (não dá pra desfazer).
          </p>
        </div>
      ) : null}

      {/* Time do user */}
      <div style={sectionTitle}>🏐 Seu time</div>
      {loadingTeams ? null : myTeams.length === 0 ? (
        <HtmlCard>
          <HtmlEmpty
            emoji="👥"
            title="Você não tem times cadastrados"
            subtitle="Cadastre seu time uma vez e reaproveite em todas as partidas."
          />
          <div style={{ marginTop: 12 }}>
            <HtmlButton
              title="+ Criar meu primeiro time"
              onClick={() => nav.navigate('VolleyTeamEdit')}
            />
          </div>
        </HtmlCard>
      ) : (
        <>
          {myTeams.map((team) => {
            const isSelected = selectedTeamId === team.id;
            return (
              <button
                key={team.id}
                onClick={() => setSelectedTeamId(team.id)}
                style={teamCard(isSelected)}
              >
                <span
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 11,
                    border: `2px solid ${isSelected ? c.primary : c.border}`,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {isSelected ? (
                    <span
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: 6,
                        background: c.primary,
                        display: 'inline-block',
                      }}
                    />
                  ) : null}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: c.text }}>{team.name}</div>
                  <div style={{ fontSize: 12, color: c.textSecondary, marginTop: 2 }}>
                    {team.players.length} jogador{team.players.length === 1 ? '' : 'es'}
                  </div>
                </div>
              </button>
            );
          })}
          <div style={{ marginTop: 4, marginBottom: 12 }}>
            <HtmlButton
              title="+ Adicionar novo time"
              variant="ghost"
              onClick={() => nav.navigate('VolleyTeamEdit')}
            />
          </div>
        </>
      )}

      {/* Adversario */}
      <div style={sectionTitle}>🆚 Adversário</div>
      <HtmlInput
        label="Nome da equipe adversária"
        value={teamBName}
        onChange={setTeamBName}
        placeholder="Ex: Time do João"
      />

      {/* Local */}
      <div style={sectionTitle}>📍 Local</div>
      <HtmlInput
        label="Local da partida"
        value={location}
        onChange={setLocation}
        placeholder="Ginásio ou quadra"
      />

      {/* Data */}
      <div style={sectionTitle}>📅 Data</div>
      <label
        style={{
          fontSize: 13,
          fontWeight: 700,
          marginBottom: 8,
          display: 'block',
          color: c.textSecondary,
        }}
      >
        Quando vai ser?
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

      {/* Formato */}
      <div style={sectionTitle}>🏆 Formato</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        {([3, 5] as VolleyFormat[]).map((f) => (
          <button key={f} onClick={() => setFormat(f)} style={chip(format === f)}>
            Melhor de {f}
          </button>
        ))}
      </div>

      {/* Rodizio */}
      <div style={sectionTitle}>🔄 Sistema de rodízio</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        {(['5x1', '4x2', '6x0'] as VolleyRotationSystem[]).map((r) => (
          <button key={r} onClick={() => setRotationSystem(r)} style={chip(rotationSystem === r)}>
            {r}
          </button>
        ))}
      </div>

      {error ? (
        <p style={{ color: c.danger, margin: '8px 0', textAlign: 'center' }}>{error}</p>
      ) : null}

      <div style={{ marginTop: 16, marginBottom: 32, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <HtmlButton title="🏐  Criar partida" onClick={onCreate} loading={creating} />
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
