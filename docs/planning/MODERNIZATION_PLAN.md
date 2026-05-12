# Plano de Modernização Timeco

> **Decisão estratégica (2026-05-09)**: Caminho A — Web first com Mantine + Native com React Native Paper.
>
> Mantém a separação atual (`.tsx` native + `.web.tsx` web) que sabemos que funciona em mobile browser, mas troca o HTML inline puro por componentes de bibliotecas modernas — eliminando o "ar caseiro" sem reintroduzir o crash do `react-native-web`.

---

## Por que essa estratégia

### Contexto
- Em maio/2026 sofremos crash `STATUS_ILLEGAL_INSTRUCTION` em mobile browsers com `react-native-web@0.21.x` no Expo SDK 54
- Migramos 26 telas pra `.web.tsx` com `<div>` + inline styles — funcionou
- Resultado visual: funcional mas básico, sem componentes modernos

### Análise comparativa com FitAdmin
- FitAdmin usa **mesma stack base** (Expo 54 + RN 0.81 + react-native-web)
- Mas usa **react-native-paper** (Material Design 3) em vez de componentes puros
- FitAdmin **NÃO crasha** em mobile browsers
- Hipótese: o crash do Timeco pode ter sido por padrão de uso (10+ Avatars aninhados, StyleSheet em render, Proxy de `colors`) e não pela biblioteca em si

### Decisão final
Não vamos arriscar voltar pra `react-native-web` em massa. Em vez disso:
- **Web (.web.tsx)**: usa **Mantine v8** (componentes web nativos, DOM puro, sem RN-web)
- **Native (.tsx)**: usa **react-native-paper** (igual FitAdmin, Material Design)
- App fica polido em ambas plataformas, sem reintroduzir o risco de crash

---

## Fases de execução

### Fase 0 — Quick wins (sem dependências novas)
- [ ] **ErrorBoundary global** em `App.tsx`
  - Captura erros de render em qualquer tela
  - Mostra fallback elegante (botão "Voltar pro início")
  - Loga erro no console / Firebase
- [ ] **Badge + StreakBadge** components (web + native)
  - Badge: tag colorida com texto (status, contador)
  - StreakBadge: 🔥 com número de dias consecutivos
- [ ] **Toast/Snackbar system**
  - Substitui `window.confirm()` e `alert()` por toasts modernos
  - Web: implementação própria com estado global (zustand)
  - Native: `Snackbar` do RNP depois
- [ ] **Centralizar strings em `src/constants/messages.ts`**
  - Todos os textos pt-BR num único arquivo
  - Facilita manutenção e futura tradução

### Fase 1 — Web modernization (Mantine)
- [ ] Instalar dependências:
  - `@mantine/core` `@mantine/hooks` `@mantine/notifications` `@mantine/modals`
  - `@tabler/icons-react` (ícones)
- [ ] Setup `MantineProvider` em `App.web.tsx` (ou `App.tsx` com Platform check)
- [ ] Mapear paleta do Timeco → tema do Mantine
- [ ] Migrar componentes:
  - [ ] `HtmlButton` → wrap `Button` do Mantine
  - [ ] `HtmlInput` → wrap `TextInput` / `Textarea` / `Select`
  - [ ] `HtmlCard` → wrap `Card` ou `Paper`
  - [ ] `HtmlAvatar` → wrap `Avatar`
  - [ ] `HtmlEmpty` → manter (simples)
  - [ ] `HtmlEventForm` → migrar form components
- [ ] Substituir `window.confirm/alert` por `modals.openConfirmModal()` e `notifications.show()`
- [ ] Adicionar componentes que não existiam:
  - `Modal` real (com focus trap, ESC fecha) substituindo lightbox manual
  - `DatePicker` / `TimePicker` modernos no EventForm
  - `Combobox` em SportPicker / FriendPicker
  - `Tooltip` em ações
  - `Skeleton` em loadings

### Fase 2 — Native modernization (React Native Paper)
- [ ] Instalar `react-native-paper`
- [ ] Setup `PaperProvider` em `App.tsx`
- [ ] Mapear paleta do Timeco → tema do RNP
- [ ] Migrar componentes nativos:
  - [ ] `Button` → wrap `Button` do RNP
  - [ ] `Input` → wrap `TextInput` do RNP
  - [ ] `Card` → wrap `Card` do RNP
  - [ ] `Avatar` → wrap `Avatar` do RNP (com Avatar.Image / Avatar.Text)
  - [ ] `Header` → usar `Appbar.Header`
- [ ] Adicionar `Snackbar` global pra feedbacks
- [ ] Adicionar `FAB` (Floating Action Button) onde fizer sentido (criar evento)
- [ ] Adicionar `Dialog` real substituindo Alert.alert

### Fase 3 — Polish e testes
- [ ] Verificar dark mode em todas as telas (web + native)
- [ ] Verificar contraste WCAG AA nas cores
- [ ] Testar em mobile browser real (várias telas)
- [ ] Testar em APK em device físico
- [ ] Limpar código legado (`src/components/web/HtmlAssets.tsx` etc — manter só o necessário)
- [ ] Atualizar memória `feedback_web_html_puro.md` com o novo padrão

---

## Estimativa

| Fase | Esforço | Risco |
|---|---|---|
| Fase 0 | 2-3h | Zero |
| Fase 1 | 6-8h | Baixo (pode ter ajustes finos de tema) |
| Fase 2 | 4-5h | Baixo |
| Fase 3 | 2-3h | Baixo |
| **Total** | **14-19h** | **Baixo** |

---

## Notas

- **Por que Mantine e não shadcn?** Shadcn requer Tailwind, que adiciona setup complexo no Expo Web. Mantine traz CSS próprio, é self-contained, e tem todos os componentes que precisamos (Modal, Notifications, DatePicker, Combobox).

- **Por que RNP no native em vez de NativeBase ou Tamagui?** RNP é Material Design oficial pro RN, maduríssimo, baixo bundle, ótima acessibilidade. NativeBase tá em hiato. Tamagui é poderoso mas tem incompat com React 19 / SDK 54 (testamos durante a saga do crash).

- **Quebrar paridade web/native?** Não. Os arquivos `.tsx` e `.web.tsx` recebem componentes diferentes (RNP vs Mantine), mas a UX/funcionalidade fica idêntica. Stores/services/types continuam compartilhados.
