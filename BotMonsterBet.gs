// ============================================
// BOT MONSTER BET - Google Apps Script
// Controla o site e recebe comandos do Telegram
// ============================================

// --- CONFIGURAÇÕES ---
var BOT_TOKEN = "COLOQUE_SEU_TOKEN_AQUI";
var ADMIN_ID = "COLOQUE_SEU_ID_AQUI"; // ex: "6802504310"
var SHEET_NAME = "MonsterBet";

// --- DADOS PADRÃO ---
var DEFAULT_DATA = {
  count: 0,
  bets: [
    { nome: "Augusto", palpite: 26 },
    { nome: "Guilherme", palpite: 23 },
    { nome: "Alexandre", palpite: 22 },
    { nome: "Roberto", palpite: 28 },
    { nome: "Hamanda", palpite: 24 }
  ],
  revealDate: null
};

// --- PLANILHA ---
function getSheet() {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = spreadsheet.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(SHEET_NAME);
    sheet.getRange(1, 1).setValue("data");
    sheet.getRange(1, 2).setValue(JSON.stringify(DEFAULT_DATA));
    sheet.hideSheet();
  }
  return sheet;
}

function loadData() {
  try {
    var sheet = getSheet();
    var raw = sheet.getRange(2, 2).getValue();
    if (!raw) {
      saveData(DEFAULT_DATA);
      return DEFAULT_DATA;
    }
    var parsed = JSON.parse(raw);
    // Garante que os campos existam
    parsed.count = parsed.count || 0;
    parsed.bets = parsed.bets || [];
    parsed.revealDate = parsed.revealDate || null;
    return parsed;
  } catch (e) {
    saveData(DEFAULT_DATA);
    return DEFAULT_DATA;
  }
}

function saveData(data) {
  var sheet = getSheet();
  sheet.getRange(2, 2).setValue(JSON.stringify(data));
  return data;
}

// --- TELEGRAM ---
function sendMessage(chatId, text) {
  var url = "https://api.telegram.org/bot" + BOT_TOKEN + "/sendMessage";
  var payload = {
    chat_id: chatId,
    text: text,
    parse_mode: "Markdown"
  };
  var options = {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload)
  };
  UrlFetchApp.fetch(url, options);
}

function isAuthorized(update) {
  if (!update.message) return false;
  return String(update.message.from.id) === String(ADMIN_ID);
}

// --- FORMATAÇÃO ---
function formatData(data) {
  var revealed = data.revealDate && new Date() >= new Date(data.revealDate);
  var text = "⚡ *Monster Bet - Status*\n\n";
  text += "*Monsters consumidos:* " + data.count + "\n";
  text += "*Revelado:* " + (revealed ? "Sim ✅" : "Não ❌") + "\n";
  text += data.revealDate
    ? "*Data revelação:* " + new Date(data.revealDate).toLocaleString("pt-BR") + "\n"
    : "*Data revelação:* não definida\n";
  text += "\n*Palpites:*\n";

  if (data.bets.length === 0) {
    text += "_Nenhum palpite_\n";
  } else {
    data.bets.forEach(function(b) {
      var win = revealed && b.palpite === data.count;
      text += (win ? "🏆 " : "• ") + b.nome + ": " + b.palpite + "\n";
    });
  }

  if (revealed) {
    var winners = data.bets.filter(function(b) { return b.palpite === data.count; });
    if (winners.length > 0) {
      text += "\n🏆 *Vencedor(es):* " + winners.map(function(w) { return w.nome; }).join(", ");
    } else {
      text += "\n😈 *Ninguém acertou*";
    }
  }

  return text;
}

