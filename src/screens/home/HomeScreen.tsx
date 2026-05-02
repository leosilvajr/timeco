import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Screen, SectionTitle } from '../../components';
import { colors, spacing, radius } from '../../constants/theme';
import { useAuthStore, useThemedColors, useUnreadCount } from '../../store';
import { useResponsive } from '../../hooks/useResponsive';
import { computeProfileCompletion } from '../../hooks/useProfileCompletion';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { MainTabParamList } from '../../navigation/types';

import { ProfileCompletionBanner } from './components/ProfileCompletionBanner';
import { FeaturesGrid, FeatureCardData } from './components/FeaturesGrid';
import { UtilitiesList, UtilityItem } from './components/UtilitiesList';
import { HowItWorks } from './components/HowItWorks';
import { HelpFooter } from './components/HelpFooter';

type Nav = BottomTabNavigationProp<MainTabParamList>;

interface QuickButtonProps {
  emoji: string;
  label: string;
  onPress: () => void;
  variant?: 'solid' | 'outline';
}

const QuickBtn: React.FC<QuickButtonProps> = ({ emoji, label, onPress, variant = 'solid' }) => {
  useThemedColors();
  const styles = StyleSheet.create({
    btn: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: spacing.sm,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      backgroundColor: variant === 'outline' ? colors.surface : colors.primary,
      borderWidth: variant === 'outline' ? 1 : 0,
      borderColor: colors.border,
    },
    emoji: { fontSize: 20 },
    label: {
      fontSize: 12,
      fontWeight: '700',
      color: variant === 'outline' ? colors.text : colors.white,
    },
  });
  return (
    <Pressable onPress={onPress} style={styles.btn}>
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
};

