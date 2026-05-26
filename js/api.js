// ============================================================
// api.js — Comunicação com o Supabase
// ============================================================

async function sb(tabela, opcoes = {}) {
  const { metodo = 'GET', body, params = '' } = opcoes;
  const url = `${SUPA_URL}/rest/v1/${tabela}${params ? '?' + params : ''}`;
  const headers = {
    'apikey': SUPA_KEY,
    'Authorization': `Bearer ${SUPA_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation',
  };
  const res = await fetch(url, {
    method: metodo,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Erro HTTP ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}
