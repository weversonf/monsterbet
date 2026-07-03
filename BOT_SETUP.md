# Configuração do Bot do Telegram - Monster Bet

## 1. Criar o bot no Telegram

1. Abra o Telegram e procure por **@BotFather**
2. Envie `/newbot`
3. Escolha um nome e um username (deve terminar com `bot`, ex: `monsterbet_wevs_bot`)
4. O BotFather vai te enviar o **token de acesso**. Guarde ele.

## 2. Descobrir seu ID do Telegram

1. Procure por **@userinfobot** no Telegram
2. Envie qualquer mensagem para ele
3. Ele vai responder com seu **ID de usuário**. Guarde esse número.

## 3. Configurar variáveis de ambiente no Netlify

1. Vá em [https://app.netlify.com/](https://app.netlify.com/)
2. Acesse o site **monsterbet**
3. Vá em **Site settings → Environment variables**
4. Adicione essas 3 variáveis:

| Nome | Valor |
|------|-------|
| `TELEGRAM_BOT_TOKEN` | Token que o @BotFather te deu |
| `TELEGRAM_ADMIN_ID` | Seu ID de usuário do Telegram |
| `ADMIN_TOKEN` | Uma senha/token forte que você vai usar no painel admin |

> **Dica:** você também pode usar `ADMIN_ID` no lugar de `TELEGRAM_ADMIN_ID` se preferir.

> **Dica:** o `ADMIN_TOKEN` pode ser qualquer texto seguro, mas só é usado se você quiser adicionar um painel admin depois.

## 4. Fazer deploy

### Opção A: Deploy via Git (recomendado)

Conecte seu repositório no Netlify e faça push. O Netlify vai detectar o `netlify.toml` e publicar as funções automaticamente.

### Opção B: Deploy manual por ZIP

1. Use o arquivo `deploy_v3.zip` (ou gere um novo zip com `index.html`, `netlify.toml`, `package.json` e a pasta `netlify/functions/`).
2. No painel do Netlify, vá em **Site settings → General → Drag and drop**.
3. Faça upload do ZIP.
4. Aguarde o deploy terminar.

> **Importante:** sem o `netlify.toml` e a pasta `netlify/functions/`, as funções não vão funcionar e você verá erro 404 em `/.netlify/functions/telegram`.

## 5. Configurar o webhook do Telegram

Após o deploy, acesse no navegador:

```
https://api.telegram.org/bot<TOKEN_DO_BOT>/setWebhook?url=https://monsterbet.netlify.app/.netlify/functions/telegram
```

Substitua `<TOKEN_DO_BOT>` pelo token real.

Se der certo, vai aparecer algo assim:

```json
{"ok":true,"result":true,"description":"Webhook was set"}
```

### Verificar se tudo está certo

Acesse no navegador:

```
https://monsterbet.netlify.app/.netlify/functions/telegram
```

Você deve ver um JSON com informações do bot e do webhook. Se der erro 404, o deploy não incluiu as funções — refaça o passo 4.

## 6. Comandos do bot

No Telegram, envie para o seu bot:

| Comando | Descrição |
|---------|-----------|
| `/start` ou `/ajuda` | Mostra a lista de comandos |
| `/status` | Mostra o status atual |
| `/setcount <n>` | Define o contador de Monsters |
| `/addbet <nome> <palpite>` | Adiciona um palpite |
| `/removebet <nome>` | Remove um palpite |
| `/setdate <AAAA-MM-DDTHH:MM>` | Define data de revelação |
| `/revealnow` | Revela o resultado agora |
| `/reset` | Reseta tudo |

Exemplos:

```
/setcount 42
/addbet Ricardo 30
/removebet Ricardo
/setdate 2025-05-29T15:00
```

## 7. Testar localmente (opcional)

Se quiser testar antes de subir:

```bash
npm install
npx netlify dev
```

Aí acesse `http://localhost:8888`.

Para testar o webhook do Telegram localmente, é necessário usar uma ferramenta como **ngrok**.
