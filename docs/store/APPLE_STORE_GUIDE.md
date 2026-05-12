---
title: Guia de Publicação no Apple App Store — Timeco iOS
date: 2026-05-10
---

# Guia: Publicar o Timeco na Apple App Store (iOS)

> Passo-a-passo completo do zero até o app aprovado em produção. Baseado na stack atual do projeto (Expo SDK 54 + EAS Build + React Native 0.81). Não precisa de Mac — todo o build é feito na nuvem pelo EAS.

---

## 📋 Pré-requisitos

| Item | Custo | Onde obter |
|---|---|---|
| **Conta Apple Developer Program** | **US$ 99/ano** (~R$ 550) | https://developer.apple.com/programs |
| Identidade Apple (Apple ID) | Grátis | https://appleid.apple.com |
| Acesso ao EAS Build | Você já tem (free tier dá ~15 builds/mês) | https://expo.dev |
| iPhone físico ou simulador | Opcional (TestFlight funciona em qualquer iOS 16+) | — |
| Domínio com URL pública (privacy + suporte) | Já tem (timeco.com.br) | — |
| Ícone 1024×1024 PNG (sem transparência) | Já tem em `assets/_play-store/icon-512.png` (precisa upscalar) | — |
| 6 screenshots por device size | Vai precisar tirar | DevTools / device real |

---

## 🗺️ Visão geral do fluxo

```
1. Cria conta Apple Developer ($99) ──── leva 24-48h pra aprovar
       │
       ▼
2. Cria App ID + App em App Store Connect (web)
       │
       ▼
3. Configura iOS no app.json + EAS (certificados auto)
       │
       ▼
4. Build na nuvem com EAS Build
       │
       ▼
5. Sobe pro TestFlight (auto via `eas submit`)
       │
       ▼
6. Teste interno (você + equipe, até 100 pessoas, instantâneo)
       │
       ▼
7. Teste externo opcional (até 10k testadores, precisa aprovação Apple ~1 dia)
       │
       ▼
8. Submete pra revisão da App Store
       │
       ▼
9. App Review (24h-7 dias) ──── pode rejeitar e exigir ajustes
       │
       ▼
10. App vai pra produção ✅ disponível pra bilhões de iPhones
```

---

## 🚀 Fase 1 — Conta Apple Developer

1. Acessa **https://developer.apple.com/programs/enroll**
2. Faz login com seu Apple ID (ou cria um se não tem)
3. Escolhe o tipo de conta:
   - **Indivíduo** — mais simples, app sai com seu nome
   - **Organização** — sai com nome da empresa, precisa de DUNS Number (~3 dias extras)
4. Paga **US$ 99/ano** (cartão de crédito internacional)
5. Apple verifica seu cadastro (24-48h)
6. Quando aprovar, você recebe email com acesso ao **App Store Connect**

> ⚠️ A taxa é anual — se atrasar o pagamento, o app SAI da loja automaticamente.

## 🛠️ Fase 2 — Criar o app em App Store Connect

1. Acessa **https://appstoreconnect.apple.com**
2. Vai em **"Meus apps" → "+" → "Novo app"**
3. Preenche:
   - **Plataformas**: iOS
   - **Nome**: `Timeco · Times equilibrados` (deve ser único globalmente)
   - **Idioma principal**: Português (Brasil)
   - **Bundle ID**: `com.timeco.app` (mesmo já configurado no app.json)
   - **SKU**: qualquer string única (ex: `timeco-001`)
   - **Acesso de usuário**: Acesso completo
4. Clica **Criar**

Depois preenche o **"Informações do app"**:
- Categoria primária: **Esportes**
- Categoria secundária: **Estilo de vida**
- URL da política de privacidade: `https://timeco.com.br/privacy` (você já tem)
- URL de suporte: `https://timeco.com.br/support`
- Direitos autorais: `2026 Timeco`
- Idade: 4+ (sem conteúdo restrito)

## ⚙️ Fase 3 — Configurar iOS no projeto

No `app.json` (parte iOS já existe), confirma estes campos:

```json
"ios": {
  "bundleIdentifier": "com.timeco.app",
  "buildNumber": "1",
  "supportsTablet": true,
  "infoPlist": { ... permissions ... }
}
```

No `eas.json`, garante que o profile **production** tenha iOS:

```json
"production": {
  "ios": { "autoIncrement": true }
}
```

Login no EAS no terminal:
```bash
eas login
```

Depois conecta o EAS ao seu Apple Developer Account:
```bash
eas credentials
# Escolhe: iOS → production → fornecer Apple ID e senha
# EAS gera automaticamente: certificado, provisioning profile, etc.
```

## 📦 Fase 4 — Build na nuvem com EAS

Roda o build pra iOS:

```bash
npm run eas:build:production -- --platform ios
# ou diretamente: eas build --platform ios --profile production
```

EAS cuida de tudo:
- Compila o app nativo na nuvem (não precisa de Mac)
- Assina com seu certificado
- Gera o `.ipa` final
- Demora ~15-25min na free tier

Quando terminar, você recebe o link do `.ipa` no terminal e por email.

## 🧪 Fase 5 — TestFlight (obrigatório antes de produção)

Submete o `.ipa` pra TestFlight:

```bash
eas submit --platform ios --latest
```

EAS faz upload automático pro App Store Connect. Após 5-15 minutos:

1. Volta no App Store Connect → seu app → aba **TestFlight**
2. Aceita o "Export Compliance" (declara que o app NÃO usa criptografia além de HTTPS padrão — verdade pro Timeco)
3. Cria um **Grupo interno**: adiciona seu Apple ID + equipe (até 100 pessoas)
4. Eles recebem email e instalam o app **TestFlight** (app oficial da Apple) na App Store
5. Pelo TestFlight aceitam o convite e instalam o Timeco em beta

