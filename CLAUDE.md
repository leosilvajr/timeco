# Timeco — Estado do projeto

App multi-esporte para sorteio de times equilibrados. Stack: Expo + React Native + Firebase + TypeScript strict. Web em `timeco-eosin.vercel.app` (deploy da branch `prd`); landing em `timeco.com.br` (repo sibling `c:/Git/timeco-landing-page`).

---

## 🟡 Submissão Play Store — PAUSADA em 2026-05-03

Snapshot do progresso. Quando voltar pra retomar, o que tá ✅ não precisa refazer (Play Console preserva).

### ✅ Já feito na Play Console
- App criado: pacote `com.timeco.app`, nome `Timeco · Times equilibrados`
- Acesso de apps: credencial de teste `teste@timeco.com.br` / `teste123`
- Classificações de conteúdo: categoria "Todos os Outros Tipos de Aplicações", questionário respondido (resultado esperado: Livre)
- Segurança dos dados: 5 etapas. Tipos marcados: Local exato, Nome, Email, ID do usuário, Outras informações, Mensagens em apps, Fotos, Interações no app, ID do dispositivo. (Saúde NÃO marcado, pra ficar consistente com "Apps de saúde = sem recursos")
- Apps de saúde: "Meu app não tem recursos de saúde"
- Configurações da loja: Categoria Esportes; contato `dev07@pratickosolucoes.com.br` + `+55 17 99285-0093` + `https://timeco.com.br`; marketing externo ativo
- Página "Detalhes do app": textos + ícone 512x512 + feature graphic 1024x500 (textos em [PLAY_STORE_LISTING.md](PLAY_STORE_LISTING.md))

### ⏳ Pendente no menu lateral "Conteúdo do app"
- **Política de privacidade** → URL: `https://timeco.com.br/privacy`
- **Anúncios** → "Não, meu app não contém anúncios"
- **Público-alvo e conteúdo** → faixas 13-15, 16-17, 18+ (NUNCA marcar <13, vira COPPA)
- **Apps governamentais** → "Não"
- **Recursos financeiros** → "Não"

### ⏳ Pendente — outros
- Screenshots do app (mínimo 2). Estratégia: Chrome DevTools mobile (Pixel 7) em `https://timeco-eosin.vercel.app` — Login, Home, Criar evento, Sorteio, Placar, Galeria
- AAB de produção: `npm run eas:build:production` (~15min na nuvem EAS)
- Upload AAB em **Teste Interno** (sem mínimo de testers)
- Recrutar 12 testadores
- **Teste Fechado**: 12 testers x 14 dias (exigência Google pra contas novas, não tem como pular)
- Solicitar acesso à **Produção**

### ⚠️ Antes de submeter pra revisão
A última tentativa de login com `teste@timeco.com.br` retornou `INVALID_LOGIN_CREDENTIALS`. **Conferir** se essa conta foi criada no Firebase Auth de produção (`timeco-e908e`) — sem ela, o revisor da Google trava. Criar via Console Firebase ou via signup do app.

---

## 🔑 Recursos prontos

| Item | Local |
|---|---|
| Ícone 512x512 | `assets/_play-store/icon-512.png` |
| Feature graphic 1024x500 | `assets/_play-store/feature-graphic.png` |
| Listing texts | [PLAY_STORE_LISTING.md](PLAY_STORE_LISTING.md) |
| Build guide Android | [BUILD_ANDROID.md](BUILD_ANDROID.md) |
| Landing | `c:/Git/timeco-landing-page` (Next.js → timeco.com.br) |
| Páginas legais | landing/`/privacy`, `/terms`, `/delete-account`, `/support` |

---

## 🛠️ Build & deploy

- **Web (Vercel):** branch `prd` → deploy automático em `timeco-eosin.vercel.app`. Script `build:web` chama `expo export --platform web`. Vercel injeta `EXPO_PUBLIC_*` automaticamente das env vars do dashboard (não copiar `.env.production`).
- **Android (EAS):** `eas.json` tem profiles `development`, `preview`, `production`. Production gera AAB. Google OAuth Client IDs já cadastrados como EAS secrets. SHA-1 da keystore: `15:58:99:2A:23:51:F9:D8:06:5A:18:FA:60:21:C1:60:E0:32:37:6A`.
- **Cloud Functions:** `onNotificationCreated` escrita em `functions/src/index.ts` mas **não deployada** (falta plano Blaze no Firebase).

## 🔄 Workflow de desenvolvimento

```bash
# Local (Firebase produção, web na 8095)
git checkout dev
npm run dev

# Promover pra Vercel
git checkout prd
git merge dev
git push origin prd   # Vercel rebuilda em ~1-2min
```

---

## 🎯 Estratégia atual

Leonardo decidiu **adicionar mais features e testar via Vercel** antes de subir AAB e iniciar o ciclo obrigatório de Teste Fechado (14 dias). Não faz sentido começar o ciclo com produto incompleto.
