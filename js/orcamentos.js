// ============================================================
// orcamentos.js — Orçamentos e Itens
// ============================================================

let orcItens      = [];
let orcClienteId  = null;
let orcClienteNome= '';
let buscaTimer    = null;

async function renderOrcamentos() {
  setLoading();
  const c = document.getElementById('content');

  try {
    const filtro = ehAdmin() ? '' : `&vendedor_id=eq.${sessao.id}`;
    const orcs   = await sb('orcamentos', {
      params: `order=created_at.desc${filtro}&select=id,codigo,cliente_nome,total,status,created_at`,
    });

    c.innerHTML = `
      <div class="card">
        <div class="card-header">
          <span class="card-title">Orçamentos (${orcs.length})</span>
          <div class="toolbar">
            <input type="search" placeholder="Buscar..." oninput="filtrarTabela('tabela-orc', this.value)" style="width:200px">
            <select onchange="renderOrcamentos()" style="width:130px">
              <option value="">Todos</option>
              <option value="pendente">Pendentes</option>
              <option value="confirmado">Confirmados</option>
              <option value="cancelado">Cancelados</option>
            </select>
          </div>
        </div>
        <table>
          <thead><tr><th>Código</th><th>Cliente</th><th>Total</th><th>Status</th><th>Data</th><th></th></tr></thead>
          <tbody id="tabela-orc">
            ${orcs.length === 0
              ? '<tr><td colspan="6" class="empty">Nenhum orçamento.</td></tr>'
              : orcs.map(o => `
                <tr>
                  <td class="mono">${o.codigo || o.id.slice(0, 8)}</td>
                  <td class="primary">${o.cliente_nome || '—'}</td>
                  <td style="font-family:var(--mono);color:var(--green)">${fmt(o.total)}</td>
                  <td><span class="badge ${o.status}">${o.status}</span></td>
                  <td class="muted">${fmtData(o.created_at)}</td>
                  <td>
                    <div class="btn-group">
                      <button class="btn ghost sm" onclick="baixarOrcamentoExcel('${o.id}')" title="Baixar Excel">⬇ Excel</button>
                      ${o.status === 'pendente' ? `
                      <button class="btn ghost sm" onclick="confirmarOrcamento('${o.id}')">✓ Confirmar</button>
                      <button class="btn danger sm" onclick="cancelarOrcamento('${o.id}')">✕ Cancelar</button>` : ''}
                    </div>
                  </td>
                </tr>`).join('')}
          </tbody>
        </table>
      </div>`;
  } catch (e) { c.innerHTML = `<div class="empty">Erro: ${e.message}</div>`; }
}

function abrirModalOrc(clienteId, clienteNome) {
  orcClienteId    = clienteId;
  orcClienteNome  = clienteNome;
  orcItens        = [];
  document.getElementById('orc-cliente-nome').textContent  = clienteNome || 'Sem cliente vinculado';
  document.getElementById('orc-itens').innerHTML           = '';
  document.getElementById('orc-desconto').value            = '0';
  document.getElementById('orc-total').textContent         = 'R$ 0,00';
  document.getElementById('orc-obs').value                 = '';
  document.getElementById('orc-busca').value               = '';
  document.getElementById('orc-sugestoes').style.display   = 'none';
  abrirModal('modal-orc');
}

async function buscarProdutoOrc() {
  clearTimeout(buscaTimer);
  const q  = document.getElementById('orc-busca').value.trim();
  const el = document.getElementById('orc-sugestoes');
  if (q.length < 2) { el.style.display = 'none'; return; }

  buscaTimer = setTimeout(async () => {
    try {
      const res = await sb('produtos', {
        params: `status=eq.ativo&or=(nome.ilike.*${encodeURIComponent(q)}*,codigo.ilike.*${encodeURIComponent(q)}*)&limit=8&select=id,codigo,nome,preco`,
      });
      if (!res.length) { el.style.display = 'none'; return; }
      el.style.display = 'block';
      el.innerHTML = res.map(p => `
        <div class="sugestao-item"
          onmouseover="this.style.background='var(--bg3)'" onmouseout="this.style.background=''"
          onclick="adicionarItemOrc('${p.id}','${p.codigo}','${p.nome.replace(/'/g,"\\'")}',${p.preco})">
          <div>
            <span style="font-family:var(--mono);font-size:10px;color:var(--text3)">${p.codigo}</span><br>
            ${p.nome}
          </div>
          <div style="font-family:var(--mono);color:var(--green)">${fmt(p.preco)}</div>
        </div>`).join('');
    } catch (e) {}
  }, 300);
}

