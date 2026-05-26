// ============================================================
// utils.js — Utilitários globais
// ============================================================

// ── FORMATAÇÃO ────────────────────────────────────────────────

function fmt(v) {
  return Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function fmtData(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-BR');
}

function fmtDataHora(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('pt-BR');
}

function campo(label, valor) {
  return `
    <div style="margin-bottom:8px">
      <div class="form-label" style="margin-bottom:4px">${label}</div>
      <div style="font-size:13px;font-weight:500">${valor || '—'}</div>
    </div>`;
}

// ── HASH DE SENHA ─────────────────────────────────────────────

async function hashSenha(senha) {
  const texto = SALT + senha + SALT;
  const buf   = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(texto));
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, '0')).join('');
}

// ── TOAST ────────────────────────────────────────────────────

function toast(msg, tipo = 'info') {
  const icons = { success: '✓', error: '✕', info: 'ℹ' };
  document.getElementById('toast-icon').textContent = icons[tipo] || '●';
  document.getElementById('toast-msg').textContent  = msg;
  const el = document.getElementById('toast');
  el.className = 'toast show ' + tipo;
  clearTimeout(el._t);
  el._t = setTimeout(() => el.className = 'toast', 3500);
}

// ── MODAIS ───────────────────────────────────────────────────

function abrirModal(id) {
  document.getElementById(id).classList.add('open');
}

function fecharModal(id) {
  document.getElementById(id).classList.remove('open');
}

// Fechar clicando no backdrop
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.overlay').forEach(el => {
    el.addEventListener('click', e => {
      if (e.target === el) el.classList.remove('open');
    });
  });
});

// ── CONFIRMAÇÃO ───────────────────────────────────────────────

let _confirmCb = null;

function confirmar(msg, cb) {
  _confirmCb = cb;
  document.getElementById('confirm-msg').textContent = msg;
  document.getElementById('btn-confirmar-acao').onclick = () => {
    fecharModal('modal-confirm');
    if (_confirmCb) _confirmCb();
  };
  abrirModal('modal-confirm');
}

// ── FILTRO DE TABELA ──────────────────────────────────────────

function filtrarTabela(tbodyId, termo) {
  const rows = document.querySelectorAll(`#${tbodyId} tr`);
  const t    = termo.toLowerCase();
  rows.forEach(r => {
    r.style.display = r.textContent.toLowerCase().includes(t) ? '' : 'none';
  });
}

// ── BTN LOADING ───────────────────────────────────────────────

function btnLoading(id, texto = 'Salvando...') {
  const btn = document.getElementById(id);
  if (btn) { btn.disabled = true; btn._txt = btn.textContent; btn.textContent = texto; }
}

function btnReset(id) {
  const btn = document.getElementById(id);
  if (btn) { btn.disabled = false; btn.textContent = btn._txt || 'Salvar'; }
}
