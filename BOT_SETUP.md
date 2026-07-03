# Monster Bet - Configuração Completa

## 📁 Estrutura do projeto

| Parte | Onde fica |
|-------|-----------|
| Site estático | GitHub Pages |
| Banco de dados | Google Sheets |
| Bot do Telegram | Google Apps Script |
| API para o site | Google Apps Script (Web App) |

---

## 1. Criar o bot no Telegram

1. Abra o Telegram e procure por **@BotFather**
2. Envie `/newbot`
3. Escolha um nome e um username (deve terminar com `bot`)
4. Guarde o **token** que o BotFather vai te enviar

---

## 2. Descobrir seu ID do Telegram

1. Procure por **@userinfobot** no Telegram
2. Envie qualquer mensagem
3. Ele vai responder com seu **ID de usuário**

---

## 3. Criar a planilha no Google Sheets

1. Acesse https://sheets.new
2. Crie uma planilha em branco
3. Pode deixar o nome padrão ou colocar "MonsterBet"
4. **Não é necessário editar nada manualmente** — o script cria a aba sozinho

---

## 4. Configurar o Google Apps Script

1. Na planilha, vá em **Extensões → Apps Script**
2. Apague o código padrão (`function myFunction() {}`)
3. Cole todo o conteúdo do arquivo `BotMonsterBet.gs`
4. Substitua no início do código:
   - `COLOQUE_SEU_TOKEN_AQUI` pelo token do BotFather
   - `COLOQUE_SEU_ID_AQUI` pelo seu ID do Telegram
5. Clique em **Salvar** (💾)

---

## 5. Publicar o Web App

1. No Apps Script, clique em **Implantar → Novo implantação**
2. Clique no ícone de engrenagem ⚙️ e escolha **Web app**
3. Configure:
   - **Descrição:** Monster Bet API
   - **Executar como:** Eu
   - **Quem pode acessar:** Qualquer pessoa
4. Clique em **Implantar**
5. Autorize as permissões se pedir
6. **Copie a URL do Web App**

---

## 6. Configurar o webhook do Telegram

Substitua `SUA_URL_DO_WEB_APP` pela URL copiada no passo anterior e acesse no navegador:

```
https://api.telegram.org/bot<TOKEN_DO_BOT>/setWebhook?url=SUA_URL_DO_WEB_APP
```

Se der certo, aparece:

```json
{"ok":true,"result":true,"description":"Webhook was set"}
```

---

## 7. Configurar o site no GitHub Pages

1. Acesse o repositório: https://github.com/weversonf/monsterbet
2. Vá em **Settings → Pages**
3. Em **Source**, selecione **Deploy from a branch**
4. Escolha o branch `master` e pasta `/ (root)`
5. Clique em **Save**
6. Aguarde alguns minutos
7. Seu site vai ficar em: `https://weversonf.github.io/monsterbet/`

---

## 8. Conectar site com o Apps Script

1. Abra o arquivo `index.html`
2. Procure por:
   ```javascript
   const API_URL = 'https://script.google.com/macros/s/SEU_ID_AQUI/exec';
   ```
3. Substitua pela URL do Web App do passo 5
4. Commit e push para o GitHub

---

## 🤖 Comandos do bot no Telegram

| Comando | Descrição |
|---------|-----------|
| `/atualizarcontador 15` | Define que você já tomou 15 Monsters |
| `/addmonster 1` | Adiciona 1 ao contador (pode ser qualquer número) |
| `/addbet Weverson 25` | Adiciona palpite |
| `/removebet Weverson` | Remove palpite |
| `/definirdata 2025-05-29T15:00` | Define data de revelação |
| `/revelaragora` | Revela resultado agora |
| `/reset` | Reseta tudo |
| `/status` | Mostra status atual |
| `/ajuda` | Lista os comandos |

---

## ⚠️ Importante

- Só você (ID configurado no script) pode usar o bot
- O site atualiza sozinho quando alguém abre a página
- Os dados ficam salvos na planilha do Google Sheets
