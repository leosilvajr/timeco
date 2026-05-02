/**
 * Máscara de celular brasileiro: (XX) XXXXX-XXXX (11 dígitos)
 * ou (XX) XXXX-XXXX (10 dígitos, fixo).
 * Aceita qualquer entrada e formata os dígitos limpos.
 */
export const maskPhone = (raw: string): string => {
  if (!raw) return '';
  const digits = raw.replace(/\D/g, '').slice(0, 11);
  if (digits.length === 0) return '';
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  // 11 dígitos = celular com 9 inicial
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
};

/** Extrai apenas os dígitos do telefone (útil pra salvar no banco). */
export const unmaskPhone = (formatted: string): string =>
  formatted.replace(/\D/g, '');

/**
 * Máscara de número decimal (durante a digitação).
 * - Aceita ponto ou vírgula como separador, mantém o primeiro
 * - Limita casas decimais (default 2)
 * - Filtra qualquer caractere não numérico
 */
export const maskDecimal = (raw: string, maxDecimals = 2): string => {
  if (!raw) return '';
  // Mantém só dígitos e separadores
  const filtered = raw.replace(/[^\d.,]/g, '');
  // Normaliza vírgula → ponto
  const normalized = filtered.replace(/,/g, '.');
  const firstDot = normalized.indexOf('.');
  if (firstDot === -1) return normalized;
  // Mantém apenas o primeiro ponto
  const intPart = normalized.slice(0, firstDot);
  const decPart = normalized
    .slice(firstDot + 1)
    .replace(/\./g, '')
    .slice(0, maxDecimals);
  if (decPart.length === 0 && raw.endsWith('.')) {
    // Permite digitar "175." enquanto a casa decimal não foi adicionada
    return `${intPart}.`;
  }
  return decPart.length > 0 ? `${intPart}.${decPart}` : intPart;
};

/**
 * Converte string formatada (com . ou ,) em número.
 * Retorna null pra strings vazias ou inválidas.
 */
export const parseDecimal = (s: string): number | null => {
  if (!s || !s.trim()) return null;
  const n = parseFloat(s.replace(',', '.'));
  return Number.isFinite(n) ? n : null;
};
