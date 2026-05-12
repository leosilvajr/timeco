# 🧹 Cleanup Plan — Timeco

> Gerado em 2026-05-12 na branch `chore/cleanup-organize`.
> Status: **executado** (opções A em todas as 3 decisões). Sem commit/push.

---

## 1. Estado atual do git

```
On branch chore/cleanup-organize  (criada a partir de dev, working tree limpo)
Branches: main, dev (atual), prd, chore/cleanup-organize
```

## 2. Estrutura atual (raiz, 1 nível)

```
timeco/
├── .env                       (gitignored, ok)
├── .env.example
├── .expo/                     (gitignored, ok)
├── .firebaserc
├── .gitignore
├── .vercel/                   (gitignored, ok)
├── App.tsx                    ← entry (referenciado por index.ts)
├── App.web.tsx                ← entry web
├── BUILD_ANDROID.md           ← doc, candidato a mover
├── CLAUDE.md                  ← doc, fica na raiz
├── PLAY_STORE_LISTING.md      ← doc, candidato a mover
├── README.md                  ← doc, fica na raiz
├── android/  (não existe — vai ser gerado pelo EAS)
├── app.json
├── assets/
│   ├── README.md
│   ├── _play-store/           (icon-512, feature-graphic)
│   ├── _source/               (1 png fonte da Gemini)
│   └── (10 PNGs de ícone/splash/logo/favicon)
├── babel.config.js
├── dist/                      (gitignored, ok)
├── docker/
│   └── Dockerfile.emulators
├── docker-compose.yml
├── docs/
│   ├── APPLE_STORE_GUIDE.md
│   ├── APPLE_STORE_GUIDE.pdf  ← 855KB, duplica .md
│   ├── MODERNIZATION_PLAN.md
│   ├── PLAY_STORE_TESTERS.md
│   └── _archive/
│       └── lucasscout.html    ← POC antigo (195KB)
├── eas.json
├── firebase.json
├── firestore.indexes.json
├── firestore.rules            ← gerado pelo script deploy:rules (cp .dev)
├── firestore.rules.dev        ← usado pelo deploy:rules
├── firestore.rules.production ← usado pelo deploy:rules
├── functions/                 (cloud functions — pacote independente)
├── index.ts                   ← entry: registerRootComponent(App)
├── jest.config.js
├── metro.config.js
├── node_modules/              (gitignored)
├── package.json
├── package-lock.json
├── scripts/
│   ├── check-contrast.ts
│   ├── generate-assets.py
│   ├── generate-feature-graphic.py
│   └── seed-emulators.js      ← usado por docker:seed
├── src/                       ← código-fonte (NÃO MEXER)
├── storage.rules
├── tsconfig.json
├── tsconfig.test.json
└── vercel.json
```

## 3. Arquivos `.md` tracked (8 totais)

