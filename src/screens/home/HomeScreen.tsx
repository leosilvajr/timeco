import React from 'react';
import { View, Text, StyleSheet, Pressable, Linking } from 'react-native';
import { Screen, Card } from '../../components';
import { colors, spacing, radius } from '../../constants/theme';
import { useAuthStore, useThemedColors, useUnreadCount } from '../../store';
import { useResponsive } from '../../hooks/useResponsive';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { MainTabParamList } from '../../navigation/types';

type Nav = BottomTabNavigationProp<MainTabParamList>;

interface FeatureCard {
  emoji: string;
  title: string;
  desc: string;
  onPress?: () => void;
  cta?: string;
}

const STEPS = [
  { n: 1, title: 'Adicione amigos', desc: 'Conecte-se com pessoas que jogam com você.' },
  { n: 2, title: 'Crie um evento', desc: 'Esporte, local, horário e convidados.' },
  { n: 3, title: 'Defina estrelas', desc: 'De 1 a 5 estrelas pro nível de cada um.' },
  { n: 4, title: 'Sorteie os times', desc: 'O Timeco equilibra automaticamente.' },
  { n: 5, title: 'Bora jogar!', desc: 'Cada time recebe uma cor. Compartilhe.' },
];

export const HomeScreen: React.FC = () => {
  useThemedColors();
  const responsive = useResponsive();
  const desktop = responsive.isDesktop;
  const tabletOrUp = responsive.isTablet || responsive.isDesktop;
  const user = useAuthStore((s) => s.user);
  const unread = useUnreadCount();
  const nav = useNavigation<Nav>();

  const goCreate = () => nav.navigate('Jogos', { screen: 'CreateEvent' } as never);
  const goEvents = () => nav.navigate('Jogos', { screen: 'EventsList' } as never);
  const goFriends = () => nav.navigate('Social', { screen: 'FriendsList' } as never);
  const goAddFriend = () => nav.navigate('Social', { screen: 'AddFriend' } as never);
  const goRequests = () => nav.navigate('Social', { screen: 'FriendRequests' } as never);
  const goNotifications = () => nav.navigate('Perfil', { screen: 'Notifications' } as never);
  const goVolley = () =>
    (nav as unknown as { navigate: (n: string, p?: unknown) => void }).navigate('Volley', {
      screen: 'VolleyHome',
    });

  const features: FeatureCard[] = [
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

  const styles = StyleSheet.create({
    hero: {
      marginBottom: spacing.lg,
    },
    greeting: {
      fontSize: 14,
      color: colors.textSecondary,
      fontWeight: '600',
    },
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
    sectionTitle: {
      fontSize: 12,
      fontWeight: '800',
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
      marginBottom: spacing.sm,
      marginTop: spacing.lg,
    },

    // Banner de convite (quando há notificações pendentes)
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

    // Quick actions (linha de 3 botões compactos)
    quickRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginBottom: spacing.sm,
    },
    quickBtn: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: spacing.sm,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      backgroundColor: colors.primary,
    },
    quickBtnOutline: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    quickBtnEmoji: { fontSize: 20 },
    quickBtnLabel: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.white,
    },
    quickBtnLabelOutline: { color: colors.text },

    // Feature grid
    featureGrid: {
      flexDirection: tabletOrUp ? 'row' : 'column',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    featureCard: {
      flexBasis: tabletOrUp ? '48%' : '100%',
      flexGrow: 1,
      minWidth: tabletOrUp ? 260 : undefined,
      padding: spacing.md,
      gap: 6,
    },
    featureHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    featureEmoji: { fontSize: 22 },
    featureTitle: { fontSize: 15, fontWeight: '800', color: colors.text },
    featureDesc: { fontSize: 13, color: colors.textSecondary, lineHeight: 18 },
    featureCta: {
      marginTop: 4,
      fontSize: 12,
      fontWeight: '700',
      color: colors.primary,
    },

    // Utilitários (vôlei + futuras ferramentas)
    utilCard: {
      padding: spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      borderColor: colors.primaryLight,
    },
    utilIconBox: {
      width: 44,
      height: 44,
      borderRadius: radius.md,
      backgroundColor: colors.primary + '22',
      alignItems: 'center',
      justifyContent: 'center',
    },
    utilEmoji: { fontSize: 24 },
    utilTitle: { fontSize: 15, fontWeight: '800', color: colors.text },
    utilSub: { fontSize: 12, color: colors.textSecondary, marginTop: 2, lineHeight: 17 },
    utilTag: {
      alignSelf: 'flex-start',
      backgroundColor: colors.primary,
      color: colors.white,
      fontSize: 9,
      fontWeight: '900',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: radius.sm,
      marginTop: 4,
      letterSpacing: 0.5,
    },
    utilChev: { fontSize: 22, color: colors.textMuted },

    // Steps (compactos)
    stepsList: {
      gap: spacing.sm,
    },
    stepRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.md,
      paddingVertical: 6,
    },
    stepBadge: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    stepBadgeTxt: { color: colors.white, fontWeight: '900', fontSize: 13 },
    stepText: { flex: 1 },
    stepTitle: { fontSize: 14, fontWeight: '700', color: colors.text },
    stepDesc: { fontSize: 12, color: colors.textSecondary, marginTop: 2, lineHeight: 16 },

    // Ajuda
    helpCard: {
      gap: 6,
    },
    helpTitle: { fontSize: 14, fontWeight: '800', color: colors.text },
    helpDesc: { fontSize: 13, color: colors.textSecondary, lineHeight: 18 },
    helpLinks: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
      marginTop: spacing.sm,
    },
    helpLink: {
      paddingHorizontal: spacing.md,
      paddingVertical: 8,
      borderRadius: radius.pill,
      backgroundColor: colors.surfaceVariant,
    },
    helpLinkTxt: { fontSize: 12, fontWeight: '700', color: colors.primary },
  });

  const QuickBtn: React.FC<{
    emoji: string;
    label: string;
    onPress: () => void;
    variant?: 'solid' | 'outline';
  }> = ({ emoji, label, onPress, variant = 'solid' }) => (
    <Pressable
      onPress={onPress}
      style={[styles.quickBtn, variant === 'outline' && styles.quickBtnOutline]}
    >
      <Text style={styles.quickBtnEmoji}>{emoji}</Text>
      <Text style={[styles.quickBtnLabel, variant === 'outline' && styles.quickBtnLabelOutline]}>
        {label}
      </Text>
    </Pressable>
  );

  return (
    <Screen>
      <View style={styles.hero}>
        <Text style={styles.greeting}>Olá, {user?.name?.split(' ')[0] ?? 'atleta'} 👋</Text>
        <Text style={styles.title}>Seu painel esportivo</Text>
        <Text style={styles.subtitle}>
          Organize partidas, monte times equilibrados e acompanhe seus jogos — tudo em um só lugar.
        </Text>
      </View>

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

      <Text style={styles.sectionTitle}>Ações rápidas</Text>
      <View style={styles.quickRow}>
        <QuickBtn emoji="➕" label="Criar evento" onPress={goCreate} />
        <QuickBtn emoji="👥" label="Adicionar amigo" onPress={goAddFriend} variant="outline" />
        <QuickBtn emoji="📨" label="Convites" onPress={goRequests} variant="outline" />
      </View>

      <Text style={styles.sectionTitle}>Recursos do Timeco</Text>
      <View style={styles.featureGrid}>
        {features.map((f) => (
          <Card key={f.title} style={styles.featureCard} onPress={f.onPress}>
            <View style={styles.featureHeader}>
              <Text style={styles.featureEmoji}>{f.emoji}</Text>
              <Text style={styles.featureTitle}>{f.title}</Text>
            </View>
            <Text style={styles.featureDesc}>{f.desc}</Text>
            {f.cta ? <Text style={styles.featureCta}>{f.cta} ›</Text> : null}
          </Card>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Utilitários</Text>
      <Card style={styles.utilCard} onPress={goVolley}>
        <View style={styles.utilIconBox}>
          <Text style={styles.utilEmoji}>🏐</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.utilTitle}>Vôlei avançado · Scout</Text>
          <Text style={styles.utilSub}>
            Modo separado para registrar saques, ataques, passes e gerar relatórios profissionais
            por jogador e set.
          </Text>
          <Text style={styles.utilTag}>FERRAMENTA EXTRA</Text>
        </View>
        <Text style={styles.utilChev}>›</Text>
      </Card>

      <Text style={styles.sectionTitle}>Como funciona</Text>
      <Card>
        <View style={styles.stepsList}>
          {STEPS.map((s) => (
            <View key={s.n} style={styles.stepRow}>
              <View style={styles.stepBadge}>
                <Text style={styles.stepBadgeTxt}>{s.n}</Text>
              </View>
              <View style={styles.stepText}>
                <Text style={styles.stepTitle}>{s.title}</Text>
                <Text style={styles.stepDesc}>{s.desc}</Text>
              </View>
            </View>
          ))}
        </View>
      </Card>

      <Text style={styles.sectionTitle}>Ajuda e suporte</Text>
      <Card style={styles.helpCard}>
        <Text style={styles.helpTitle}>Precisa de ajuda?</Text>
        <Text style={styles.helpDesc}>
          Apenas o organizador define as estrelas dos jogadores. O sorteio mistura atletas fortes e
          iniciantes em cada time. Se algo não funcionar, fale com a gente.
        </Text>
        <View style={styles.helpLinks}>
          <Pressable
            style={styles.helpLink}
            onPress={() => Linking.openURL('mailto:suporte@timeco.app?subject=Suporte%20Timeco')}
          >
            <Text style={styles.helpLinkTxt}>📧 Falar com suporte</Text>
          </Pressable>
          <Pressable style={styles.helpLink} onPress={goAddFriend}>
            <Text style={styles.helpLinkTxt}>👥 Convidar um amigo</Text>
          </Pressable>
        </View>
      </Card>
    </Screen>
  );
};
