# Assets do Timeco

Todos os ícones e logos do app são gerados automaticamente a partir da
imagem master em `_source/` via `python scripts/generate-assets.py`.

## Arquivos

| Arquivo | Tamanho | Uso |
|---------|---------|-----|
| `icon.png` | 1024×1024 | Ícone principal Expo (iOS + fallback Android). Fundo branco, padding 10% |
| `adaptive-icon.png` | 1024×1024 | Foreground do Android adaptive icon. Padding 25% (Android pode mascarar como círculo) |
| `splash-icon.png` | 1024×1024 | Splash screen. Fundo transparente — `app.json` define backgroundColor |
| `favicon.png` | 48×48 | Favicon web (browser tab) |
| `favicon-192.png` | 192×192 | Favicon web alta resolução (Android home shortcut) |
| `favicon-512.png` | 512×512 | Favicon web super-alta (PWA) |
| `logo.png` | 427×302 | Logo cropado com fundo transparente (uso em telas internas) |
| `logo-square.png` | 1024×1024 | Logo quadrado transparente (compartilhamento, redes sociais) |
| `_play-store/icon-512.png` | 512×512 | Ícone alta resolução para upload na Play Store |
| `_source/` | — | Imagem original do Gemini que serve de fonte |

## Regenerar

Se trocar o logo, substitua o arquivo em `_source/` (mantendo o mesmo nome
ou ajustando `SRC` no script) e rode:

```bash
python scripts/generate-assets.py
```

## Configuração

Os paths são referenciados em `app.json` (raiz do projeto), nas chaves
`expo.icon`, `expo.splash.image`, `expo.android.adaptiveIcon.foregroundImage`
e `expo.web.favicon`.
