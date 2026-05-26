// ============================================================
// historico.js — Histórico de Vendas
// ============================================================

async function renderHistorico() {
  setLoading();
  const c = document.getElementById('content');
  try {
    const filtro = ehAdmin() ? '' : `&vendedor_id=eq.${sessao.id}`;
    const vendas = await sb('vendas', {
      params: `order=created_at.desc&limit=200${filtro}&select=id,codigo,cliente_nome,total,status,created_at`,
    });
    c.innerHTML = `
      <div class="card">
        <div class="card-header">
          <span class="card-title">Histórico de Vendas (${vendas.length})</span>
          <input type="search" placeholder="Buscar..." oninput="filtrarTabela('tabela-hist', this.value)" style="width:200px">
        </div>
        <table>
          <thead><tr><th>Código</th><th>Cliente</th><th>Total</th><th>Status</th><th>Data</th></tr></thead>
          <tbody id="tabela-hist">
            ${vendas.length === 0
              ? '<tr><td colspan="5" class="empty">Nenhuma venda registrada.</td></tr>'
              : vendas.map(v => `
                <tr>
                  <td class="mono">${v.codigo || v.id.slice(0, 8)}</td>
                  <td class="primary">${v.cliente_nome || '—'}</td>
                  <td style="font-family:var(--mono);color:var(--green)">${fmt(v.total)}</td>
                  <td><span class="badge ${v.status}">${v.status}</span></td>
                  <td class="muted">${fmtData(v.created_at)}</td>
                </tr>`).join('')}
          </tbody>
        </table>
      </div>`;
  } catch (e) { c.innerHTML = `<div class="empty">Erro: ${e.message}</div>`; }
}

// ============================================================
// produtos.js — Catálogo de Produtos
// ============================================================

async function renderProdutos() {
  setLoading();
  const c = document.getElementById('content');
  try {
    const prods = await sb('produtos', {
      params: 'order=nome.asc&select=id,codigo,nome,categoria,marca,preco,status&limit=500',
    });
    c.innerHTML = `
      <div class="card">
        <div class="card-header">
          <span class="card-title">Catálogo (${prods.length})</span>
          <input type="search" placeholder="Buscar produto..." oninput="filtrarTabela('tabela-prod', this.value)" style="width:220px">
        </div>
        <table>
          <thead><tr><th>Código</th><th>Nome</th><th>Categoria</th><th>Marca</th><th>Preço</th><th>Status</th></tr></thead>
          <tbody id="tabela-prod">
            ${prods.length === 0
              ? '<tr><td colspan="6" class="empty">Nenhum produto.</td></tr>'
              : prods.map(p => `
                <tr>
                  <td class="mono">${p.codigo}</td>
                  <td class="primary">${p.nome}</td>
                  <td class="muted">${p.categoria || '—'}</td>
                  <td class="muted">${p.marca || '—'}</td>
                  <td style="font-family:var(--mono);color:var(--green)">${fmt(p.preco)}</td>
                  <td><span class="badge ${p.status}">${p.status}</span></td>
                </tr>`).join('')}
          </tbody>
        </table>
      </div>`;
  } catch (e) { c.innerHTML = `<div class="empty">Erro: ${e.message}</div>`; }
}

// ============================================================
// admin.js — Gestão de Vendedores
// ============================================================