export const HomeScreen: React.FC = () => {
  useThemedColors();
  const responsive = useResponsive();
  const desktop = responsive.isDesktop;
  const user = useAuthStore((s) => s.user);
  const unread = useUnreadCount();
  const completion = computeProfileCompletion(user);
  const nav = useNavigation<Nav>();

  // Atalhos de navegação
  const goEditProfile = () => nav.navigate('Perfil', { screen: 'EditProfile' } as never);
  const goCreate = () => nav.navigate('Jogos', { screen: 'CreateEvent' } as never);
  const goEvents = () => nav.navigate('Jogos', { screen: 'EventsList' } as never);
  const goHistory = () =>
    nav.navigate('Jogos', { screen: 'EventsList', params: { initialFilter: 'history' } } as never);
  const goFriends = () => nav.navigate('Social', { screen: 'FriendsList' } as never);
  const goAddFriend = () => nav.navigate('Social', { screen: 'AddFriend' } as never);
  const goRequests = () => nav.navigate('Social', { screen: 'FriendRequests' } as never);
  const goNotifications = () => nav.navigate('Perfil', { screen: 'Notifications' } as never);
  const goVolley = () =>
    (nav as unknown as { navigate: (n: string, p?: unknown) => void }).navigate('Volley', {
      screen: 'VolleyHome',
    });
  const goScoreboard = () =>
    (nav as unknown as { navigate: (n: string, p?: unknown) => void }).navigate('Scoreboard', {
      screen: 'ScoreboardSetup',
    });

  const features: FeatureCardData[] = [
    {
      emoji: '🏟️',
      title: 'Eventos esportivos',
      desc: 'Crie partidas, escolha o esporte, defina local, horário e convide amigos.',
      onPress: goEvents,
      cta: 'Ver meus jogos',
    },
    {
      emoji: '🎲',
      title: 'Sorteio inteligente',
      desc: 'Times equilibrados automaticamente por estrelas, idade e altura.',
      onPress: goCreate,
      cta: 'Criar evento',
    },
    {
      emoji: '👥',
      title: 'Rede de amigos',
      desc: 'Encontre jogadores, troque mensagens no chat e organize sua trupe.',
      onPress: goFriends,
      cta: 'Meus amigos',
    },
    {
      emoji: '🔔',
      title: 'Notificações',
      desc: 'Avisos em tempo real de convites, mensagens e atualizações de eventos.',
      onPress: goNotifications,
      cta: unread > 0 ? `${unread} não lidas` : 'Abrir',
    },
  ];

  const utilities: UtilityItem[] = [
    {
      emoji: '🏆',
      title: 'Placar eletrônico',
      description:
        'Marcador digital com números gigantes, sets, regra de vantagem 2 e undo. Deixe o celular fixo durante o jogo.',
      onPress: goScoreboard,
    },
    {
      emoji: '📜',
      title: 'Histórico de partidas',
      description:
        'Veja todos os eventos finalizados, jogos passados e times sorteados anteriormente.',
      onPress: goHistory,
    },
    {
      emoji: '🏐',
      title: 'Vôlei avançado · Scout',
      description:
        'Modo separado pra registrar saques, ataques, passes e gerar relatórios profissionais por jogador e set.',
      tag: 'FERRAMENTA EXTRA',
      onPress: goVolley,
    },
  ];

  const styles = StyleSheet.create({
    hero: { marginBottom: spacing.lg },
    greeting: { fontSize: 14, color: colors.textSecondary, fontWeight: '600' },
    title: {
      fontSize: desktop ? 32 : 24,
      fontWeight: '900',
      color: colors.text,
      marginTop: 2,
      letterSpacing: -0.3,
    },
    subtitle: {
      fontSize: desktop ? 15 : 14,
      color: colors.textSecondary,
      marginTop: 4,
      lineHeight: desktop ? 22 : 20,
      maxWidth: desktop ? 640 : undefined,
    },
    alertCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      padding: spacing.md,
      borderRadius: radius.md,
      backgroundColor: colors.surfaceVariant,
      borderWidth: 1,
      borderColor: colors.primaryLight,
      marginBottom: spacing.md,
    },
    alertEmoji: { fontSize: 22 },
    alertTitle: { fontSize: 14, fontWeight: '700', color: colors.text },
    alertSub: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
    alertChev: { fontSize: 22, color: colors.textMuted },
    quickRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginBottom: spacing.sm,
    },
  });

  return (
    <Screen>
      <View style={styles.hero}>
        <Text style={styles.greeting}>Olá, {user?.name?.split(' ')[0] ?? 'atleta'} 👋</Text>
        <Text style={styles.title}>Seu painel esportivo</Text>
        <Text style={styles.subtitle}>
          Organize partidas, monte times equilibrados e acompanhe seus jogos — tudo em um só lugar.
        </Text>
      </View>

      {!completion.isComplete ? (
        <ProfileCompletionBanner completion={completion} onPress={goEditProfile} />
      ) : null}

      {unread > 0 ? (
        <Pressable style={styles.alertCard} onPress={goNotifications}>
          <Text style={styles.alertEmoji}>🔔</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.alertTitle}>
              Você tem {unread} notificação{unread === 1 ? '' : 'ões'} não lida{unread === 1 ? '' : 's'}
            </Text>
            <Text style={styles.alertSub}>Toque para ver convites, mensagens e atualizações</Text>
          </View>
          <Text style={styles.alertChev}>›</Text>
        </Pressable>
      ) : null}

      <SectionTitle small>Ações rápidas</SectionTitle>
      <View style={styles.quickRow}>
        <QuickBtn emoji="➕" label="Criar evento" onPress={goCreate} />
        <QuickBtn emoji="👥" label="Adicionar amigo" onPress={goAddFriend} variant="outline" />
        <QuickBtn emoji="📨" label="Convites" onPress={goRequests} variant="outline" />
      </View>

      <SectionTitle small>Recursos do Timeco</SectionTitle>
      <FeaturesGrid features={features} />

      <SectionTitle small>Utilitários</SectionTitle>
      <UtilitiesList items={utilities} />

      <SectionTitle small>Como funciona</SectionTitle>
      <HowItWorks />

      <SectionTitle small>Ajuda e suporte</SectionTitle>
      <HelpFooter onAddFriend={goAddFriend} />
    </Screen>
  );
};
