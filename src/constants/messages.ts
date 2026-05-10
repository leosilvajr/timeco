/**
 * Strings centralizadas pt-BR.
 *
 * Convencao de chaves: dominio.acao ou dominio.estado.
 * Quando a string tem placeholder, exporta como funcao.
 *
 * Uso:
 *   import { msg } from '../constants/messages';
 *   toast.success(msg.event.created);
 *   alert(msg.event.deleteConfirm(eventTitle));
 *
 * Beneficio: facilita encontrar/trocar texto, prepara pra i18n futura.
 */

export const msg = {
  // ============ COMMON ============
  common: {
    loading: 'Carregando...',
    save: 'Salvar',
    cancel: 'Cancelar',
    delete: 'Excluir',
    edit: 'Editar',
    confirm: 'Confirmar',
    back: 'Voltar',
    retry: 'Tentar novamente',
    close: 'Fechar',
    yes: 'Sim',
    no: 'Não',
    error: 'Algo deu errado',
    success: 'Sucesso!',
    saving: 'Salvando...',
    sending: 'Enviando...',
  },

  // ============ AUTH ============
  auth: {
    login: 'Entrar',
    signup: 'Criar conta',
    logout: 'Sair',
    email: 'Email',
    password: 'Senha',
    forgotPassword: 'Esqueci minha senha',
    loginSuccess: 'Login realizado!',
    loginError: 'Não conseguimos entrar agora. Tente de novo em alguns instantes.',
    signupSuccess: 'Conta criada!',
    signupError: 'Não conseguimos criar sua conta. Tente de novo.',
    googleError: 'Não conseguimos fazer login com Google agora.',
    fieldsRequired: 'Preencha email e senha.',
    invalidEmail: 'Email em formato inválido. Confira se digitou corretamente.',
    weakPassword: 'A senha deve ter ao menos 6 caracteres.',
    passwordMismatch: 'As senhas não conferem.',
    invalidBirthDate: 'Data de nascimento inválida. Use o formato AAAA-MM-DD.',
    nameRequired: 'O nome é obrigatório.',
  },

  // ============ EVENTS ============
  event: {
    created: 'Evento criado!',
    updated: 'Evento atualizado!',
    deleted: 'Evento excluído.',
    cancelled: 'Evento cancelado.',
    closed: 'Evento encerrado e arquivado no histórico.',
    deleteConfirm: 'Apagar este evento?',
    cancelConfirm: 'Cancelar este evento? Avisa todos que não vai mais acontecer.',
    closeConfirm: 'Encerrar este evento? Vai pro Histórico e some das listas.',
    confirmedToGo: 'Você confirmou presença!',
    declinedToGo: 'Você marcou que não vai.',
    titleRequired: 'Informe um título pro evento.',
    locationRequired: 'Informe o local do evento.',
    dateRequired: 'Informe a data e o horário.',
    futureRequired: 'A data e o horário precisam ser no futuro.',
    inviteAtLeastOne: 'Convide pelo menos 1 jogador.',
    photoUploadError: 'Não conseguimos enviar a foto.',
    photoDeleteConfirm: 'Apagar esta foto?',
    cantSeeOthers:
      'Você só vê eventos que criou ou foi convidado. Por privacidade, não há como ver eventos de terceiros.',
  },

  // ============ FRIENDS ============
  friends: {
    inviteSent: (name: string) => `Convite enviado para ${name}.`,
    inviteError: 'Não conseguimos enviar o convite agora.',
    requestAccepted: 'Pedido aceito!',
    requestDeclined: 'Pedido recusado.',
    removeConfirm: (name: string) => `Remover ${name}?`,
    noFriendsYet: 'Você ainda não tem amigos.',
  },

  // ============ DRAW (sorteio) ============
  draw: {
    notEnoughPlayers: (n: number) => `Precisamos de pelo menos ${n} jogadores pra montar os times.`,
    teamsNeedTwo: 'Você precisa de pelo menos 2 times.',
    enoughPlayers: (n: number) => `Adicione pelo menos ${n} jogadores pra montar os times.`,
    drawError: 'Não conseguimos sortear os times agora. Tente de novo.',
    teamsDrawn: 'Times sorteados! 🎲',
    clearAllConfirm: 'Limpar tudo e começar de novo?',
  },

  // ============ PROFILE ============
  profile: {
    saved: 'Perfil atualizado!',
    saveError: 'Não conseguimos salvar seu perfil agora. Tente de novo.',
    photoRemoveConfirm: 'Remover foto de perfil?',
    privacySaveError: 'Não conseguimos salvar suas preferências de privacidade agora.',
  },

  // ============ NOTIFICATIONS ============
  notifications: {
    none: 'Sem notificações',
    noneDescription: 'Você verá aqui convites, mensagens, atualizações de eventos e mais.',
    markAllRead: 'Marcar todas como lidas',
  },
} as const;
