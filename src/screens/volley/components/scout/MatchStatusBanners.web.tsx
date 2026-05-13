import React from 'react';
import { HtmlButton } from '../../../../components/web';
import { useThemedColors } from '../../../../store';
import { VolleyMatch } from '../../../../types';

interface Props {
  match: VolleyMatch;
  busy: boolean;
  onStartMatch: () => void;
}

/**
 * Banners no topo da tela Scout:
 * - 'scheduled' (Em breve): aviso + CTA Iniciar
 * - 'finished' (Finalizada): aviso de modo leitura
 * - 'in_progress': nao renderiza nada
 */
export const MatchStatusBanners: React.FC<Props> = ({ match, busy, onStartMatch }) => {
  const c = useThemedColors();

  if (match.status === 'scheduled') {
    return (
      <div
        style={{
          background: c.warning + '22',
          border: `2px solid ${c.warning}`,
          borderRadius: 10,
          padding: 14,
          marginBottom: 12,
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 800, color: c.warning, marginBottom: 6 }}>
          ⏳ PARTIDA AGENDADA
        </div>
        <div style={{ fontSize: 13, color: c.text, marginBottom: 10 }}>
          Essa partida está marcada pra{' '}
          <strong>{match.date.split('-').reverse().join('/')}</strong>. Você pode
          iniciar agora pra começar a registrar as ações.
        </div>
        <HtmlButton
          title="🏐 Iniciar partida agora"
          onClick={onStartMatch}
          loading={busy}
        />
      </div>
    );
  }

  if (match.status === 'finished') {
    return (
      <div
        style={{
          background: c.success + '22',
          border: `2px solid ${c.success}`,
          borderRadius: 10,
          padding: 12,
          marginBottom: 12,
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 800, color: c.success, marginBottom: 4 }}>
          🏁 PARTIDA FINALIZADA
        </div>
        <div style={{ fontSize: 12, color: c.textSecondary }}>
          Modo somente leitura. Os contadores não podem mais ser alterados. Acesse os{' '}
          <strong>Relatórios</strong> pra ver as estatísticas completas.
        </div>
      </div>
    );
  }

  return null;
};
