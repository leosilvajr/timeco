# Changelog

## [1.2.0] — 2026-05-15

### 🚀 Novidades principais

#### Vôlei Avançado (Scout)
- **Sistema completo de pontuação** com 22 ações por categoria: saque, ataque, passe, bloqueio, levantamento
- **Bola de 2ª** (dump) adicionada ao card de Levantamento — registra ponto/normal/erro do levantador atacando
- **Tabs de jogadores verticais** com seções "🏐 Em quadra" (6 da rotação) e "🪑 Banco" — seleção mais rápida durante a partida
- **Painel "Como funciona o Scout?"** na tela Nova partida explicando cada ação e código de cores
- **UI otimista**: contadores atualizam instantaneamente, persistência sincroniza em background
- **Estatísticas por set**: chips clicáveis pra ver Set 1, Set 2, Set 3 separados ou Visão geral
- **Dashboard do time**: ao clicar no time em Meus Times, abre KPIs (vitórias, taxa, sets, pontos), eficiências (ataque/saque/passe/bloqueio %), destaques (top pontuador/sacador/bloqueador/passador) e últimas 10 partidas
- **Exportar PDF** do relatório da partida com share nativo (WhatsApp/Telegram/email)
- **Regras FIVB** implementadas: set decisivo 15 pts, margem mínima 2, banners SET POINT / MATCH POINT, modo read-only após finalização
- **Ciclo de vida**: status Em breve / Em andamento / Finalizada (Em breve aparece pra partidas com data futura)

#### Modo offline (offline-first)
- **Firestore offline persistence** habilitado: registra Scout sem internet, sincroniza ao voltar
- **Badge 📴 OFFLINE** no topo da tela quando perde conexão
- **Contador "⏳ N ações aguardando sincronizar"** no Scout quando há writes em fila
- **Fila de upload de fotos** com retry automático quando volta online
- **Pre-fetch** das listas no login pra navegação offline funcionar mesmo após reiniciar app

#### Sistema de denúncia + bloqueio (compliance UGC)
- **🚩 Denunciar** disponível em: perfil de usuário, evento, mensagem do chat. 6 motivos: spam, inadequado, assédio, violência, fake, outro
- **🚫 Bloquear usuário** em perfil ou direto no header do chat
- **Filtro client-side** de mensagens de usuários bloqueados (chat web)
- **Tela "Usuários bloqueados"** em Configurações → Privacidade — gerencie e desbloqueie
- **Painel admin** (apenas superadmin) em Perfil → Painel super admin → Denúncias: lista por status, ações de revisada/tomei ação/descartar

### ⚡ Performance e estabilidade
- Cache TTL (30s) em listas Firestore — corta 80% das re-buscas em navegação
- Memoização de cálculos pesados no Dashboard
- React.memo nos componentes de lista
- Refactor estrutural: serviços e telas grandes quebradas em módulos focados
- Fix React error #310 no Dashboard de time (hook order)
- Build web bem mais responsivo

### 🛠️ Refactors técnicos (sem mudança visível)
- `volleyScoutService.ts` (544 LoC) dividido em 4 módulos: matchCRUD, scoutActions, matchLifecycle, matchHelpers
- 13 componentes extraídos de telas grandes (VolleyScout 735→363 LoC, ProfileHome 438→190, etc.)
- Hooks novos: `useNetworkStatus`, `usePendingWritesCount`
- Services novos: `volleyCacheService`, `offlinePrefetch`, `photoUploadQueueService`, `reportService`, `blockService`, `volleyRules`, `volleyTeamStats`, `volleyReportHtml`
- Cobertura: **443 testes** em 31 suítes (100% verde)

### 📦 Dependências adicionadas
- `expo-print` + `expo-sharing` (export PDF + share)
- `@react-native-community/netinfo` (detecção offline no native)
- `firebase-admin` + `tsx` (dev — pra scripts de seed/auth)

---

## [1.1.1] — 2026-05-03

- Bug fix de campo opcional em criação de eventos.
- Pequenos ajustes de UX.

## [1.1.0] — 2026-05-03

- Submissão inicial da Play Store. Modo Vôlei Avançado básico, eventos, sorteio de times, perfil público.
