# Timeco — Estado do projeto

App multi-esporte para sorteio de times equilibrados. Stack: Expo + React Native + Firebase + TypeScript strict. Web em `timeco-eosin.vercel.app` (deploy da branch `prd`); landing em `timeco.com.br` (repo sibling `c:/Git/timeco-landing-page`).

---

## 🟢 Submissão Play Store — RETOMADA em 2026-05-03 (versão 1.1.0)

### ✅ Concluído na retomada
- Bump 1.0.0 → **1.1.0** (commits dev `465e1f4` / prd `139b52f`)
- Deploy das Firestore + Storage rules em produção (`npm run deploy:rules`)
- AAB de produção em build no EAS (build ID inicial `379f486c-12ed-47ce-b9db-142710233d96`)

### ✅ Já feito na Play Console (continua valendo)
- App criado: pacote `com.timeco.app`, nome `Timeco · Times equilibrados`
- Acesso de apps: credencial de teste `teste@timeco.com.br` / `teste123` declarada
- Classificações de conteúdo (Livre)
- Segurança dos dados (5 etapas)
- Apps de saúde: "sem recursos"
- Configurações da loja (Esportes + contato)
- Página "Detalhes do app": textos + ícone 512x512 + feature graphic 1024x500

### ⏳ Pendente — Leonardo precisa fazer
1. **Criar conta `teste@timeco.com.br`** no Firebase Auth produção (Console → Authentication → Add user). Sem ela o revisor Google trava.
2. **Itens do menu "Conteúdo do app"** na Play Console:
   - Política de privacidade → `https://timeco.com.br/privacy`
   - Anúncios → "Não contém anúncios"
   - Público-alvo → 13-15, 16-17, 18+
   - Apps governamentais → "Não"
   - Recursos financeiros → "Não"
3. **Screenshots** (mínimo 2). Chrome F12 + Pixel 7 em `https://timeco-eosin.vercel.app`. Salvar em `assets/_play-store/screenshots/`.
4. **Subir AAB em Teste Interno** após o build terminar
5. **Adicionar testadores** (mínimo seu próprio email)

### ⏳ Ciclo obrigatório
- **Teste Fechado**: 12 testers × 14 dias corridos (exigência Google pra contas novas)
- Depois libera "Solicitar produção"

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
| Página pública de perfil | `timeco.com.br/u/[userId]` |

---

## 🛠️ Build & deploy

- **Web (Vercel):** branch `prd` → deploy automático em `timeco-eosin.vercel.app`. Script `build:web` chama `expo export --platform web`. `EXPO_PUBLIC_*` injetadas via env vars do dashboard.
- **Android (EAS):** `eas.json` tem 3 profiles. Production gera AAB com `autoIncrement: true` e `appVersionSource: "remote"` (versão controlada pelo EAS).
- **Cloud Functions:** `onNotificationCreated` escrita mas não deployada (falta Blaze plan).
- **SHA-1 da keystore:** `15:58:99:2A:23:51:F9:D8:06:5A:18:FA:60:21:C1:60:E0:32:37:6A`

## 🔄 Workflow de desenvolvimento

```bash
# Local (Firebase produção, web na 8095)
git checkout dev
npm run dev

# Promover pra Vercel
git checkout prd
git merge dev
git push origin prd   # Vercel rebuilda em ~1-2min

# Build AAB pra Play Store
npm run eas:build:production
```

---

## 📊 Cobertura de testes

**417 testes em 30 suítes** (100% verde). Inclui:
- Validators (84 testes — email, ranges, dates)
- errorMessages (24 testes — Firebase code mapping pra pt-BR)
- Smoke tests caixa-preta (33 testes — fluxo evento + scoreboard + erros)
- Services puros: scoreboardLogic, teamDraw, userStats, etc

Type-check sempre limpo via `npx tsc --noEmit`.