> 💡 **Diferente do Google Play**, o teste interno do iOS é **instantâneo** e **não conta como tempo de teste** pra produção. Você pode ir direto pra revisão se quiser.

**(Opcional)** Pra teste externo (até 10.000 testadores), submete o build pra revisão simplificada da Apple (~1 dia). Não obrigatório pra publicar.

## 📤 Fase 6 — Submeter pra App Store (produção)

Volta no App Store Connect → seu app → aba **App Store**:

1. **Idioma**: Português (BR)
2. **Promotional text** (170 chars): "Crie eventos esportivos e sorteie times equilibrados em segundos. Vôlei, futsal, basquete, futebol e muito mais."
3. **Description**: copia da `PLAY_STORE_LISTING.md` (mesmo texto que já mandou pra Google)
4. **Keywords** (100 chars, separadas por vírgula): `times,esportes,sorteio,futsal,volei,basquete,futebol,pelada,jogos,amigos`
5. **URL de suporte**: `https://timeco.com.br/support`
6. **URL de marketing**: `https://timeco.com.br`
7. **Screenshots**: precisa de 6 imagens em pelo menos 1 tamanho:
   - **iPhone 6.7"** (1290×2796) — iPhone 14/15/16 Pro Max
   - **iPhone 5.5"** (1242×2208) — iPhone 8 Plus
   - Use Chrome DevTools com iPhone 14 Pro Max ou tire do device real
8. **Ícone**: 1024×1024 PNG, sem transparência, sem cantos arredondados (Apple arredonda automático)
9. **Build**: clica em "+" e seleciona o build que subiu no TestFlight

Aba **App Review Information**:
- Conta de teste: `teste@timeco.com.br` / `teste123` (a mesma que já criou pra Google)
- Notas pra revisor: "App de sorteio de times para esportes. Para testar o fluxo completo, use a conta de teste fornecida."

Aba **Version Release**:
- Lançamento automático após aprovação (recomendado)

Clica em **"Enviar para análise"**.

## ⏳ Fase 7 — App Review

- Apple revisa em **24h a 7 dias** (média 1-2 dias em 2026)
- Você acompanha pelo App Store Connect
- Status possíveis:
  - ✅ **Approved** → app vai pra loja automaticamente (ou no horário que você definiu)
  - ❌ **Rejected** → eles explicam o motivo, você ajusta e re-submete (fluxo rápido, sem voltar pro TestFlight necessariamente)

**Motivos comuns de rejeição** (cuidar pro Timeco):
1. Login obrigatório sem opção "guest" → Apple exige que apps com login social ofereçam **"Sign in with Apple"** se já tiver Google. Adicionar isso no projeto.
2. Privacy policy faltando ou incompleta → confere `timeco.com.br/privacy`
3. Bug reproduzível no fluxo principal → testar bem antes de submeter
4. Screenshots desatualizadas/genéricas
5. Categoria errada

---

## 💰 Custos resumidos

| Item | Custo |
|---|---|
| Apple Developer Program | **US$ 99/ano** |
| EAS Build (15 builds/mês free) | **Grátis** (suficiente pra começar) |
| Domínio (já tem) | — |
| TestFlight | **Grátis** |
| App Store hosting | **Grátis** |
| **Total ano 1** | **~R$ 550** |

---

## 🍎 Particularidades vs Google Play

| Tópico | Google Play | Apple App Store |
|---|---|---|
| Taxa | US$ 25 vitalícia | **US$ 99/ano** |
| Tempo de teste obrigatório | 12 testers × 14 dias | **Nenhum** (TestFlight é opcional) |
| Tempo de revisão | 1-3 dias | 1-2 dias |
| Rejeição comum | Política de dados | **Sign in with Apple obrigatório** se tem outro login social |
| Build | EAS gera AAB | EAS gera `.ipa` |
| Beta público | Open Test | TestFlight External |

---

## ⚠️ TODO específico do Timeco antes de submeter

1. **Adicionar "Sign in with Apple"** no app (obrigatório pra Apple se já tem Google login)
   - `npm install expo-apple-authentication`
   - Adicionar plugin no `app.json` + nova capability no Apple Developer
2. **Confirmar permissões iOS no `app.json`**:
   - `NSCameraUsageDescription` ✅ já tem
   - `NSPhotoLibraryUsageDescription` ✅ já tem
   - `NSLocationWhenInUseUsageDescription` ✅ já tem
3. **Verificar Firebase iOS config**:
   - Baixar `GoogleService-Info.plist` no Firebase Console
   - Adicionar no projeto + plugin
4. **Push notifications iOS**:
   - Criar APNs Authentication Key no Apple Developer
   - Configurar no Firebase Cloud Messaging
5. **Screenshots reais** em iPhone 14 Pro Max (1290×2796) — pelo menos 3 (recomendado 6)
6. **Ícone 1024×1024** sem transparência (você tem em 512, precisa upscalar/regenerar)

---

## 🎯 Estimativa de tempo total

| Etapa | Tempo |
|---|---|
| Setup Apple Developer + verificação | 1-3 dias |
| Configurar app no App Store Connect | 30 min |
| Adicionar Sign in with Apple no código | 2-4h |
| Build EAS iOS | 25 min (uma vez) |
| Subir pro TestFlight + testar | 1h |
| Preencher metadata + screenshots | 1-2h |
| Submeter + aguardar review | 1-3 dias |
| **Total realista** | **5-10 dias** |

---

Boa sorte! 🚀 Quando começar, sugiro fazer cada fase numa sessão separada — é melhor que tentar tudo num dia.