| Caminho atual | Conteúdo | Destino proposto |
|---|---|---|
| `README.md` | README do repo | **fica na raiz** |
| `CLAUDE.md` | Instruções pro Claude Code (estado do projeto) | **fica na raiz** |
| `BUILD_ANDROID.md` | Guia de build Android (EAS) | `docs/build/BUILD_ANDROID.md` |
| `PLAY_STORE_LISTING.md` | Textos da listing Play Store | `docs/store/PLAY_STORE_LISTING.md` |
| `docs/APPLE_STORE_GUIDE.md` | Guia Apple Store | `docs/store/APPLE_STORE_GUIDE.md` |
| `docs/PLAY_STORE_TESTERS.md` | Lista de testers internos | `docs/store/PLAY_STORE_TESTERS.md` |
| `docs/MODERNIZATION_PLAN.md` | Roadmap de modernização | `docs/planning/MODERNIZATION_PLAN.md` |
| `assets/README.md` | Descrição dos assets | **fica em assets/** |

> ⚠️ **Atenção**: `CLAUDE.md` linka pra `BUILD_ANDROID.md` e `PLAY_STORE_LISTING.md`. Se você aprovar o move, preciso atualizar esses 2 links — mas o prompt diz "não modifique conteúdo dos .md". **Marque uma das opções:**
> - **(A)** Mover os 2 docs + atualizar os 2 links em `CLAUDE.md` (mudança mínima de path).
> - **(B)** Deixar `BUILD_ANDROID.md` e `PLAY_STORE_LISTING.md` na raiz e só organizar o que está em `docs/`.

## 4. Lixo óbvio (zero impacto) — proposta de deleção

**Nenhum lixo óbvio commitado encontrado.**

- `dist/`, `.expo/`, `.vercel/`, `node_modules/` — já gitignored, presentes só localmente.
- Nenhum `.log`, `.DS_Store`, `*.bak`, `*.tmp`, `copy`, `(1)`, `untitled` tracked.
- Pastas vazias: nenhuma.

## 5. Candidatos duvidosos (precisam da sua decisão)

| Item | Tamanho | Análise |
|---|---|---|
| `docs/APPLE_STORE_GUIDE.pdf` | 855 KB | Versão PDF do `.md` adjacente. Inflam o repo. Sugiro **mover pra `_to-review/`** — usuário decide se mantém o PDF (caso seja distribuído fora do repo) ou se basta o `.md`. |
| `docs/_archive/lucasscout.html` | 195 KB | POC HTML antigo do scout de vôlei (anterior à implementação real em React). Já em `_archive`. Sugiro **manter em `docs/_archive/`** — é histórico. |
| `assets/_source/Gemini_Generated_Image_eeija0eeija0eeij.png` | ? | Imagem fonte gerada por IA que originou os ícones. Útil pra regenerar variants. **Manter**. |
| `firestore.rules` | — | É **regenerado** pelo script `deploy:rules` (copiando `.dev` → `.rules`). Tracked com conteúdo do `.dev`. **Manter** (já está no fluxo). |

## 6. Pastas que pareciam temporárias — análise

| Pasta | Status |
|---|---|
| `docs/_archive/` | Não é lixo — é arquivo histórico explícito. Manter. |
| `assets/_source/` | Source-of-truth dos assets gerados. Manter. |
| `assets/_play-store/` | Ícone 512 + feature graphic 1024x500. Referenciados em `CLAUDE.md`. Manter. |
| `docker/` | Dockerfile dos emuladores Firebase, usado por `docker:up`. Manter. |
| `functions/` | Cloud Functions (pacote npm próprio). Manter. |
| `scripts/` | Todos referenciados ou úteis: `seed-emulators.js` (docker:seed), `generate-assets.py` (build de ícones), `generate-feature-graphic.py` (feature graphic 1024x500), `check-contrast.ts` (a11y). Manter. |

## 7. Estrutura final proposta

```
timeco/
├── .env*, .firebaserc, .gitignore, .vercel/
├── App.tsx, App.web.tsx, index.ts
├── README.md                              ← fica
├── CLAUDE.md                              ← fica
├── app.json, babel.config.js, eas.json, ...
├── docker/, docker-compose.yml
├── docs/
│   ├── README.md                          ← NOVO: índice navegável
│   ├── CLEANUP_PLAN.md                    ← este arquivo
│   ├── build/
│   │   └── BUILD_ANDROID.md               ← movido da raiz (opção A)
│   ├── store/
│   │   ├── PLAY_STORE_LISTING.md          ← movido da raiz (opção A)
│   │   ├── PLAY_STORE_TESTERS.md          ← movido de docs/
│   │   └── APPLE_STORE_GUIDE.md           ← movido de docs/
│   ├── planning/
│   │   └── MODERNIZATION_PLAN.md          ← movido de docs/
│   └── _archive/
│       └── lucasscout.html                ← intacto
├── _to-review/                            ← criado SE você marcar PDF como duvidoso
│   └── APPLE_STORE_GUIDE.pdf
├── functions/, scripts/, src/, assets/
├── firebase.json, firestore.*, storage.rules
├── jest.config.js, metro.config.js
├── package.json, package-lock.json, tsconfig*.json, vercel.json
```

## 8. `.gitignore` — proposta de adições

Já cobre tudo: `.expo/`, `dist/`, `.vercel`, `coverage`, `*.log`, `node_modules/`, `.env*` (com whitelist do `.env.example`).
**Sugestão**: adicionar `.DS_Store` (não está, e é boa prática mesmo no Windows pra prevenir commits acidentais quando alguém abrir em Mac).

## 9. Pendências para sua decisão

| # | Decisão | Opções |
|---|---|---|
| 1 | Mover `BUILD_ANDROID.md` e `PLAY_STORE_LISTING.md` da raiz? | (A) mover e ajustar 2 links em CLAUDE.md / **(B) deixar na raiz** |
| 2 | O que fazer com `APPLE_STORE_GUIDE.pdf` (855KB)? | (A) mover pra `_to-review/` / (B) mover pra `docs/store/` junto com o .md / (C) manter onde está |
| 3 | Adicionar `.DS_Store` ao `.gitignore`? | (A) sim / (B) não |

---

**👉 Aguardando suas respostas pras 3 pendências antes de executar a Etapa 3.**
Quando responder (ex.: `1A, 2A, 3A`), eu executo: cria `docs/{build,store,planning}/`, faz os `git mv`, gera `docs/README.md` com índice, ajusta `.gitignore`, roda `typecheck` + `test`, e faz commits atômicos. Não dou push.
