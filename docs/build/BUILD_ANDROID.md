# Build Android · Guia rápido

Este projeto usa [EAS Build](https://docs.expo.dev/build/introduction/) pra
gerar `.apk` (preview) e `.aab` (produção, pra Play Store).

## Pré-requisitos

1. Conta Expo (gratuita): https://expo.dev/signup
2. Conta Google Play Developer (já configurada)

## Setup inicial (1ª vez)

```bash
# 1. Instalar EAS CLI globalmente (ou usar via npx)
npm install -g eas-cli

# 2. Logar na conta Expo
npm run eas:login

# 3. Lincar o projeto ao seu account
npx eas-cli init
# → Cria/associa um projectId em app.json automaticamente
```

## Variáveis de ambiente (Secrets)

Algumas envs precisam ser configuradas como **secrets** na Expo (pra
não vazar nos builds públicos):

```bash
eas secret:create --name EXPO_PUBLIC_FIREBASE_API_KEY --value "..."
eas secret:create --name EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN --value "..."
eas secret:create --name EXPO_PUBLIC_FIREBASE_PROJECT_ID --value "timeco-e908e"
eas secret:create --name EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET --value "..."
eas secret:create --name EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID --value "..."
eas secret:create --name EXPO_PUBLIC_FIREBASE_APP_ID --value "..."
eas secret:create --name EXPO_PUBLIC_MAPBOX_TOKEN --value "pk.eyJ..."
eas secret:create --name EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID --value "..."
```

OU mais simples: copiar tudo de uma vez do seu `.env.production`:
```bash
eas secret:push --scope project --env-file .env.production
```

## Builds

### Preview (APK pra instalar manualmente em devices internos)
```bash
npm run eas:build:preview
```
Gera um `.apk` que você baixa e instala direto pra testes.

### Produção (AAB pra Play Store)
```bash
npm run eas:build:production
```
Gera um `.aab` (Android App Bundle) — formato exigido pela Play Store.

Ao terminar, a CLI mostra um link tipo:
```
✔ Build finished
🤖 Android app: https://expo.dev/artifacts/.../app-release.aab
```

## Subir na Play Console

### Opção A — Manual (1ª vez)
1. Baixa o `.aab` do link
2. Acessa https://play.google.com/console
3. Cria/abre o app, vai em "Closed testing" → cria release → faz upload

### Opção B — Automatizado via EAS Submit
```bash
npm run eas:submit
```
Requer setup adicional (service account JSON da Play Console). Ver:
https://docs.expo.dev/submit/android/

## Cronograma realista

| Etapa | Tempo |
|-------|-------|
| Build EAS preview | ~15-25 min (queue + build) |
| Testar APK manualmente | 30 min |
| Build EAS production (AAB) | ~15-25 min |
| Closed Testing na Play Console | 14 dias com 12 testers |
| Revisão Google → produção | 2-7 dias |

## Versionamento

`eas.json` está com `autoIncrement: true` no profile production —
cada build aumenta o `versionCode` (Android) automaticamente.

A `version` (ex: 1.0.0) em `app.json` continua manual: você incrementa
quando faz mudanças relevantes (ex: 1.1.0 pra novas features).
