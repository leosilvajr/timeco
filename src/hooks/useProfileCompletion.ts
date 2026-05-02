import { User } from '../types';

export interface ProfileCompletionField {
  key: 'birthDate' | 'heightCm' | 'weightKg' | 'phone' | 'bio' | 'favoriteSports';
  label: string;
  /**
   * Se true, contar como crítico (afeta sorteios diretamente).
   * Crítico = idade, altura, peso. Não-crítico = telefone, bio, esportes.
   */
  affectsDraw: boolean;
  hint: string;
}

const FIELDS: ProfileCompletionField[] = [
  { key: 'birthDate', label: 'Data de nascimento', affectsDraw: true, hint: 'usada pra equilibrar times por idade' },
  { key: 'heightCm', label: 'Altura', affectsDraw: true, hint: 'usada em vôlei, basquete e handebol' },
  { key: 'weightKg', label: 'Peso', affectsDraw: true, hint: 'usado em esportes de contato (privado)' },
  { key: 'favoriteSports', label: 'Esportes favoritos', affectsDraw: false, hint: 'aparece no seu perfil público' },
  { key: 'bio', label: 'Sobre você (bio)', affectsDraw: false, hint: 'aparece no seu perfil público' },
  { key: 'phone', label: 'Telefone', affectsDraw: false, hint: 'pra organizadores entrarem em contato' },
];

const isFilled = (user: User, key: ProfileCompletionField['key']): boolean => {
  const v = user[key];
  if (Array.isArray(v)) return v.length > 0;
  if (typeof v === 'number') return Number.isFinite(v);
  if (typeof v === 'string') return v.trim().length > 0;
  return v != null;
};

export interface ProfileCompletion {
  total: number;
  filled: number;
  missing: ProfileCompletionField[];
  missingCritical: ProfileCompletionField[];
  percent: number;
  isComplete: boolean;
}

export const computeProfileCompletion = (user: User | null): ProfileCompletion => {
  if (!user) {
    return { total: FIELDS.length, filled: 0, missing: FIELDS, missingCritical: FIELDS.filter((f) => f.affectsDraw), percent: 0, isComplete: false };
  }
  const filled = FIELDS.filter((f) => isFilled(user, f.key));
  const missing = FIELDS.filter((f) => !isFilled(user, f.key));
  return {
    total: FIELDS.length,
    filled: filled.length,
    missing,
    missingCritical: missing.filter((f) => f.affectsDraw),
    percent: Math.round((filled.length / FIELDS.length) * 100),
    isComplete: missing.length === 0,
  };
};