async function renderAdmin() {
  if (!ehAdmin()) { ir('dashboard'); return; }
  setLoading();
  const c = document.getElementById('content');
  try {
    const vends = await sb('vendedores', {
      params: 'order=nome.asc&select=id,nome,usuario,cargo,status,meta,ultimo_login',
    });
    c.innerHTML = `
      <div class="card">
        <div class="card-header">
          <span class="card-title">Vendedores (${vends.length})</span>
          <button class="btn primary sm" onclick="abrirModalVendedor()">+ Novo Vendedor</button>
        </div>
        <table>
          <thead><tr><th>Nome</th><th>Usuário</th><th>Cargo</th><th>Meta</th><th>Status</th><th>Último Login</th><th></th></tr></thead>
          <tbody>
            ${vends.map(v => `
              <tr>
                <td class="primary">${v.nome}</td>
                <td class="mono">${v.usuario}</td>
                <td><span class="badge ${v.cargo}">${v.cargo}</span></td>
                <td style="font-family:var(--mono);color:var(--text2)">${fmt(v.meta || 0)}</td>
                <td><span class="badge ${v.status}">${v.status}</span></td>
                <td class="muted">${v.ultimo_login ? fmtData(v.ultimo_login) : '—'}</td>
                <td>
                  <div class="btn-group">
                    <button class="btn ghost sm" onclick="toggleVendedor('${v.id}','${v.status}')">${v.status === 'ativo' ? '🔒' : '🔓'}</button>
                    <button class="btn danger sm" onclick="excluirVendedor('${v.id}','${v.nome.replace(/'/g, "\\'")}')">🗑️</button>
                  </div>
                </td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>`;
  } catch (e) { c.innerHTML = `<div class="empty">Erro: ${e.message}</div>`; }
}

function abrirModalVendedor() {
  ['v-nome','v-usuario','v-senha','v-email','v-tel'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('v-cargo').value = 'vendedor';
  document.getElementById('v-meta').value  = '0';
  document.getElementById('modal-vend-titulo').textContent = 'Novo Vendedor';
  abrirModal('modal-vendedor');
}

async function salvarVendedor() {
  const nome    = document.getElementById('v-nome').value.trim();
  const usuario = document.getElementById('v-usuario').value.trim().toLowerCase();
  const senha   = document.getElementById('v-senha').value;
  if (!nome || !usuario || !senha) { toast('Nome, usuário e senha são obrigatórios.', 'error'); return; }
  if (senha.length < 6) { toast('Senha deve ter ao menos 6 caracteres.', 'error'); return; }

  btnLoading('btn-salvar-vend');
  try {
    const hash = await hashSenha(senha);
    await sb('vendedores', { metodo: 'POST', body: {
      nome, usuario, senha_hash: hash,
      cargo:    document.getElementById('v-cargo').value,
      meta:     parseFloat(document.getElementById('v-meta').value) || 0,
      email:    document.getElementById('v-email').value.trim(),
      telefone: document.getElementById('v-tel').value.trim(),
      status:   STATUS.ATIVO,
    }});
    toast('Vendedor criado!', 'success');
    fecharModal('modal-vendedor');
    renderAdmin();
  } catch (e) {
    toast(e.message.includes('unique') ? 'Usuário já existe.' : 'Erro: ' + e.message, 'error');
  } finally { btnReset('btn-salvar-vend'); }
}

async function toggleVendedor(id, statusAtual) {
  const novoStatus = statusAtual === STATUS.ATIVO ? STATUS.INATIVO : STATUS.ATIVO;
  confirmar(`${novoStatus === STATUS.ATIVO ? 'Ativar' : 'Bloquear'} este vendedor?`, async () => {
    try {
      await sb(`vendedores?id=eq.${id}`, { metodo: 'PATCH', body: { status: novoStatus } });
      toast(`Vendedor ${novoStatus}!`, 'success');
      renderAdmin();
    } catch (e) { toast('Erro: ' + e.message, 'error'); }
  });
}

async function excluirVendedor(id, nome) {
  confirmar(`Excluir o vendedor "${nome}" definitivamente?\n\nOs clientes vinculados ficarão sem vendedor.`, async () => {
    try {
      await sb(`vendedores?id=eq.${id}`, { metodo: 'DELETE' });
      toast('Vendedor excluído.', 'success');
      renderAdmin();
      renderDashboard();
    } catch (e) { toast('Erro: ' + e.message, 'error'); }
  });
}
