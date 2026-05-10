# Tutorial: como adicionar testadores ao Teste Fechado (Play Store)

> Para liberar o app na produção do Google Play, é obrigatório passar pelo
> **Teste Fechado** com no mínimo **12 testadores ativos por 14 dias corridos**.
> Os 14 dias só começam a contar quando os 12 testadores estão registrados
> SIMULTANEAMENTE — se cair pra 11, o contador zera.

Este guia é pra adicionar **um testador novo** e garantir que ele
contabilize no painel do Play Console.

---

## ⚠️ Atenção pro link errado

O link da Play Store comum **NÃO funciona** pra opt-in:

❌ Errado: `https://play.google.com/store/apps/details?id=com.timeco.app`
- Esse é o link normal — qualquer pessoa do mundo vê.
- Mesmo se a pessoa instalar por aqui, **NÃO conta** como testadora oficial.

✅ Certo: `https://play.google.com/apps/testing/com.timeco.app`
- Esse é o **link de opt-in**, mostra a tela "Tornar-se testador".
- É esse o link que você deve mandar.

---

## Passo a passo (parte do organizador)

### 1. Pega o email Google do testador
Qualquer email com conta Google válida — Gmail, Workspace ou conta vinculada
ao Google. Tem que ser o email que ele usa no celular Android dele.

### 2. Adiciona o email na lista de testadores da Alpha

1. Play Console → barra esquerda → **Testar e lançar** → **Teste fechado**
2. Clica na faixa **Alpha**
3. Aba **"Testadores"** (ao lado de "Versões")
4. Em **"Listas de email de testadores"**:
   - Se já existir uma lista, clica nela e **adiciona o email** novo
   - Se não existir, clica em **"Criar lista de email"**, dá um nome (ex: "amigos beta") e cola os emails
5. **Marca o checkbox** dessa lista pra associar à Alpha
6. Rola até o rodapé e clica em **"Salvar alterações"**

> 💡 Se você não clicar em "Salvar alterações", o email **não fica na lista**
> mesmo que apareça na tela. É o erro mais comum.

### 3. Pega o link de opt-in (mesma tela)

Ainda na aba **Testadores**, rola até a seção:
- "**Como os testadores se inscrevem**" (ou "Como acessar o app")

Vai ter um link `https://play.google.com/apps/testing/com.timeco.app` com botão
**"Copiar"** ao lado.

### 4. Manda o link pro testador
Pode ser por WhatsApp, email, Slack, Telegram. Importante: ele precisa abrir
o link **no celular Android dele**, com a conta Google correta logada.

Mensagem sugerida:

```
Oi! Pra você testar oficialmente o Timeco, faz isso (uma vez só, leva 2 min):

1. Abre esse link no celular: https://play.google.com/apps/testing/com.timeco.app
2. Clica em "Tornar-se testador"
3. Volta na Play Store e instala o app (vai aparecer com a marca "Beta")
4. Se você já tinha o APK instalado, desinstala primeiro
5. Abre o app e faz login normalmente

Obrigado!
```

---

## Passo a passo (parte do testador)

1. **Abre o link de opt-in** no celular: `https://play.google.com/apps/testing/com.timeco.app`
   - ⚠️ **Tem que ser** com a conta Google que foi cadastrada na lista
   - Se aparecer **"App não disponível"**, é porque o email dele NÃO está na lista (volta na parte do organizador)

2. **Vai aparecer a tela "Tornar-se testador"**
   - Toca no botão **"Tornar-se testador"**
   - Aparece confirmação "Você é testador deste app"

3. **Se já tinha o APK instalado, DESINSTALA**
   - Pressiona o ícone do Timeco → Desinstalar
   - Sem isso, a Play Store não consegue substituir o app
   - APK e Play Store nunca atualizam um ao outro

4. **Espera 5-15 minutos** (o Google leva esse tempo pra propagar)

5. **Abre a Play Store**, busca por **"Timeco"** ou clica de novo no link
   - Agora vai aparecer com o botão **"Instalar"** e a marca **"Beta"**
   - Toca em Instalar

6. **Abre o app** e faz login normalmente

---

## Como verificar se contou

1. **Painel do Play Console** → mostra "X testadores estão participando no momento"
   - Esse número deve subir 5-15 minutos depois do passo 6 do testador
   - Se não subir, ele tem que repetir o fluxo (provavelmente pulou o opt-in)

2. **Quem são os 4/5/N testadores?**
   - O Play Console **NÃO mostra** os emails individuais (privacidade)
   - Só dá pra cruzar manualmente pela planilha de quem você convidou
   - Pede pros testadores te confirmarem que aceitaram o opt-in

---

## Checklist de problemas comuns

| Problema | Causa | Solução |
|---|---|---|
| Link abre "App não disponível" | Email não está na lista da Alpha | Voltar no passo 2 do organizador, salvar de fato |
| Apareceu o app sem botão "Tornar-se testador" | Link errado (Store em vez de testing) | Mandar o link `/apps/testing/com.timeco.app` |
| Play Store mostra app sem marca "Beta" | Está em outra conta Google no celular | Trocar pra conta cadastrada |
| Botão "Instalar" não aparece | Esperar 5-15min depois do opt-in | Aguardar e dar refresh na Play Store |
| Já tinha APK instalado | Conflito APK x Play Store | Desinstalar APK manualmente primeiro |
| Email com domínio próprio (ex: empresa.com.br) não funciona | Não é conta Google | Pedir pra usar Gmail mesmo |
| Contador subiu mas depois caiu | Tester desinstalou o app | Cobrar pra reinstalar — os 14 dias zeram |

---

## Dica: planilha de controle

Como o Play Console não mostra o status individual, mantenha uma planilha:

| Email | Mandei o link? | Confirmou que aceitou? | Instalou Play Store? |
|---|---|---|---|
| amigo1@gmail.com | ✅ 09/05 | ✅ | ✅ |
| amigo2@gmail.com | ✅ 09/05 | ❌ ainda não | — |
| ... | | | |

Quando todos da coluna "Instalou Play Store" tiverem ✅ e somar 12, o
contador do Play Console deve mostrar 12 e os 14 dias começam a correr.

---

## Próximos passos depois dos 14 dias

Quando o painel mostrar:
- ✅ 12 testadores ativos
- ✅ 14 dias completos

O botão **"Solicitar a produção"** fica clicável. Aí preenche o formulário
sobre o teste fechado (qual modalidade, quantos bugs, feedback, etc) e
manda pro Google revisar.

Tipicamente leva mais 2-7 dias pra revisar e liberar.
