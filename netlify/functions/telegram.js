const { loadData, saveData } = require('./_shared/store');

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const ADMIN_ID = process.env.TELEGRAM_ADMIN_ID || process.env.ADMIN_ID;

function isAuthorized(update) {
  if (!update.message) return false;
  return String(update.message.from?.id) === String(ADMIN_ID);
}

async function sendMessage(chatId, text) {
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' })
  });
}

function formatData(data) {
  const revealed = data.revealDate && new Date() >= new Date(data.revealDate);
  let text = '⚡ *Monster Bet - Status*\n\n';
  text += `*Contador:* ${data.count}\n`;
  text += `*Revelado:* ${revealed ? 'Sim ✅' : 'Não ❌'}\n`;
  text += data.revealDate
    ? `*Data revelação:* ${new Date(data.revealDate).toLocaleString('pt-BR')}\n`
    : '*Data revelação:* não definida\n';
  text += '\n*Palpites:*\n';

  if (data.bets.length === 0) {
    text += '_Nenhum palpite_\n';
  } else {
    data.bets.forEach(b => {
      const win = revealed && b.palpite === data.count;
      text += `${win ? '🏆' : '•'} ${b.nome}: ${b.palpite}\n`;
    });
  }

  if (revealed) {
    const winners = data.bets.filter(b => b.palpite === data.count);
    if (winners.length > 0) {
      text += `\n🏆 *Vencedor(es):* ${winners.map(w => w.nome).join(', ')}`;
    } else {
      text += '\n😈 *Ninguém acertou*';
    }
  }

  return text;
}

async function setWebhook(url) {
  const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url })
  });
  return res.json();
}

async function getWebhookInfo() {
  const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo`);
  return res.json();
}

exports.handler = async (event) => {
  if (event.httpMethod === 'GET') {
    const siteUrl = `https://${event.headers.host || 'monsterbet.netlify.app'}`;
    const webhookUrl = `${siteUrl}/.netlify/functions/telegram`;

    if (event.queryStringParameters?.action === 'setwebhook') {
      const result = await setWebhook(webhookUrl);
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ webhookUrl, result }, null, 2)
      };
    }

    const info = await getWebhookInfo();
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bot: '@ContadorMonsterBot',
        adminId: ADMIN_ID ? '✅ configurado' : '❌ não configurado',
        webhookUrl,
        webhookInfo: info
      }, null, 2)
    };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const update = JSON.parse(event.body);

    if (!update.message || !update.message.text) {
      return { statusCode: 200, body: 'OK' };
    }

    const chatId = update.message.chat.id;
    const text = update.message.text.trim();
    const parts = text.split(/\s+/);

    if (!isAuthorized(update)) {
      await sendMessage(chatId, '⛔ Você não tem permissão para usar este bot.');
      return { statusCode: 200, body: 'OK' };
    }

    const command = parts[0].toLowerCase();
    const data = await loadData();

    switch (command) {
      case '/start':
      case '/ajuda':
      case '/help': {
        await sendMessage(chatId,
          '⚡ *Comandos Monster Bet*\n\n' +
          '/status - Mostra status atual\n' +
          '/setcount <n> - Define contador\n' +
          '/addbet <nome> <palpite> - Adiciona palpite\n' +
          '/removebet <nome> - Remove palpite\n' +
          '/setdate <AAAA-MM-DDTHH:MM> - Define data de revelação\n' +
          '/revealnow - Revela resultado agora\n' +
          '/reset - Reseta tudo\n' +
          '/ajuda - Mostra esta mensagem'
        );
        break;
      }

      case '/status': {
        await sendMessage(chatId, formatData(data));
        break;
      }

      case '/setcount': {
        const value = Number(parts[1]);
        if (isNaN(value) || value < 0) {
          await sendMessage(chatId, '❌ Use: /setcount <número>');
        } else {
          data.count = value;
          await saveData(data);
          await sendMessage(chatId, `✅ Contador definido para ${value}`);
        }
        break;
      }

      case '/addbet': {
        if (parts.length < 3) {
          await sendMessage(chatId, '❌ Use: /addbet <nome> <palpite>');
          break;
        }
        const palpite = Number(parts[parts.length - 1]);
        const nome = parts.slice(1, -1).join(' ').trim();
        if (!nome || isNaN(palpite)) {
          await sendMessage(chatId, '❌ Use: /addbet <nome> <palpite>');
        } else {
          const lower = nome.toLowerCase();
          if (data.bets.some(b => b.nome.toLowerCase() === lower)) {
            await sendMessage(chatId, `❌ Já existe palpite para ${nome}`);
          } else {
            data.bets.push({ nome, palpite });
            await saveData(data);
            await sendMessage(chatId, `✅ Palpite adicionado: ${nome} → ${palpite}`);
          }
        }
        break;
      }

      case '/removebet': {
        if (parts.length < 2) {
          await sendMessage(chatId, '❌ Use: /removebet <nome>');
          break;
        }
        const nomeOriginal = parts.slice(1).join(' ');
        const nome = nomeOriginal.trim().toLowerCase();
        const idx = data.bets.findIndex(b => b.nome.toLowerCase() === nome);
        if (idx === -1) {
          await sendMessage(chatId, `❌ Palpite de ${nomeOriginal} não encontrado`);
        } else {
          data.bets.splice(idx, 1);
          await saveData(data);
          await sendMessage(chatId, `✅ Palpite de ${nomeOriginal} removido`);
        }
        break;
      }

      case '/setdate': {
        if (parts.length < 2) {
          await sendMessage(chatId, '❌ Use: /setdate <AAAA-MM-DDTHH:MM>');
          break;
        }
        const dateStr = parts[1];
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) {
          await sendMessage(chatId, '❌ Data inválida. Exemplo: /setdate 2025-05-29T15:00');
        } else {
          data.revealDate = d.toISOString();
          await saveData(data);
          await sendMessage(chatId, `✅ Data de revelação: ${d.toLocaleString('pt-BR')}`);
        }
        break;
      }

      case '/revealnow': {
        data.revealDate = new Date().toISOString();
        await saveData(data);
        await sendMessage(chatId, '✅ Resultado revelado agora!\n\n' + formatData(data));
        break;
      }

      case '/reset': {
        data.count = 0;
        data.bets = [];
        data.revealDate = null;
        await saveData(data);
        await sendMessage(chatId, '✅ Tudo resetado.');
        break;
      }

      default: {
        await sendMessage(chatId, '❓ Comando não reconhecido. Use /ajuda');
      }
    }

    return { statusCode: 200, body: 'OK' };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
