/**
 * Mapeamento centralizado de erros pra mensagens em pt-BR amigáveis.
 *
 * Use `formatError(e, fallback)` em catch blocks ao mostrar mensagem
 * pro usuário. Nunca expor `e.message` cru — pode vazar texto técnico
 * em inglês (ex: "FirebaseError: Missing or insufficient permissions").
 */

/** Mapa de códigos do Firebase pra mensagens pt-BR. */
const FIREBASE_ERROR_MAP: Record<string, string> = {
  // ===== Auth =====
  'auth/invalid-credential': 'Email ou senha inválidos.',
  'auth/wrong-password': 'Email ou senha inválidos.',
  'auth/user-not-found': 'Não encontramos uma conta com esse email.',
  'auth/email-already-in-use': 'Este email já está cadastrado. Tente fazer login.',
  'auth/invalid-email': 'Email inválido. Confira se digitou corretamente.',
  'auth/missing-email': 'Informe seu email pra continuar.',
  'auth/missing-password': 'Informe sua senha pra continuar.',
  'auth/weak-password': 'A senha precisa ter pelo menos 6 caracteres.',
  'auth/too-many-requests':
    'Muitas tentativas em pouco tempo. Aguarde alguns minutos antes de tentar de novo.',
  'auth/network-request-failed':
    'Sem conexão com a internet. Verifique sua rede e tente de novo.',
  'auth/popup-blocked':
    'O navegador bloqueou a janela de login do Google. Permita pop-ups e tente de novo.',
  'auth/operation-not-allowed': 'Este método de login está desabilitado.',
  'auth/user-disabled': 'Esta conta foi desativada. Fale com o suporte se precisar de ajuda.',
  'auth/requires-recent-login': 'Por segurança, faça login de novo pra continuar.',
  'auth/account-exists-with-different-credential':
    'Já existe uma conta com este email usando outro método de login.',

  // ===== Códigos de cancelamento (silenciosos — não mostrar erro) =====
  'auth/popup-closed-by-user': '',
  'auth/cancelled-popup-request': '',
  'auth/user-cancelled': '',

  // ===== Firestore =====
  'permission-denied': 'Você não tem permissão pra fazer isso.',
  'not-found': 'Item não encontrado. Talvez tenha sido removido.',
  'already-exists': 'Este item já existe.',
  unavailable: 'Serviço temporariamente indisponível. Tente em alguns segundos.',
  cancelled: 'Operação cancelada.',
  'deadline-exceeded': 'A operação demorou demais. Verifique sua conexão e tente de novo.',
  unauthenticated: 'Você precisa estar logado pra fazer isso.',
  'resource-exhausted': 'Limite de uso atingido. Tente mais tarde.',
  'failed-precondition': 'A operação não pode ser feita agora. Tente recarregar a tela.',
  aborted: 'A operação foi interrompida. Tente de novo.',
  'invalid-argument': 'Algum dado enviado está incorreto. Confira e tente de novo.',
  'data-loss': 'Falha de dados ao processar. Tente de novo em instantes.',

  // ===== Storage =====
  'storage/unauthorized': 'Você não tem permissão pra enviar essa foto.',
  'storage/canceled': '',
  'storage/quota-exceeded': 'Espaço de armazenamento esgotado.',
  'storage/object-not-found': 'Arquivo não encontrado no servidor.',
  'storage/retry-limit-exceeded': 'Falha de conexão ao enviar a foto. Tente de novo.',
  'storage/invalid-checksum':
    'Arquivo corrompido durante o envio. Tente subir a foto de novo.',
  'storage/server-file-wrong-size':
    'O arquivo chegou com tamanho diferente do esperado. Tente de novo.',
};

/** Padrões em mensagens já tratadas em pt-BR — usar a própria mensagem. */
const PT_BR_HINT = /[áéíóúâêôãõç]|sem |não |inválid|aguard|verifi|tente|preencha/i;

/** Tenta extrair o código do erro de várias formas que o Firebase usa. */
const extractFirebaseCode = (e: Error): string | null => {
  const withCode = e as Error & { code?: string };
  if (typeof withCode.code === 'string') return withCode.code;

  // Firebase Web SDK frequentemente embute o código na message:
  //  "Firebase: Error (auth/invalid-credential)."
  const match = e.message.match(/\(([\w/-]+)\)/);
  return match ? match[1] : null;
};

/**
 * Converte qualquer erro lançado em uma mensagem amigável em pt-BR.
 *
 * Ordem de prioridade:
 *   1. Mapeamento por código Firebase (preferido — preciso)
 *   2. Mensagem original se já parece estar em pt-BR
 *   3. Fallback contextual fornecido pelo chamador
 *
 * Retorna string vazia '' quando o erro é um cancelamento silencioso
 * (ex: usuário fechou o popup do Google) — caller deve testar com
 * `if (msg) setError(msg)` pra evitar mostrar erro vazio.
 */
export const formatError = (e: unknown, fallback: string): string => {
  if (!(e instanceof Error)) return fallback;

  const code = extractFirebaseCode(e);
  if (code && code in FIREBASE_ERROR_MAP) {
    return FIREBASE_ERROR_MAP[code];
  }

  // Procura códigos firebase embarcados na message como substring
  for (const key of Object.keys(FIREBASE_ERROR_MAP)) {
    if (e.message.includes(key)) {
      return FIREBASE_ERROR_MAP[key];
    }
  }

  // Mensagem já em pt-BR e curta o suficiente — usar
  if (PT_BR_HINT.test(e.message) && e.message.length < 200) {
    return e.message;
  }

  return fallback;
};
