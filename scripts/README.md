# Scripts

## seed-tanabeach-history.ts

Cria 15 partidas fake pro time **Tanabeach** com estatísticas realistas distribuídas por posição (levantador puxa sets, oposto/ponteiro puxam ataques, central puxa bloqueios, líbero puxa passes). Usado pra popular o histórico antes de testar Dashboard/Reports.

### Pré-requisitos

1. **`service-account.json`** na raiz do repo:
   - Firebase Console → Project Settings → **Service Accounts** → "Generate new private key"
   - Salva como `service-account.json` (já está no `.gitignore`)

2. **UID do dono do time** (ex.: `leosilvatanabi@gmail.com`):
   - Firebase Console → Authentication → Users → copia o "User UID" da linha

3. **Deps locais** (instala uma vez):
   ```bash
   npm i -D firebase-admin tsx
   ```

### Rodar

```bash
SERVICE_ACCOUNT=./service-account.json \
OWNER_UID=<uid-aqui> \
TEAM_NAME=Tanabeach \
NUM_MATCHES=15 \
npx tsx scripts/seed-tanabeach-history.ts
```

PowerShell (Windows):
```powershell
$env:SERVICE_ACCOUNT=".\service-account.json"
$env:OWNER_UID="<uid-aqui>"
$env:TEAM_NAME="Tanabeach"
$env:NUM_MATCHES="15"
npx tsx scripts/seed-tanabeach-history.ts
```

Output esperado:
```
Seeding 15 partidas pro time "Tanabeach" (owner=AbCdEf...)...
Time encontrado: 12 jogadores
  [1/15] 2026-02-14 vs Mirassol Team (3) -> abc123...
  [2/15] 2026-03-05 vs Praia Grande VC (5) -> def456...
  ...
Done.
```

### Importante

- **NÃO sobrescreve**: cada execução **cria** novas partidas. Se rodar 2x, vai ter 30 partidas. Apaga manualmente pelo app antes de re-seedar.
- **NÃO commita** o `service-account.json` — ele dá acesso total ao Firestore.
- **60% das partidas o Tanabeach ganha**, 40% perde. Distribuídas ao longo de 2026 (1 a cada ~3 semanas).
- Placares respeitam regras FIVB: sets normais 25 pts (com margem 2), decisivo 15 pts.

## seed-emulators.js

Seed pra Firebase Emulators locais (Docker). Usado por `npm run docker:seed`. Ver código.

## generate-assets.py / generate-feature-graphic.py

Geram ícones 512x512 e feature graphic 1024x500 da Play Store. Não precisam rodar a cada deploy.

## check-contrast.ts

Audita contraste WCAG das cores do tema. Executar pontualmente quando mexer no `theme.ts`.
