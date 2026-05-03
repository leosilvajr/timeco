# Timeco · Listing da Play Store

Tudo o que você precisa colar nos campos da Play Console.

---

## 📝 Informações básicas

### App name (50 caracteres máx)
```
Timeco · Times equilibrados
```
> Alternativa: `Timeco · Pelada e times`

### Short description (80 caracteres máx)
```
Sorteie times equilibrados para pelada, vôlei, basquete e qualquer esporte.
```
> 75 chars ✓

### Full description (4000 caracteres máx)
```
Acabou a discussão na pelada sobre quem joga em qual time. O Timeco organiza partidas esportivas amadoras com seus amigos e monta times equilibrados em segundos.

⚽ MULTI-ESPORTE
Funciona em qualquer modalidade: futebol, futsal, vôlei, vôlei de praia, basquete, handebol, tênis, tênis de mesa, padel, beach tennis, badminton, squash, pickleball, xadrez, sinuca, e-sports e muito mais.

🎲 SORTEIO INTELIGENTE
Como organizador, você dá de 1 a 5 estrelas para o nível de cada jogador. O Timeco distribui em snake-draft (serpentina) considerando estrelas, idade, altura e peso quando o esporte exige. Resultado: times balanceados sem briga.

🏟️ EVENTOS COMPLETOS
Crie partidas com data, horário e local pelo Google Maps. Convide só seus amigos do app. Cada um confirma se vai ou não. Edite o evento depois se mudar algo.

📸 GALERIA DE FOTOS
Compartilhe os melhores momentos da partida. Cada evento tem sua galeria privada, visível apenas para os participantes.

💬 CHAT INTERNO
Converse com seus amigos diretamente no app. Notificações em tempo real de mensagens, convites e atualizações de eventos.

🏆 PLACAR ELETRÔNICO
Marcador digital com números gigantes pra usar durante o jogo. Vôlei oficial (set tie-break, vantagem de 2 pontos), tênis de mesa, futebol amador — tudo configurável. Também tem botão pra trocar lados e desfazer pontos.

🏐 VÔLEI AVANÇADO · SCOUT
Para quem joga vôlei a sério: estatísticas profissionais por jogador. Saque, ataque, passe, bloqueio e levantamento. Relatórios detalhados por set com eficiência individual.

🔒 PRIVACIDADE EM PRIMEIRO LUGAR
Perfil pode ser público ou privado. Galeria também tem controle separado. Peso é totalmente opcional e nunca aparece em perfis públicos — usado só em cálculos internos de sorteio em esportes de contato.

📱 FUNCIONA EM QUALQUER LUGAR
App nativo Android e versão web em timeco.com.br. Mesma conta nos dois.

🆓 GRATUITO
Totalmente gratuito. Sem anúncios. Sem assinatura.

🎯 IDEAL PARA
- Peladeiros de fim de semana
- Times amadores e ligas locais
- Professores de educação física
- Jogadores de vôlei que querem stats profissionais
- Qualquer pessoa cansada de organizar pelo WhatsApp

Suporte e dúvidas pelo nosso WhatsApp da Incrivia: +55 17 99285-0093
```

---

## 🏷️ Categorização

- **App or Game:** App
- **Category:** Esportes (Sports)
- **Tags / Sub-category:** Lifestyle, Esportes
- **Content rating:** Livre (Everyone) — não tem violência, conteúdo adulto, dados sensíveis pra menores

---

## 📋 Data Safety form

Quando preencher na Play Console:

### Dados coletados

| Categoria | Tipo | Obrigatório? | Compartilhado? | Por quê |
|-----------|------|--------------|----------------|---------|
| Personal info | Nome | Sim | Não | Identificação no app |
| Personal info | Email | Sim | Não | Login + comunicação |
| Personal info | Foto | Não | Não | Foto de perfil opcional |
| Personal info | Phone | Não | Não | Contato opcional pra organizadores |
| Health and fitness | Outros (altura, peso, data nasc) | Não | Não | Sorteio de times. Peso é privado |
| Photos and videos | Photos | Não | Não | Galerias de eventos |
| Messages | Other in-app messages | Não | Não | Chat 1-a-1 |
| Location | Approximate/Precise | Não | Não | Apenas quando o user toca em "Usar minha localização" no evento |
| App info and performance | Crash logs | Sim | Não | Diagnóstico |
| App activity | Other actions | Sim | Não | Push token do dispositivo |

**Encrypted in transit:** ✅ Sim (HTTPS/TLS)
**User can request deletion:** ✅ Sim → https://timeco.com.br/delete-account
**Independent security review:** Não

---

## 🔗 URLs (já no ar)

- **Website:** https://timeco.com.br
- **Privacy Policy:** https://timeco.com.br/privacy
- **Terms of Service:** https://timeco.com.br/terms
- **Support:** https://timeco.com.br/support
- **Delete account:** https://timeco.com.br/delete-account
- **Email de contato:** dev07@pratickosolucoes.com.br

---

## 🎨 Assets necessários

| Asset | Tamanho | Status |
|-------|---------|--------|
| App icon | 512×512 PNG | ✅ `assets/_play-store/icon-512.png` |
| Feature graphic | 1024×500 PNG | ⏳ Vou gerar agora (B) |
| Phone screenshots | min 2, max 8 (1080×1920 ou similar) | ⏳ Você tira do APK quando rodar |
| Tablet screenshots (opcional) | min 1 (1080×1920+) | Opcional |

---

## 📦 Versão técnica

- **Package name:** `com.timeco.app`
- **Version code:** 1 (auto-increment via EAS)
- **Version name:** 1.0.0
- **Min SDK:** 24 (Android 7.0)
- **Target SDK:** 36 (Android 16) — atende exigência atual da Play Store

---

## 🚀 Track de lançamento

1. **Internal testing** (até 100 testers) — primeiro upload pra verificar o build
2. **Closed testing** (12 testers, 14 dias) — exigência pra contas novas (você já tem conta antiga, talvez possa pular)
3. **Open testing** (opcional)
4. **Production**

> **Importante:** mesmo com conta antiga, recomendo passar por Closed Testing por uns dias antes de lançar pra produção. Pega bugs cedo.

---

## ✅ Checklist antes de submeter

- [ ] AAB gerado (`npm run eas:build:production`)
- [ ] Listing preenchido (este documento)
- [ ] Data Safety form respondido
- [ ] Content rating questionário respondido (5 min, online)
- [ ] Screenshots subidos (min 2)
- [ ] Feature graphic subido
- [ ] Política de privacidade URL acessível
- [ ] Email de contato definido
- [ ] País/região de distribuição (Brasil + outros se quiser)
- [ ] Free vs paid: Free
- [ ] Ads: No
