// ============================================================
// dashboard.js — Dashboard e métricas
// ============================================================

async function renderDashboard() {
  setLoading();
  const c = document.getElementById('content');

  try {
    const now    = new Date();
    const mesStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const filtroV = ehAdmin() ? '' : `&vendedor_id=eq.${sessao.id}`;

    const [vendas, orcPend, clientesAtivos] = await Promise.all([
      sb('vendas',    { params: `created_at=gte.${mesStr}-01${filtroV}&select=total,created_at` }),
      sb('orcamentos',{ params: `status=eq.pendente${filtroV}&select=id` }),
      sb('clientes',  { params: `status=eq.ativo${filtroV}&select=id` }),
    ]);

    const totalMes    = vendas.reduce((s, v) => s + Number(v.total), 0);
    const qtdVendas   = vendas.length;
    const ticketMedio = qtdVendas > 0 ? totalMes / qtdVendas : 0;
    const pctMeta     = sessao.meta > 0 ? Math.min((totalMes / sessao.meta) * 100, 100) : 0;

    // Badge de orçamentos pendentes
    const badge = document.getElementById('badge-orc');
    if (orcPend.length > 0) { badge.textContent = orcPend.length; badge.style.display = ''; }
    else badge.style.display = 'none';

    // Ranking (só admin)
    let rankingHTML = '';
    if (ehAdmin()) {
      const [todasVendas, todos] = await Promise.all([
        sb('vendas',    { params: `created_at=gte.${mesStr}-01&select=total,vendedor_id` }),
        sb('vendedores',{ params: 'status=eq.ativo&select=id,nome,meta' }),
      ]);
      const mapa = {};
      todasVendas.forEach(v => { mapa[v.vendedor_id] = (mapa[v.vendedor_id] || 0) + Number(v.total); });
      const rank = todos
        .map(v => ({ ...v, totalMes: mapa[v.id] || 0 }))
        .sort((a, b) => b.totalMes - a.totalMes)
        .slice(0, 5);

      rankingHTML = `
        <div class="card" style="margin-top:16px">
          <div class="card-header"><span class="card-title">🏆 Ranking do Mês</span></div>
          ${rank.map((v, i) => `
            <div class="ranking-item">
              <div class="rank-num ${i === 0 ? 'gold' : ''}">${i + 1}</div>
              <div class="rank-info">
                <div class="rank-nome">${v.nome}</div>
                <div class="progress-bar">
                  <div class="progress-fill" style="width:${v.meta > 0 ? Math.min((v.totalMes / v.meta) * 100, 100) : 0}%"></div>
                </div>
              </div>
              <div class="rank-valor">${fmt(v.totalMes)}</div>
            </div>`).join('')}
        </div>`;
    }

    // Gráfico de barras por dia
    const diasMap = {};
    vendas.forEach(v => {
      const dia = v.created_at.slice(8, 10);
      diasMap[dia] = (diasMap[dia] || 0) + Number(v.total);
    });
    const dias = Object.entries(diasMap).sort((a, b) => a[0] - b[0]);
    const maxV = Math.max(...dias.map(d => d[1]), 1);

    c.innerHTML = `
      <div class="stats-grid">
        <div class="stat-card red">
          <div class="stat-label">🔴 Vendas do Mês</div>
          <div class="stat-value red">${fmt(totalMes)}</div>
          <div class="stat-sub">${qtdVendas} venda(s) · ${mesStr.replace('-', '/')}</div>
          ${sessao.meta > 0 ? `
            <div class="progress-bar" style="margin-top:10px">
              <div class="progress-fill" style="width:${pctMeta}%"></div>
            </div>
            <div class="stat-sub" style="margin-top:4px">Meta: ${fmt(sessao.meta)} · ${pctMeta.toFixed(0)}%</div>` : ''}
        </div>
        <div class="stat-card blue">
          <div class="stat-label">◈ Ticket Médio</div>
          <div class="stat-value blue">${fmt(ticketMedio)}</div>
          <div class="stat-sub">Mês: ${mesStr.replace('-', '/')}</div>
        </div>
        <div class="stat-card yellow">
          <div class="stat-label">◈ Orç. Pendentes</div>
          <div class="stat-value yellow">${orcPend.length}</div>
          <div class="stat-sub">aguardando confirmação</div>
        </div>
        <div class="stat-card green">
          <div class="stat-label">◎ Clientes Ativos</div>
          <div class="stat-value green">${clientesAtivos.length}</div>
          <div class="stat-sub">na sua carteira</div>
        </div>
      </div>

      <div class="card">
        <div class="card-header"><span class="card-title">Vendas por dia — ${mesStr.replace('-', '/')}</span></div>
        <div style="padding:20px;min-height:130px">
          ${dias.length === 0
            ? '<div class="empty">Sem vendas no período</div>'
            : `<div style="display:flex;align-items:flex-end;gap:4px;height:100px">
                ${dias.map(([dia, val]) => `
                  <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px" title="Dia ${dia}: ${fmt(val)}">
                    <div style="width:100%;background:var(--red);border-radius:3px 3px 0 0;height:${Math.round((val / maxV) * 90) + 10}px;opacity:0.85;transition:opacity 0.2s"
                         onmouseover="this.style.opacity=1" onmouseout="this.style.opacity=0.85"></div>
                    <div style="font-family:var(--mono);font-size:9px;color:var(--text3)">${dia}</div>
                  </div>`).join('')}
               </div>`}
        </div>
      </div>
      ${rankingHTML}`;

  } catch (e) {
    c.innerHTML = `<div class="empty">Erro ao carregar dashboard: ${e.message}</div>`;
  }
}
