import React, { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { HtmlScreen, HtmlHeader, HtmlCard } from '../../components/web';
import { useThemedColors } from '../../store';
import type { ProfileStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<ProfileStackParamList, 'HelpHome'>;

interface HelpTopic {
  emoji: string;
  title: string;
  summary: string;
  steps: string[];
}

const TOPICS: HelpTopic[] = [
  {
    emoji: '👤',
    title: 'Completar seu cadastro',
    summary: 'Quanto mais campos preenchidos, melhores os sorteios.',
    steps: [
      'Vá em Perfil → Editar meus dados.',
      'Adicione foto, data de nascimento, altura e peso (peso é privado).',
      'O peso só é usado em cálculos internos de sorteio em esportes de contato e nunca aparece no perfil público.',
      'A barra de progresso mostra quanto falta.',
    ],
  },
  {
    emoji: '👥',
    title: 'Adicionar amigos',
    summary: 'Só amigos aparecem nos seus jogos.',
    steps: [
      'Aba Social → toque em "+" no canto superior direito.',
      'Busque por nome ou email exato.',
      'Envie a solicitação. A pessoa recebe notificação para aceitar.',
      'Quando aceito, vocês aparecem na lista de amigos um do outro e podem trocar mensagens no chat.',
    ],
  },
  {
    emoji: '🏟️',
    title: 'Criar um evento',
    summary: 'Marque uma partida e convide seus amigos.',
    steps: [
      'Aba Jogos → "+" no canto superior direito.',
      'Escolha o esporte, título, local, data e horário.',
      'Convide os amigos selecionando da lista.',
      'Cada convidado recebe notificação. Você pode editar o evento depois.',
    ],
  },
  {
    emoji: '🎲',
    title: 'Sorteio inteligente de times',
    summary: 'Times equilibrados automaticamente por estrelas, idade, altura e peso.',
    steps: [
      'No detalhe do evento → "Definir estrelas e sortear times".',
      'Atribua de 1 a 5 estrelas para cada jogador (apenas você como organizador define).',
      'O sistema usa estrelas como critério principal e ajusta levemente por altura/idade/peso.',
      'O algoritmo distribui em "snake-draft" (serpentina) pra balancear o total.',
    ],
  },
  {
    emoji: '✏️',
    title: 'Editar ou cancelar evento',
    summary: 'Apenas o organizador pode mexer.',
    steps: [
      'Detalhe do evento → "Editar evento".',
      'Cancelar deixa o evento marcado como cancelado para todos os convidados.',
      'Excluir apaga permanentemente.',
    ],
  },
  {
    emoji: '📸',
    title: 'Galeria de fotos',
    summary: 'Compartilhe momentos da partida.',
    steps: [
      'Detalhe do evento → seção Galeria → toque em "+ Foto".',
      'Apenas participantes do evento podem subir e ver as fotos.',
      'Suas fotos enviadas aparecem agregadas no seu perfil público.',
      'Você pode apagar qualquer foto que enviou; o organizador pode apagar qualquer foto.',
    ],
  },
  {
    emoji: '💬',
    title: 'Conversar com amigos',
    summary: 'Chat direto dentro do app.',
    steps: [
      'Aba Social → toque em um amigo → "Conversar".',
      'Mensagens em tempo real, com notificações quando o app está fechado (no web).',
    ],
  },
  {
    emoji: '🔔',
    title: 'Notificações',
    summary: 'Avisos de convites, mensagens e atualizações.',
    steps: [
      'No web, dê permissão para receber push notifications quando o app pedir.',
      'Veja todas em Perfil → Notificações.',
      'O badge no menu mostra quantas estão sem ler.',
    ],
  },
  {
    emoji: '🔒',
    title: 'Privacidade',
    summary: 'Controle quem vê o quê.',
    steps: [
      'Configurações → Visibilidade do perfil.',
      'Perfil público: qualquer usuário do app vê seus dados.',
      'Perfil privado: estranhos só veem nome e foto. Amigos sempre veem tudo.',
      'Galeria pode ter privacidade independente do perfil.',
    ],
  },
  {
    emoji: '🎨',
    title: 'Modo claro / escuro',
    summary: 'Adapta ao seu gosto ou ao tema do sistema.',
    steps: [
      'Configurações → Modo claro / escuro.',
      'Sistema: segue o que o celular ou navegador estão usando.',
      'Manual: força claro ou escuro.',
      'A preferência é salva no dispositivo.',
    ],
  },
];

export const HelpHomeScreen: React.FC = () => {
  const c = useThemedColors();
  const nav = useNavigation<Nav>();
  const [expandedIdx, setExpandedIdx] = useState<number | null>(0);

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
    <HtmlScreen maxWidth={760}>
      <HtmlHeader
        title="Ajuda"
        subtitle="Como usar cada recurso do Timeco"
        onBack={() => nav.goBack()}
      />

      <div
        style={{
          background: c.surfaceVariant,
          padding: 12,
          borderRadius: 10,
          marginBottom: 12,
        }}
      >
        <p style={{ fontSize: 14, color: c.text, lineHeight: 1.5, margin: 0 }}>
          📚 Toque em um tópico abaixo pra expandir o passo a passo. Se ainda restar dúvida, fale
          direto com a Incrivia pelo WhatsApp.
        </p>
      </div>

      <div style={sectionTitle}>Recursos do app</div>
      {TOPICS.map((t, i) => {
        const expanded = expandedIdx === i;
        return (
          <div
            key={i}
            style={{
              background: c.surface,
              border: `1px solid ${c.border}`,
              borderRadius: 16,
              marginBottom: 8,
              overflow: 'hidden',
            }}
          >
            <button
              onClick={() => setExpandedIdx(expanded ? null : i)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: 12,
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                width: '100%',
                textAlign: 'left',
                fontFamily: 'inherit',
                color: 'inherit',
              }}
            >
              <span style={{ fontSize: 26, flexShrink: 0 }}>{t.emoji}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: c.text }}>{t.title}</div>
                <div
                  style={{
                    fontSize: 12,
                    color: c.textSecondary,
                    marginTop: 2,
                    lineHeight: 1.4,
                  }}
                >
                  {t.summary}
                </div>
              </div>
              <span style={{ fontSize: 22, color: c.textMuted }}>{expanded ? '▴' : '▾'}</span>
            </button>
            {expanded ? (
              <div
                style={{
                  padding: '12px 12px 12px 12px',
                  borderTop: `1px solid ${c.border}`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                {t.steps.map((step, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    <span
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 11,
                        background: c.primary,
                        color: c.white,
                        fontSize: 11,
                        fontWeight: 900,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {idx + 1}
                    </span>
                    <span style={{ flex: 1, fontSize: 13, color: c.text, lineHeight: 1.4 }}>
                      {step}
                    </span>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        );
      })}

      <div style={sectionTitle}>Ainda com dúvida?</div>
      <HtmlCard>
        <p style={{ fontSize: 13, color: c.textSecondary, lineHeight: 1.4, margin: 0 }}>
          Suporte, dúvidas, reclamações e sugestões: fale direto com a Incrivia pelo WhatsApp.
        </p>
        <a
          href={`https://wa.me/5517992850093?text=${encodeURIComponent('Olá! Preciso de ajuda com o Timeco.')}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: 12,
            borderRadius: 10,
            background: '#25D366',
            marginTop: 8,
            textDecoration: 'none',
          }}
        >
          <span style={{ fontSize: 22 }}>💬</span>
          <span style={{ flex: 1, fontSize: 14, fontWeight: 800, color: c.white }}>
            Falar com o suporte Incrivia
          </span>
          <span style={{ fontSize: 22, color: c.white }}>›</span>
        </a>
      </HtmlCard>
    </HtmlScreen>
  );
};
