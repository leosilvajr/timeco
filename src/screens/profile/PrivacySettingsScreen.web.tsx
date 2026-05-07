import React, { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { HtmlScreen, HtmlHeader, HtmlCard, HtmlButton } from '../../components/web';
import { useAuthStore, useThemedColors } from '../../store';
import { updateUserProfile } from '../../services/authService';
import { formatError } from '../../utils/errorMessages';
import type { ProfileStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<ProfileStackParamList, 'PrivacySettings'>;

const Toggle: React.FC<{
  value: boolean;
  onChange: (v: boolean) => void;
  title: string;
  hint?: string;
}> = ({ value, onChange, title, hint }) => {
  const c = useThemedColors();
  return (
    <button
      onClick={() => onChange(!value)}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        padding: '12px 0',
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        width: '100%',
        textAlign: 'left',
        fontFamily: 'inherit',
        color: 'inherit',
        borderBottom: `1px solid ${c.border}`,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15, color: c.text, fontWeight: 600 }}>{title}</div>
        {hint ? (
          <div style={{ fontSize: 12, color: c.textSecondary, marginTop: 4, lineHeight: 1.4 }}>
            {hint}
          </div>
        ) : null}
      </div>
      <span
        style={{
          width: 40,
          height: 22,
          borderRadius: 11,
          background: value ? c.primary : c.border,
          position: 'relative',
          transition: 'background 0.2s',
          flexShrink: 0,
          marginTop: 2,
        }}
      >
        <span
          style={{
            position: 'absolute',
            top: 2,
            left: value ? 20 : 2,
            width: 18,
            height: 18,
            borderRadius: 9,
            background: c.white,
            transition: 'left 0.2s',
          }}
        />
      </span>
    </button>
  );
};

export const PrivacySettingsScreen: React.FC = () => {
  const c = useThemedColors();
  const nav = useNavigation<Nav>();
  const user = useAuthStore((s) => s.user);
  const patchUser = useAuthStore((s) => s.patchUser);

  const [isProfilePublic, setIsProfilePublic] = useState(user?.isProfilePublic !== false);
  const [isGalleryPublic, setIsGalleryPublic] = useState(user?.isGalleryPublic !== false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSave = async () => {
    if (!user) return;
    setError(null);
    setSaving(true);
    try {
      await updateUserProfile(user.id, { isProfilePublic, isGalleryPublic });
      patchUser({ isProfilePublic, isGalleryPublic });
      nav.goBack();
    } catch (e: unknown) {
      setError(formatError(e, 'Não conseguimos salvar suas preferências de privacidade agora.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <HtmlScreen maxWidth={600}>
      <HtmlHeader title="Privacidade" subtitle="Controle quem vê o que" onBack={() => nav.goBack()} />

      <div
        style={{
          background: c.surfaceVariant,
          padding: 12,
          borderRadius: 10,
          marginBottom: 12,
        }}
      >
        <p style={{ fontSize: 13, color: c.text, lineHeight: 1.5, margin: 0 }}>
          🔒 Quando privado, apenas seus amigos conseguem ver os detalhes. Pessoas que ainda não
          são amigos veem só o nome e a foto de perfil.
        </p>
      </div>

      <HtmlCard>
        <Toggle
          value={isProfilePublic}
          onChange={setIsProfilePublic}
          title="Perfil público"
          hint="Bio, esportes favoritos, idade e altura visíveis pra qualquer pessoa do app"
        />
        <Toggle
          value={isGalleryPublic}
          onChange={setIsGalleryPublic}
          title="Galeria pública"
          hint="Fotos das partidas que você participou aparecem no seu perfil"
        />
      </HtmlCard>

      {error ? (
        <p style={{ color: c.danger, marginTop: 12, marginBottom: 12, textAlign: 'center' }}>
          {error}
        </p>
      ) : null}

      <div style={{ marginTop: 16 }}>
        <HtmlButton title="Salvar" onClick={onSave} loading={saving} />
      </div>
    </HtmlScreen>
  );
};
