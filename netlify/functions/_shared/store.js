const { getStore } = require('@netlify/blobs');

const STORE_NAME = 'monster-bet';
const KEY = 'data';

const DEFAULT_DATA = {
  count: 0,
  bets: [
    { nome: 'Augusto', palpite: 26 },
    { nome: 'Guilherme', palpite: 23 },
    { nome: 'Alexandre', palpite: 22 },
    { nome: 'Roberto', palpite: 28 },
    { nome: 'Hamanda', palpite: 24 }
  ],
  revealDate: null
};

function getDataStore() {
  return getStore({ name: STORE_NAME, consistency: 'strong' });
}

async function loadData() {
  const store = getDataStore();
  const raw = await store.get(KEY, { type: 'json' });

  if (!raw) {
    await store.setJSON(KEY, DEFAULT_DATA);
    return DEFAULT_DATA;
  }

  return { ...DEFAULT_DATA, ...raw };
}

async function saveData(data) {
  const store = getDataStore();
  await store.setJSON(KEY, data);
  return data;
}

module.exports = { loadData, saveData, DEFAULT_DATA };
