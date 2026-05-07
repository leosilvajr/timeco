import React from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { HtmlScreen, HtmlHeader } from '../../components/web';
import { useAuthStore, useThemedColors, useThemeStore } from '../../store';
import type { ProfileStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<ProfileStackParamList, 'SettingsHome'>;

const MenuRow: React.FC<{
  icon: string;
  label: string;
  value?: string;
  onClick: () => void;
}> = ({ icon, label, value, onClick }) => {
  const c = useThemedColors();
  return (
    <button
      onClick={onClick}
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
      <span
        style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          background: c.surfaceVariant,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 20,
        }}
      >
        {icon}
      </span>
      <span style={{ flex: 1, fontSize: 15, color: c.text, fontWeight: 600 }}>{label}</span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {value ? <span style={{ fontSize: 13, color: c.textMuted }}>{value}</span> : null}
        <span style={{ fontSize: 22, color: c.textMuted }}>›</span>
      </span>
    </button>
  );
};

export const SettingsHomeScreen: React.FC = () => {
  const c = useThemedColors();
  const nav = useNavigation<Nav>();
  const user = useAuthStore((s) => s.user);
  const mode = useThemeStore((s) => s.mode);
  const themeLabel = mode === 'system' ? 'Sistema' : mode === 'dark' ? 'Escuro' : 'Claro';
  const privacyLabel = user?.isProfilePublic === false ? 'Privado' : 'Público';

  const sectionTitle: React.CSSProperties = {
    fontSize: 12,
    fontWeight: 800,
    color: c.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: 16,
    marginBottom: 8,
    marginLeft: 12,
  };
  const cardStyle: React.CSSProperties = {
    background: c.surface,
    border: `1px solid ${c.border}`,
    borderRadius: 16,
    overflow: 'hidden',
  };

  return (
    <HtmlScreen maxWidth={600}>
      <HtmlHeader
        title="Configurações"
        subtitle="Personalize o app do seu jeito"
        onBack={() => nav.goBack()}
      />

      <div style={sectionTitle}>Aparência</div>
      <div style={cardStyle}>
        <MenuRow
          icon="🎨"
          label="Modo claro / escuro"
          value={themeLabel}
          onClick={() => nav.navigate('ThemeSettings')}
        />
      </div>

      <div style={sectionTitle}>Privacidade</div>
      <div style={cardStyle}>
        <MenuRow
          icon="🔒"
          label="Visibilidade do perfil"
          value={privacyLabel}
          onClick={() => nav.navigate('PrivacySettings')}
        />
      </div>
    </HtmlScreen>
  );
};
