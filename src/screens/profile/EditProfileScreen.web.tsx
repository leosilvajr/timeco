import React, { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  HtmlScreen,
  HtmlHeader,
  HtmlButton,
  HtmlInput,
  HtmlAvatar,
} from '../../components/web';
import { maskPhone, maskDecimal, parseDecimal, unmaskPhone } from '../../utils/masks';
import { uploadAvatar } from '../../services/photoService';
import { useAuthStore, useThemedColors } from '../../store';
import { updateUserProfile } from '../../services/authService';
import { formatError } from '../../utils/errorMessages';
import {
  isValidHeight,
  isValidWeight,
  isValidBirthDate,
  HEIGHT_MIN_CM,
  HEIGHT_MAX_CM,
  WEIGHT_MIN_KG,
  WEIGHT_MAX_KG,
  MAX_NAME_LEN,
  MAX_BIO_LEN,
} from '../../utils/validators';
import { pickImage } from '../../utils/imagePicker';
import { SPORTS } from '../../constants/sports';
import { SportId } from '../../types';
import type { ProfileStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<ProfileStackParamList, 'EditProfile'>;

export const EditProfileScreen: React.FC = () => {
  const c = useThemedColors();
  const nav = useNavigation<Nav>();
  const user = useAuthStore((s) => s.user);
  const patchUser = useAuthStore((s) => s.patchUser);

  const [name, setName] = useState(user?.name ?? '');
  const [birthDate, setBirthDate] = useState(user?.birthDate ?? '');
  const [heightCm, setHeightCm] = useState(user?.heightCm ? String(user.heightCm) : '');
  const [weightKg, setWeightKg] = useState(user?.weightKg ? String(user.weightKg) : '');
  const [phone, setPhone] = useState(user?.phone ? maskPhone(user.phone) : '');
  const [bio, setBio] = useState(user?.bio ?? '');
  const [favoriteSports, setFavoriteSports] = useState<SportId[]>(user?.favoriteSports ?? []);
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleSport = (id: SportId) => {
    setFavoriteSports((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const onPickAvatar = async () => {
    if (!user) return;
    try {
      const file = await pickImage();
      if (!file) return;
      setUploadingAvatar(true);
      const result = await uploadAvatar(user.id, file);
      await updateUserProfile(user.id, { photoURL: result.url });
      patchUser({ photoURL: result.url });
    } catch (err) {
      console.error('uploadAvatar', err);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const onRemoveAvatar = async () => {
    if (!user) return;
    if (!window.confirm('Remover foto de perfil?')) return;
    await updateUserProfile(user.id, { photoURL: null as unknown as string });
    patchUser({ photoURL: undefined });
  };

  const onSave = async () => {
    if (!user) return;
    setError(null);
    if (!name.trim()) return setError('O nome é obrigatório.');
    if (name.trim().length > MAX_NAME_LEN)
      return setError(`O nome pode ter no máximo ${MAX_NAME_LEN} caracteres.`);
    if (bio.trim().length > MAX_BIO_LEN)
      return setError(`A bio pode ter no máximo ${MAX_BIO_LEN} caracteres.`);
    if (birthDate.trim() && !isValidBirthDate(birthDate.trim()))
      return setError('Data de nascimento inválida. Confira o formato (AAAA-MM-DD).');
    const heightVal = parseDecimal(heightCm);
    if (heightCm.trim() && (heightVal == null || !isValidHeight(heightVal)))
      return setError(`A altura deve estar entre ${HEIGHT_MIN_CM} e ${HEIGHT_MAX_CM} cm.`);
    const weightVal = parseDecimal(weightKg);
    if (weightKg.trim() && (weightVal == null || !isValidWeight(weightVal)))
      return setError(`O peso deve estar entre ${WEIGHT_MIN_KG} e ${WEIGHT_MAX_KG} kg.`);

    setLoading(true);
    try {
      const patch = {
        name: name.trim(),
        birthDate: birthDate.trim() || undefined,
        heightCm: heightVal ?? undefined,
        weightKg: weightVal ?? undefined,
        phone: phone.trim() ? unmaskPhone(phone) : undefined,
        bio: bio.trim() || undefined,
        favoriteSports: favoriteSports.length ? favoriteSports : undefined,
      };
      await updateUserProfile(user.id, patch);
      patchUser(patch);
      nav.goBack();
    } catch (e: unknown) {
      setError(formatError(e, 'Não conseguimos salvar seu perfil agora. Tente de novo.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <HtmlScreen maxWidth={720}>
      <HtmlHeader title="Meus dados" onBack={() => nav.goBack()} />

      {/* Avatar uploader */}
      <div
        style={{
          textAlign: 'center',
          padding: '8px 0 16px',
        }}
      >
        <div style={{ display: 'inline-block', position: 'relative' }}>
          <HtmlAvatar name={user?.name} photoURL={user?.photoURL} size={104} />
          {uploadingAvatar ? (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(0,0,0,0.5)',
                color: c.white,
                borderRadius: 52,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 14,
              }}
            >
              ...
            </div>
          ) : null}
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 8 }}>
          <button
            onClick={onPickAvatar}
            disabled={uploadingAvatar}
            style={{
              padding: '6px 12px',
              borderRadius: 999,
              background: c.primary,
              color: c.white,
              border: 'none',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            {user?.photoURL ? 'Trocar foto' : 'Adicionar foto'}
          </button>
          {user?.photoURL ? (
            <button
              onClick={onRemoveAvatar}
              style={{
                padding: '6px 12px',
                borderRadius: 999,
                background: 'transparent',
                color: c.danger,
                border: `1px solid ${c.danger}`,
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              Remover
            </button>
          ) : null}
        </div>
      </div>

      <HtmlInput label="Nome" value={name} onChange={setName} autoComplete="name" />
      <HtmlInput
        label="Data de nascimento"
        value={birthDate}
        onChange={setBirthDate}
        placeholder="AAAA-MM-DD"
      />
      <HtmlInput
        label="Altura (cm)"
        value={heightCm}
        onChange={(v) => setHeightCm(maskDecimal(v))}
        placeholder="Ex: 175.5"
      />
      <HtmlInput
        label="Peso (kg) — privado"
        value={weightKg}
        onChange={(v) => setWeightKg(maskDecimal(v))}
        placeholder="Ex: 72.5"
      />
      <HtmlInput
        label="Telefone"
        type="tel"
        value={phone}
        onChange={(v) => setPhone(maskPhone(v))}
        placeholder="(11) 99999-0000"
      />
      <HtmlInput
        label="Sobre você (bio)"
        value={bio}
        onChange={setBio}
        placeholder="Ex: jogo handebol e basquete; sou ala-pivô"
        multiline
        rows={3}
      />

      <div
        style={{
          fontSize: 14,
          fontWeight: 700,
          color: c.text,
          marginTop: 8,
          marginBottom: 8,
        }}
      >
        Esportes favoritos
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
        {SPORTS.filter((s) => s.id !== 'other').map((s) => {
          const sel = favoriteSports.includes(s.id);
          return (
            <button
              key={s.id}
              onClick={() => toggleSport(s.id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '8px 12px',
                borderRadius: 999,
                background: sel ? c.primary : c.surface,
                border: `1.5px solid ${sel ? c.primary : c.border}`,
                color: sel ? c.white : c.text,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              <span style={{ fontSize: 16 }}>{s.emoji}</span>
              {s.label}
            </button>
          );
        })}
      </div>

      {error ? (
        <p style={{ color: c.danger, textAlign: 'center', marginBottom: 12 }}>{error}</p>
      ) : null}

      <HtmlButton title="Salvar" onClick={onSave} loading={loading} />
      <div style={{ marginTop: 8 }}>
        <HtmlButton
          title="Cancelar"
          variant="ghost"
          onClick={() => nav.goBack()}
          disabled={loading}
        />
      </div>
    </HtmlScreen>
  );
};
