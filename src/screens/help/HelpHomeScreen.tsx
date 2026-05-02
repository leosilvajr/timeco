import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Linking } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen, Header, Card } from '../../components';
import { colors, spacing, radius } from '../../constants/theme';
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
      'Escolha o esporte, título, local (com busca no Google Maps), data e horário.',
      'Convide os amigos selecionando da lista (com busca + paginação).',
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
      'O sistema usa estrelas como critério principal e ajusta levemente por altura/idade/peso quando o esporte considera (ex: vôlei usa altura, futebol usa idade e peso).',
      'O algoritmo distribui em "snake-draft" (serpentina) pra balancear o total.',
    ],
  },
  {
    emoji: '✏️',
    title: 'Editar ou cancelar evento',
    summary: 'Apenas o organizador pode mexer.',
    steps: [
      'Detalhe do evento → "Editar evento" (você ajusta nome, data, local, convidados).',
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
      'Suas fotos enviadas aparecem agregadas no seu perfil público (se a galeria estiver pública).',
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
    emoji: '🏆',
    title: 'Placar eletrônico (utilitário)',
    summary: 'Marcador digital pra usar durante o jogo.',
    steps: [
      'Início → Utilitários → "Placar eletrônico".',
      'Escolha um preset (vôlei oficial, amador, tênis de mesa...) ou personalize.',
      'Os números ficam gigantes na tela. Toque em + e − pra cada lado.',
      'Suporta sets, regra de vantagem 2, set decisivo, undo, swap (trocar lados) e reset.',
    ],
  },
  {
    emoji: '🏐',
    title: 'Vôlei avançado · Scout (utilitário)',
    summary: 'Para quem joga vôlei a sério: estatísticas profissionais.',
    steps: [
      'Início → Utilitários → "Vôlei avançado · Scout".',
      'Cadastre os jogadores com nome, número e posição.',
      'Durante o jogo, toque nas ações: saque, ataque, passe, bloqueio, levantamento.',
      'Veja relatórios detalhados com eficiência por jogador e por set.',
    ],
  },
  {
    emoji: '📜',
    title: 'Histórico de partidas',
    summary: 'Veja eventos antigos e times sorteados.',
    steps: [
      'Aba Jogos → toque no chip "Histórico".',
      'Aparecem eventos finalizados, cancelados ou já passaram da data.',
      'Toque em qualquer evento pra ver os detalhes e a galeria de fotos.',
    ],
  },
  {
    emoji: '🔒',
    title: 'Privacidade',
    summary: 'Controle quem vê o quê.',
    steps: [
      'Configurações → Visibilidade do perfil.',
      'Perfil público: qualquer usuário do app vê seus dados (bio, esportes, idade, altura).',
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
      'Sistema: segue o que o celular ou o navegador estão usando.',
      'Manual: força claro ou escuro.',
      'A preferência é salva no dispositivo.',
    ],
  },
];

export const HelpHomeScreen: React.FC = () => {
  useThemedColors();
  const nav = useNavigation<Nav>();
  const [expandedIdx, setExpandedIdx] = useState<number | null>(0);

  const styles = StyleSheet.create({
    intro: {
      backgroundColor: colors.surfaceVariant,
      padding: spacing.md,
      borderRadius: radius.md,
      marginBottom: spacing.md,
    },
    introTxt: { fontSize: 14, color: colors.text, lineHeight: 20 },
    topicCard: {
      marginBottom: spacing.sm,
      padding: 0,
    },
    topicHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      padding: spacing.md,
    },
    topicEmoji: { fontSize: 26 },
    topicTitle: { flex: 1 },
    topicTitleTxt: { fontSize: 15, fontWeight: '800', color: colors.text },
    topicSummary: { fontSize: 12, color: colors.textSecondary, marginTop: 2, lineHeight: 17 },
    topicChev: { fontSize: 22, color: colors.textMuted },
    topicBody: {
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingTop: spacing.md,
      gap: spacing.sm,
    },
    step: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    stepBullet: {
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    stepBulletTxt: { color: colors.white, fontSize: 11, fontWeight: '900' },
    stepTxt: { flex: 1, fontSize: 13, color: colors.text, lineHeight: 18 },
    sectionTitle: {
      fontSize: 12,
      fontWeight: '800',
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
      marginTop: spacing.lg,
      marginBottom: spacing.sm,
    },
    contactCard: { gap: 6 },
    contactDesc: { fontSize: 13, color: colors.textSecondary, lineHeight: 18 },
    whatsBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      padding: spacing.md,
      borderRadius: radius.md,
      backgroundColor: '#25D366',
      marginTop: spacing.sm,
    },
    whatsEmoji: { fontSize: 22 },
    whatsTitle: { flex: 1, fontSize: 14, fontWeight: '800', color: colors.white },
    whatsChev: { fontSize: 22, color: colors.white },
  });

  return (
    <Screen maxWidth={760}>
      <Header title="Ajuda" subtitle="Como usar cada recurso do Timeco" onBack={() => nav.goBack()} />

      <View style={styles.intro}>
        <Text style={styles.introTxt}>
          📚 Toque em um tópico abaixo pra expandir o passo a passo. Se ainda restar dúvida, fale
          direto com a Incrivia pelo WhatsApp.
        </Text>
      </View>

      <Text style={styles.sectionTitle}>Recursos do app</Text>
      {TOPICS.map((t, i) => {
        const expanded = expandedIdx === i;
        return (
          <Card key={i} style={styles.topicCard}>
            <Pressable
              style={styles.topicHeader}
              onPress={() => setExpandedIdx(expanded ? null : i)}
            >
              <Text style={styles.topicEmoji}>{t.emoji}</Text>
              <View style={styles.topicTitle}>
                <Text style={styles.topicTitleTxt}>{t.title}</Text>
                <Text style={styles.topicSummary}>{t.summary}</Text>
              </View>
              <Text style={styles.topicChev}>{expanded ? '▴' : '▾'}</Text>
            </Pressable>
            {expanded ? (
              <View style={styles.topicBody}>
                {t.steps.map((step, idx) => (
                  <View key={idx} style={styles.step}>
                    <View style={styles.stepBullet}>
                      <Text style={styles.stepBulletTxt}>{idx + 1}</Text>
                    </View>
                    <Text style={styles.stepTxt}>{step}</Text>
                  </View>
                ))}
              </View>
            ) : null}
          </Card>
        );
      })}

      <Text style={styles.sectionTitle}>Ainda com dúvida?</Text>
      <Card style={styles.contactCard}>
        <Text style={styles.contactDesc}>
          Suporte, dúvidas, reclamações e sugestões: fale direto com a Incrivia pelo WhatsApp.
        </Text>
        <Pressable
          style={styles.whatsBtn}
          onPress={() =>
            Linking.openURL(
              'https://wa.me/5517992850093?text=' +
                encodeURIComponent('Olá! Preciso de ajuda com o Timeco.'),
            )
          }
        >
          <Text style={styles.whatsEmoji}>💬</Text>
          <Text style={styles.whatsTitle}>Falar com o suporte Incrivia</Text>
          <Text style={styles.whatsChev}>›</Text>
        </Pressable>
      </Card>
    </Screen>
  );
};
