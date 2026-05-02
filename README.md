# Timeco

App multi-esporte para criar eventos e sortear times equilibrados por estrelas.
Mobile-first (Expo / React Native) + Web (react-native-web + Vercel).

## Stack

| | |
|---|---|
| App (mobile + web) | React Native + Expo |
| Backend / Auth / DB | Firebase (Firestore + Auth) |
| Storage | Firebase Storage |
| Deploy web | Vercel (Expo Web export) |
| Linguagem | TypeScript strict |

## Ambientes

| | **Docker (dev local)** | **Producao** |
|---|---|---|
| Arquivo env | `.env.docker` | `.env.production` |
| Comando | `npm run dev` | `npm run prod` |
| Backend | Firebase Emulators (Docker) | Firebase real |
| Dados persistem? | Sim (volume Docker) | Sim (nuvem) |

### Dev (Docker)

```bash
docker compose up -d          # sobe Firebase emulators
npm run docker:seed            # popula dados de teste
npm run dev                    # abre web em http://localhost:8085
```

- **Emulator UI:** http://localhost:4003
- **Contas de teste:**
  - `admin@timeco.com` / `admin123` — super admin
  - `leo@timeco.com` / `leo12345` — usuário com vários amigos
  - Outros: `ana@`, `bruno@`, `carla@`, `diego@`, `eva@`, `felipe@`, `gabi@`, `hugo@` (senha na seed)

### Produção

1. `firebase projects:create timeco-prod` (ou via console)
2. Ativar **Authentication > Email/Senha**, **Firestore**, **Storage**
3. Copiar credenciais da app web pra `.env.production`
4. Subir regras: `cp firestore.rules.production firestore.rules && firebase deploy --only firestore:rules,firestore:indexes,storage`
5. Rodar local contra prod: `npm run prod`

## Deploy Web (Vercel)

Repo conectado à Vercel. O build usa `.env.production` e executa `expo export --platform web`, gerando `dist/`.

```bash
npm run build:web   # gera dist/
```

## Estrutura

```
src/
  components/      UI compartilhada (Button, Input, StarRating, ...)
  constants/       esportes, cores, tipografia
  navigation/      Auth + Tabs (Início, Jogos, Social, Perfil) + stacks
  screens/         Telas por domínio
  services/        firebase + services por domínio
  store/           zustand (auth, tema)
  types/           TypeScript types
docker/            Dockerfile dos emulators
scripts/           seed dos emulators
```

## Fluxo principal

1. **Início** — explicação do app
2. **Jogos** — lista eventos onde você é organizador ou convidado
3. **Social** — amigos + solicitações
4. **Perfil** — editar dados / super admin

### Criar e sortear times

1. Aba **Jogos** → `+` → escolha esporte, local, data, convide amigos
2. Os amigos confirmam presença na tela do evento
3. Organizador abre "Definir estrelas e sortear times"
4. Define 1-5 estrelas pra cada confirmado
5. Toca em "Sortear times" — o algoritmo usa snake-draft por peso (estrelas + ajustes opcionais de idade/altura)
6. Resultado mostra times com cor e total/média de estrelas; pode resortear à vontade
