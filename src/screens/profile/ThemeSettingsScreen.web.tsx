import React from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { HtmlScreen, HtmlHeader } from '../../components/web';
import { useThemedColors, useThemeStore, ThemeMode } from '../../store';
import type { ProfileStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<ProfileStackParamList, 'ThemeSettings'>;

const OPTIONS: { mode: ThemeMode; emoji: string; title: string; desc: string }[] = [
  {
    mode: 'system',
    emoji: '🖥️',
    title: 'Sistema',
    desc: 'Acompanha o tema do dispositivo (claro/escuro automático)',
  },
  { mode: 'light', emoji: '☀️', title: 'Claro', desc: 'Aparência clara, fundo branco/verde suave' },
  {
    mode: 'dark',
    emoji: '🌙',
    title: 'Escuro',
    desc: 'Aparência escura, melhor para ambientes pouco iluminados',
  },
];

export const ThemeSettingsScreen: React.FC = () => {
  const c = useThemedColors();
  const nav = useNavigation<Nav>();
  const mode = useThemeStore((s) => s.mode);
  const setMode = useThemeStore((s) => s.setMode);

  return (
    <HtmlScreen maxWidth={600}>
      <HtmlHeader title="Aparência" onBack={() => nav.goBack()} />
      <p style={{ fontSize: 14, color: c.textSecondary, marginBottom: 16, lineHeight: 1.4 }}>
        Escolha como o Timeco aparece. A preferência fica salva no dispositivo e aplica
        instantaneamente.
      </p>

      {OPTIONS.map((opt) => {
        const selected = mode === opt.mode;
        return (
          <button
            key={opt.mode}
            onClick={() => setMode(opt.mode)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              background: selected ? c.surfaceVariant : c.surface,
              borderRadius: 10,
              border: `2px solid ${selected ? c.primary : c.border}`,
              padding: '12px 16px',
              marginBottom: 8,
              width: '100%',
              cursor: 'pointer',
              textAlign: 'left',
              fontFamily: 'inherit',
              color: 'inherit',
            }}
          >
            <span style={{ fontSize: 32, flexShrink: 0 }}>{opt.emoji}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: c.text }}>{opt.title}</div>
              <div style={{ fontSize: 13, color: c.textSecondary, marginTop: 2 }}>{opt.desc}</div>
            </div>
            <span
              style={{
                width: 22,
                height: 22,
                borderRadius: 11,
                border: `2px solid ${selected ? c.primary : c.border}`,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {selected ? (
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
          </button>
        );
      })}
    </HtmlScreen>
  );
};
