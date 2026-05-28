// ============================================================
// clientes.js — CRUD de Clientes
// ============================================================

async function renderClientes() {
  setLoading();
  const c = document.getElementById('content');

  try {
    const filtro  = ehAdmin() ? 'status=neq.arquivado' : `vendedor_id=eq.${sessao.id}&status=neq.arquivado`;
    const clientes = await sb('clientes', {
      params: `${filtro}&order=nome.asc&select=id,nome,cpf_cnpj,telefone,cidade,status`,
    });

    c.innerHTML = `
      <div class="card">
        <div class="card-header">
          <span class="card-title">Clientes (${clientes.length})</span>
          <div class="toolbar">
            <input type="search" placeholder="Buscar..." oninput="filtrarTabela('tabela-cli', this.value)" style="width:200px">
            <select onchange="renderClientes()" style="width:130px">
              <option value="">Todos</option>
              <option value="ativo">Ativos</option>
              <option value="inativo">Inativos</option>
            </select>
          </div>
        </div>
        <table>
          <thead>
            <tr><th>Nome</th><th>CPF/CNPJ</th><th>Telefone</th><th>Cidade</th><th>Status</th></tr>
          </thead>
          <tbody id="tabela-cli">
            ${clientes.length === 0
              ? '<tr><td colspan="5" class="empty">Nenhum cliente cadastrado.</td></tr>'
              : clientes.map(cl => `
                <tr onclick="abrirDetalheCliente('${cl.id}')">
                  <td class="primary">${cl.nome}</td>
                  <td class="mono">${cl.cpf_cnpj || '—'}</td>
                  <td class="muted">${cl.telefone || '—'}</td>
                  <td class="muted">${cl.cidade || '—'}</td>
                  <td><span class="badge ${cl.status}">${cl.status}</span></td>
                </tr>`).join('')}
          </tbody>
        </table>
      </div>`;

  } catch (e) { c.innerHTML = `<div class="empty">Erro: ${e.message}</div>`; }
}

function abrirModalCliente(cliente = null) {
  const novo = !cliente;
  document.getElementById('modal-cliente-titulo').textContent = novo ? 'Novo Cliente' : 'Editar Cliente';
  document.getElementById('modal-cliente-sub').textContent    = novo ? '' : cliente.nome;
  document.getElementById('c-nome').value    = cliente?.nome         || '';
  document.getElementById('c-cpf').value     = cliente?.cpf_cnpj    || '';
  document.getElementById('c-email').value   = cliente?.email        || '';
  document.getElementById('c-tel').value     = cliente?.telefone     || '';
  document.getElementById('c-wpp').value     = cliente?.whatsapp     || '';
  document.getElementById('c-cidade').value  = cliente?.cidade       || 'Manaus';
  document.getElementById('c-end').value     = cliente?.endereco     || '';
  document.getElementById('c-obs').value     = cliente?.observacoes  || '';
  document.getElementById('btn-salvar-cliente').dataset.id = cliente?.id || '';
  abrirModal('modal-cliente');
}

async function salvarCliente() {
  const id   = document.getElementById('btn-salvar-cliente').dataset.id;
  const nome = document.getElementById('c-nome').value.trim();
  if (!nome) { toast('Nome é obrigatório.', 'error'); return; }

  btnLoading('btn-salvar-cliente');
  try {
    const dados = {
      nome,
      cpf_cnpj:    document.getElementById('c-cpf').value.trim(),
      email:       document.getElementById('c-email').value.trim(),
      telefone:    document.getElementById('c-tel').value.trim(),
      whatsapp:    document.getElementById('c-wpp').value.trim(),
      cidade:      document.getElementById('c-cidade').value.trim() || 'Manaus',
      endereco:    document.getElementById('c-end').value.trim(),
      observacoes: document.getElementById('c-obs').value.trim(),
    };

    if (id) {
      await sb(`clientes?id=eq.${id}`, { metodo: 'PATCH', body: dados });
      toast('Cliente atualizado!', 'success');
    } else {
      await sb('clientes', { metodo: 'POST', body: {
        ...dados, vendedor_id: sessao.id, vendedor_key: sessao.usuario, status: STATUS.ATIVO,
      }});
      toast('Cliente cadastrado!', 'success');
    }
    fecharModal('modal-cliente');
    renderClientes();
  } catch (e) { toast('Erro: ' + e.message, 'error'); }
  finally { btnReset('btn-salvar-cliente'); }
}