function adicionarItemOrc(prodId, codigo, nome, preco) {
  const ex = orcItens.find(i => i.produto_id === prodId);
  if (ex) {
    ex.quantidade++;
    ex.total = ex.quantidade * ex.valor_unitario;
  } else {
    orcItens.push({ produto_id: prodId, codigo, nome, quantidade: 1, valor_unitario: preco, desconto: 0, total: preco });
  }
  document.getElementById('orc-busca').value             = '';
  document.getElementById('orc-sugestoes').style.display = 'none';
  renderItensOrc();
}

function renderItensOrc() {
  document.getElementById('orc-itens').innerHTML = orcItens.map((it, i) => `
    <tr>
      <td>
        <div style="font-size:13px">${it.nome}</div>
        <div style="font-family:var(--mono);font-size:10px;color:var(--text3)">${it.codigo}</div>
      </td>
      <td><input type="number" min="1" value="${it.quantidade}" style="width:60px"
           onchange="alterarQtdOrc(${i}, this.value)"></td>
      <td style="font-family:var(--mono);color:var(--text2)">${fmt(it.valor_unitario)}</td>
      <td style="font-family:var(--mono);color:var(--green)">${fmt(it.total)}</td>
      <td><button class="btn ghost sm" onclick="removerItemOrc(${i})">✕</button></td>
    </tr>`).join('');
  calcOrcTotal();
}

function alterarQtdOrc(i, qtd) {
  orcItens[i].quantidade = Math.max(1, parseInt(qtd) || 1);
  orcItens[i].total      = orcItens[i].quantidade * orcItens[i].valor_unitario;
  renderItensOrc();
}

function removerItemOrc(i) { orcItens.splice(i, 1); renderItensOrc(); }

function calcOrcTotal() {
  const sub  = orcItens.reduce((s, i) => s + i.total, 0);
  const desc = parseFloat(document.getElementById('orc-desconto').value) || 0;
  document.getElementById('orc-total').textContent = fmt(Math.max(0, sub - desc));
}

async function salvarOrcamento() {
  if (!orcItens.length) { toast('Adicione pelo menos um produto.', 'error'); return; }

  try {
    const sub    = orcItens.reduce((s, i) => s + i.total, 0);
    const desc   = parseFloat(document.getElementById('orc-desconto').value) || 0;
    const total  = Math.max(0, sub - desc);
    const codigo = `ORC-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`;

    const [orc] = await sb('orcamentos', { metodo: 'POST', body: {
      codigo, cliente_id: orcClienteId || null, cliente_nome: orcClienteNome || 'Sem cliente',
      vendedor_id: sessao.id, vendedor_key: sessao.usuario,
      subtotal: sub, desconto: desc, total, status: 'pendente',
      observacoes: document.getElementById('orc-obs').value.trim(),
    }});

    await sb('orcamento_itens', { metodo: 'POST', body: orcItens.map(it => ({ ...it, orcamento_id: orc.id })) });

    toast('Orçamento criado!', 'success');
    fecharModal('modal-orc');
    ir('orcamentos');
  } catch (e) { toast('Erro: ' + e.message, 'error'); }
}

async function confirmarOrcamento(id) {
  confirmar('Confirmar este orçamento e registrar como venda?', async () => {
    try {
      const [orc] = await sb('orcamentos', { params: `id=eq.${id}` });
      const itens = await sb('orcamento_itens', { params: `orcamento_id=eq.${id}` });

      // Criar venda
      const codigo = `VDA-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`;
      const [venda] = await sb('vendas', { metodo: 'POST', body: {
        codigo, orcamento_id: id,
        cliente_id: orc.cliente_id, cliente_nome: orc.cliente_nome,
        vendedor_id: orc.vendedor_id, vendedor_key: orc.vendedor_key,
        subtotal: orc.subtotal, desconto: orc.desconto, total: orc.total,
        status: 'concluida', observacoes: orc.observacoes,
      }});

      // Copiar itens para venda_itens
      if (itens.length) {
        await sb('venda_itens', { metodo: 'POST', body: itens.map(it => ({
          venda_id: venda.id, produto_id: it.produto_id, codigo: it.codigo,
          nome: it.nome, quantidade: it.quantidade, valor_unitario: it.valor_unitario,
          desconto: it.desconto, total: it.total,
        }))});
      }

      // Atualizar orçamento
      await sb(`orcamentos?id=eq.${id}`, { metodo: 'PATCH', body: { status: 'confirmado' } });

      toast('Orçamento confirmado e venda registrada!', 'success');
      renderOrcamentos();
    } catch (e) { toast('Erro: ' + e.message, 'error'); }
  });
}

async function cancelarOrcamento(id) {
  confirmar('Cancelar este orçamento?', async () => {
    try {
      await sb(`orcamentos?id=eq.${id}`, { metodo: 'PATCH', body: { status: 'cancelado' } });
      toast('Orçamento cancelado.', 'success');
      renderOrcamentos();
    } catch (e) { toast('Erro: ' + e.message, 'error'); }
  });
}
