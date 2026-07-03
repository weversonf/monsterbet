const { loadData, saveData } = require('./_shared/store');

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Content-Type': 'application/json'
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS };
  }

  try {
    if (event.httpMethod === 'GET') {
      // Endpoint de diagnóstico do token (não expõe o token real)
      if (event.queryStringParameters?.debug === 'token') {
        const envToken = String(process.env.ADMIN_TOKEN || '').trim();
        const authHeader = String(event.headers.authorization || event.headers.Authorization || '').trim();
        const providedToken = authHeader.startsWith('Bearer ')
          ? authHeader.slice(7).trim()
          : authHeader;

        return {
          statusCode: 200,
          headers: CORS_HEADERS,
          body: JSON.stringify({
            configured: envToken.length > 0,
            configuredLength: envToken.length,
            configuredStartsWith: envToken.slice(0, 3),
            configuredEndsWith: envToken.slice(-3),
            receivedHeader: authHeader.length > 0,
            receivedLength: providedToken.length,
            receivedStartsWith: providedToken.slice(0, 3),
            receivedEndsWith: providedToken.slice(-3),
            match: envToken === providedToken && envToken.length > 0,
            note: 'Esconde o token real por segurança. Verifique se os comprimentos batem.'
          }, null, 2)
        };
      }

      const data = await loadData();
      return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify(data) };
    }

    if (event.httpMethod === 'POST') {
      const authHeader = (event.headers.authorization || event.headers.Authorization || '').trim();
      const expectedToken = `Bearer ${(process.env.ADMIN_TOKEN || '').trim()}`;

      if (!expectedToken || authHeader !== expectedToken) {
        return {
          statusCode: 401,
          headers: CORS_HEADERS,
          body: JSON.stringify({ error: 'Não autorizado' })
        };
      }

      const body = JSON.parse(event.body || '{}');
      const current = await loadData();

      switch (body.type) {
        case 'validate': {
          break;
        }

        case 'count': {
          const value = Number(body.value);
          if (isNaN(value) || value < 0) throw new Error('Valor inválido');
          current.count = value;
          break;
        }

        case 'addBet': {
          const { nome, palpite } = body;
          if (!nome || isNaN(Number(palpite))) {
            throw new Error('Nome e palpite são obrigatórios');
          }
          const lower = nome.trim().toLowerCase();
          if (current.bets.some(b => b.nome.toLowerCase() === lower)) {
            throw new Error('Esse nome já existe na lista');
          }
          current.bets.push({ nome: nome.trim(), palpite: Number(palpite) });
          break;
        }

        case 'saveBet': {
          const { index, nome, palpite } = body;
          if (isNaN(index) || !nome || isNaN(Number(palpite))) {
            throw new Error('Dados inválidos');
          }
          const lower = nome.trim().toLowerCase();
          const duplicate = current.bets.some(
            (b, i) => i !== index && b.nome.toLowerCase() === lower
          );
          if (duplicate) throw new Error('Esse nome já existe na lista');
          current.bets[index] = { nome: nome.trim(), palpite: Number(palpite) };
          break;
        }

        case 'deleteBet': {
          const { index } = body;
          if (isNaN(index)) throw new Error('Índice inválido');
          current.bets.splice(index, 1);
          break;
        }

        case 'revealDate': {
          const { value } = body;
          current.revealDate = value || null;
          break;
        }

        case 'revealNow': {
          current.revealDate = new Date().toISOString();
          break;
        }

        case 'reset': {
          current.count = 0;
          current.bets = [];
          current.revealDate = null;
          break;
        }

        default:
          throw new Error('Tipo inválido');
      }

      await saveData(current);
      return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify(current) };
    }

    return {
      statusCode: 405,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'Método não permitido' })
    };
  } catch (err) {
    return {
      statusCode: 400,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: err.message })
    };
  }
};