async function abrirDetalheCliente(id) {
  abrirModal('modal-detalhe');
  document.getElementById('det-nome').textContent = 'Carregando...';
  document.getElementById('det-body').innerHTML   = '<div class="loading"><div class="spinner"></div></div>';

  try {
    const [[cl], vendas] = await Promise.all([
      sb('clientes', { params: `id=eq.${id}` }),
      sb('vendas',   { params: `cliente_id=eq.${id}&order=created_at.desc&limit=5&select=id,codigo,total,status,created_at` }),
    ]);

    document.getElementById('det-nome').textContent = cl.nome;
    document.getElementById('det-id').textContent   = `ID: ${cl.id.slice(0, 12)}...`;

    document.getElementById('det-body').innerHTML = `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px">
        ${campo('CPF/CNPJ',   cl.cpf_cnpj  || '—')}
        ${campo('Status',     cl.status)}
        ${campo('Email',      cl.email      || '—')}
        ${campo('Telefone',   cl.telefone   || '—')}
        ${campo('WhatsApp',   cl.whatsapp   || '—')}
        ${campo('Cidade',     cl.cidade     || '—')}
        ${campo('Endereço',   cl.endereco   || '—')}
        ${cl.observacoes ? `<div style="grid-column:1/-1">${campo('Observações', cl.observacoes)}</div>` : ''}
      </div>
      <div class="form-label" style="margin-bottom:10px">Últimas Compras (${vendas.length})</div>
      ${vendas.length === 0
        ? '<div style="color:var(--text3);font-size:13px">Nenhuma compra registrada.</div>'
        : `<table>
            <thead><tr><th>Código</th><th>Data</th><th>Total</th><th>Status</th></tr></thead>
            <tbody>
              ${vendas.map(v => `
                <tr>
                  <td class="mono">${v.codigo || v.id.slice(0, 8)}</td>
                  <td class="muted">${fmtData(v.created_at)}</td>
                  <td style="font-family:var(--mono);color:var(--green)">${fmt(v.total)}</td>
                  <td><span class="badge ${v.status}">${v.status}</span></td>
                </tr>`).join('')}
            </tbody>
           </table>`}`;

    document.getElementById('det-footer').innerHTML = `
      <button class="btn ghost sm" onclick="abrirModalOrc('${cl.id}','${cl.nome.replace(/'/g, "\\'")}');fecharModal('modal-detalhe')">📋 Orçamento</button>
      <button class="btn ghost sm" onclick="fecharModal('modal-detalhe');abrirModalCliente(${JSON.stringify(cl).replace(/"/g,'&quot;')})">✏️ Editar</button>
      <button class="btn danger sm" onclick="excluirCliente('${cl.id}','${cl.nome.replace(/'/g, "\\'")}')">🗑️ Excluir</button>`;

  } catch (e) {
    document.getElementById('det-body').innerHTML = `<div class="empty">Erro: ${e.message}</div>`;
  }
}

async function excluirCliente(id, nome) {
  confirmar(`Excluir "${nome}" definitivamente?\n\nEsta ação não pode ser desfeita.`, async () => {
    try {
      await sb(`clientes?id=eq.${id}`, { metodo: 'DELETE' });
      toast('Cliente excluído.', 'success');
      fecharModal('modal-detalhe');
      renderClientes();
    } catch (e) { toast('Erro: ' + e.message, 'error'); }
  });
}