// --- HANDLER DO TELEGRAM ---
function doPost(e) {
  try {
    var update = JSON.parse(e.postData.contents);

    if (!update.message || !update.message.text) {
      return ContentService.createTextOutput("OK");
    }

    var chatId = update.message.chat.id;
    var text = update.message.text.trim();
    var parts = text.split(/\s+/);
    var command = parts[0].toLowerCase();

    if (!isAuthorized(update)) {
      sendMessage(chatId, "⛔ Você não tem permissão para usar este bot.");
      return ContentService.createTextOutput("OK");
    }

    var data = loadData();

    switch (command) {
      case "/start":
      case "/ajuda":
      case "/help":
        sendMessage(chatId,
          "⚡ *Comandos Monster Bet*\n\n" +
          "/atualizarcontador 15 — Define o contador total\n" +
          "/addmonster 1 — Adiciona ao contador\n" +
          "/addbet Weverson 25 — Adiciona palpite\n" +
          "/removebet Weverson — Remove palpite\n" +
          "/definirdata 2025-05-29T15:00 — Define data de revelação\n" +
          "/revelaragora — Revela resultado agora\n" +
          "/reset — Reseta tudo\n" +
          "/status — Mostra status atual\n" +
          "/ajuda — Mostra esta mensagem"
        );
        break;

      case "/atualizarcontador":
        var valor = Number(parts[1]);
        if (isNaN(valor) || valor < 0) {
          sendMessage(chatId, "❌ Use: /atualizarcontador <número>");
        } else {
          data.count = valor;
          saveData(data);
          sendMessage(chatId, "✅ Contador atualizado para " + valor);
        }
        break;

      case "/addmonster":
        var qtd = Number(parts[1]);
        if (isNaN(qtd)) qtd = 1;
        data.count = data.count + qtd;
        saveData(data);
        sendMessage(chatId, "✅ Adicionado " + qtd + " Monster(s). Total: " + data.count);
        break;

      case "/addbet":
        if (parts.length < 3) {
          sendMessage(chatId, "❌ Use: /addbet <nome> <palpite>");
          break;
        }
        var palpite = Number(parts[parts.length - 1]);
        var nome = parts.slice(1, -1).join(" ").trim();
        if (!nome || isNaN(palpite)) {
          sendMessage(chatId, "❌ Use: /addbet <nome> <palpite>");
        } else {
          var lower = nome.toLowerCase();
          if (data.bets.some(function(b) { return b.nome.toLowerCase() === lower; })) {
            sendMessage(chatId, "❌ Já existe palpite para " + nome);
          } else {
            data.bets.push({ nome: nome, palpite: palpite });
            saveData(data);
            sendMessage(chatId, "✅ Palpite adicionado: " + nome + " → " + palpite);
          }
        }
        break;

      case "/removebet":
        if (parts.length < 2) {
          sendMessage(chatId, "❌ Use: /removebet <nome>");
          break;
        }
        var nomeOriginal = parts.slice(1).join(" ");
        var nomeBusca = nomeOriginal.trim().toLowerCase();
        var idx = data.bets.findIndex(function(b) { return b.nome.toLowerCase() === nomeBusca; });
        if (idx === -1) {
          sendMessage(chatId, "❌ Palpite de " + nomeOriginal + " não encontrado");
        } else {
          data.bets.splice(idx, 1);
          saveData(data);
          sendMessage(chatId, "✅ Palpite de " + nomeOriginal + " removido");
        }
        break;

      case "/definirdata":
        if (parts.length < 2) {
          sendMessage(chatId, "❌ Use: /definirdata <AAAA-MM-DDTHH:MM>");
          break;
        }
        var dateStr = parts[1];
        var d = new Date(dateStr);
        if (isNaN(d.getTime())) {
          sendMessage(chatId, "❌ Data inválida. Exemplo: /definirdata 2025-05-29T15:00");
        } else {
          data.revealDate = d.toISOString();
          saveData(data);
          sendMessage(chatId, "✅ Data de revelação: " + d.toLocaleString("pt-BR"));
        }
        break;

      case "/revelaragora":
        data.revealDate = new Date().toISOString();
        saveData(data);
        sendMessage(chatId, "✅ Resultado revelado agora!\n\n" + formatData(data));
        break;

      case "/reset":
        data.count = 0;
        data.bets = [];
        data.revealDate = null;
        saveData(data);
        sendMessage(chatId, "✅ Tudo resetado.");
        break;

      case "/status":
        sendMessage(chatId, formatData(data));
        break;

      default:
        sendMessage(chatId, "❓ Comando não reconhecido. Use /ajuda");
    }

    return ContentService.createTextOutput("OK");
  } catch (err) {
    return ContentService.createTextOutput("Erro: " + err.message);
  }
}

// --- API PARA O SITE ---
function doGet(e) {
  var data = loadData();
  var json = JSON.stringify(data);

  // Suporte a JSONP (para GitHub Pages)
  var callback = e.parameter.callback;
  if (callback) {
    var output = callback + "(" + json + ");";
    return ContentService.createTextOutput(output)
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }

  // Resposta JSON com CORS
  return ContentService.createTextOutput(json)
    .setMimeType(ContentService.MimeType.JSON);
}
