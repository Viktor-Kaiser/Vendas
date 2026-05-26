// ============================================================
// router.js — Navegação entre páginas
// ============================================================

let paginaAtual = 'dashboard';

function ir(pagina) {
  paginaAtual = pagina;

  const titulos = {
    dashboard:  'Dashboard',
    clientes:   'Clientes',
    orcamentos: 'Orçamentos',
    historico:  'Histórico',
    produtos:   'Produtos',
    admin:      'Administração',
  };

  document.getElementById('page-title').textContent = titulos[pagina] || pagina;

  // Atualizar nav ativo
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
  const navAtivo = document.querySelector(`.nav-item[data-page="${pagina}"]`);
  if (navAtivo) navAtivo.classList.add('active');

  // Renderizar página
  const renders = {
    dashboard:  renderDashboard,
    clientes:   renderClientes,
    orcamentos: renderOrcamentos,
    historico:  renderHistorico,
    produtos:   renderProdutos,
    admin:      renderAdmin,
  };

  if (renders[pagina]) renders[pagina]();
}

function acaoNovo() {
  const acoes = {
    clientes:   () => abrirModalCliente(),
    orcamentos: () => abrirModalOrc(null, ''),
    admin:      () => abrirModalVendedor(),
  };
  if (acoes[paginaAtual]) acoes[paginaAtual]();
}

function setLoading() {
  document.getElementById('content').innerHTML =
    '<div class="loading"><div class="spinner"></div>CARREGANDO...</div>';
}
