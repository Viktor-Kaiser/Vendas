// ============================================================
// orcamento-export.js — Gerador de Excel de Orçamento
// Usa SheetJS (xlsx) para gerar o arquivo no browser
// ============================================================

// Carrega SheetJS dinamicamente
function carregarSheetJS(cb) {
  if (window.XLSX) { cb(); return; }
  const s = document.createElement('script');
  s.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
  s.onload = cb;
  document.head.appendChild(s);
}

// ── FUNÇÃO PRINCIPAL ──────────────────────────────────────────
// Chame com os dados do orçamento para baixar o Excel

async function baixarOrcamentoExcel(orcamentoId) {
  toast('Gerando Excel...', 'info');

  try {
    // Buscar dados do orçamento + itens + cliente
    const [orcs, itens] = await Promise.all([
      sb('orcamentos', { params: `id=eq.${orcamentoId}` }),
      sb('orcamento_itens', { params: `orcamento_id=eq.${orcamentoId}` }),
    ]);

    if (!orcs.length) { toast('Orçamento não encontrado.', 'error'); return; }
    const orc = orcs[0];

    // Buscar dados do cliente se tiver
    let cliente = {};
    if (orc.cliente_id) {
      const cls = await sb('clientes', { params: `id=eq.${orc.cliente_id}` });
      if (cls.length) cliente = cls[0];
    }

    // Buscar nome do vendedor
    let vendedor = { nome: orc.vendedor_key || '' };
    if (orc.vendedor_id) {
      const vs = await sb('vendedores', { params: `id=eq.${orc.vendedor_id}&select=nome` });
      if (vs.length) vendedor = vs[0];
    }

    const dados = {
      codigo:            orc.codigo || orc.id.slice(0, 8),
      data:              new Date().toLocaleDateString('pt-BR'),
      vendedor:          vendedor.nome,
      cliente_nome:      cliente.nome      || orc.cliente_nome || '',
      cliente_endereco:  cliente.endereco  || '',
      cliente_cidade:    cliente.cidade    || '',
      cliente_cnpj:      cliente.cpf_cnpj  || '',
      forma_pagamento:   'À combinar',
      itens:             itens,
      subtotal:          orc.subtotal,
      desconto:          orc.desconto,
      total:             orc.total,
      observacoes:       orc.observacoes   || '',
    };

    carregarSheetJS(() => gerarExcel(dados));

  } catch (e) {
    toast('Erro ao gerar Excel: ' + e.message, 'error');
  }
}

// ── GERADOR DO EXCEL ─────────────────────────────────────────

function gerarExcel(d) {
  const wb = XLSX.utils.book_new();

  // Montar dados da planilha como array de arrays
  const rows = [];

  // Linha 1 — Cabeçalho
  rows.push([d.data, 'DADOS CADASTRAIS', '', '', '', '', '']);
  rows.push(['', '', '', '', '', '', '']);

  // Linha 3 — Consultor
  rows.push(['', `CONSULTOR(A): ${d.vendedor}`, '', '', '', '', '']);

  // Linha 4-5 — Dados do fornecedor
  rows.push(['DADOS DO FORNECEDOR', '', '', '', '', '', '']);
  rows.push(['', '', '', '', '', '', '']);

  // Linhas 6-10 — Dados fixos Ramsons
  rows.push(['Razão Social', 'MIR IMPORTAÇÃO E EXPORTAÇÃO LTDA', '', '', '', '', '']);
  rows.push(['Endereço',     'Avenida Torquato Tapajós, 4865 - Flores', '', '', '', '', '']);
  rows.push(['Cidade/UF',   'Manaus - AM', '', '', '', '', '']);
  rows.push(['Telefone',    '(92) 2121-4350 / 98825-4963', '', '', '', '', '']);
  rows.push(['CNPJ',        '03.341.024/0001-00', '', '', '', '', '']);

  // Linha 11 — Dados do cliente
  rows.push(['DADOS DO CLIENTE', '', '', '', '', '', '']);
  rows.push(['', '', '', '', '', '', '']);
  rows.push([`Cliente:`,   d.cliente_nome,      '', '', '', '', '']);
  rows.push([`Endereço:`,  d.cliente_endereco,  '', '', '', '', '']);
  rows.push([`Cidade/UF`,  d.cliente_cidade,    '', '', '', '', '']);
  rows.push([`CNPJ`,       d.cliente_cnpj,      '', '', '', '', '']);

  // Linha 17-18 — Título orçamento
  rows.push([`                  ORÇAMENTO Nº ${d.codigo}`, '', '', '', '', '', '']);
  rows.push(['', '', '', '', '', '', '']);

  // Linha 19 — Forma de pagamento
  rows.push([`FORMA DE PAGAMENTO: ${d.forma_pagamento}`, '', '', '', '', '', '']);

  // Linha 20 — Espaço
  rows.push(['', '', '', '', '', '', '']);

  // Linha 21-22 — Cabeçalho tabela
  rows.push(['ITEM', 'MATERIAL', 'Código', 'QT.', 'PREÇO',    'PROD C/ DESCONTO', 'TOTAL']);
  rows.push(['',     '',         '',        '',    'UNITÁRIO', '',                  '']);

  // Linha 23 — Espaço
  rows.push(['', '', '', '', '', '', '']);

  // Linhas 24-28 — Itens (até 5)
  for (let i = 0; i < 5; i++) {
    if (i < d.itens.length) {
      const it = d.itens[i];
      const total = Number(it.total || 0);
      rows.push([
        i + 1,
        it.nome       || '',
        it.codigo     || '',
        it.quantidade || 1,
        Number(it.valor_unitario || 0),
        total,
        total,
      ]);
    } else {
      rows.push([i + 1, '', '', '', '', '', '']);
    }
  }

  // Linha 29 — Espaço
  rows.push(['', '', '', '', '', '', '']);

  // Linha 30 — Validade + Total
  rows.push([
    'VALIDADE PROPOSTA: 24 H', '', '', '',
    'TOTAL GERAL:', '',
    Number(d.total || 0),
  ]);

  // Observações se houver
  if (d.observacoes) {
    rows.push(['', '', '', '', '', '', '']);
    rows.push([`Observações: ${d.observacoes}`, '', '', '', '', '', '']);
  }

  // Criar planilha
  const ws = XLSX.utils.aoa_to_sheet(rows);

  // Larguras das colunas (A-G)
  ws['!cols'] = [
    { wch: 18 }, // A
    { wch: 35 }, // B
    { wch: 14 }, // C
    { wch: 6  }, // D
    { wch: 12 }, // E
    { wch: 18 }, // F
    { wch: 14 }, // G
  ];

  // Mesclas principais (replicando o modelo)
  ws['!merges'] = [
    { s:{r:0,c:1}, e:{r:1,c:6}  }, // B1:G2 — DADOS CADASTRAIS
    { s:{r:3,c:0}, e:{r:3,c:6}  }, // A4:G4 — DADOS DO FORNECEDOR
    { s:{r:5,c:1}, e:{r:5,c:6}  }, // B6:G6
    { s:{r:6,c:1}, e:{r:6,c:6}  }, // B7:G7
    { s:{r:7,c:1}, e:{r:7,c:6}  }, // B8:G8
    { s:{r:8,c:1}, e:{r:8,c:6}  }, // B9:G9
    { s:{r:9,c:1}, e:{r:9,c:6}  }, // B10:G10
    { s:{r:10,c:0},e:{r:10,c:6} }, // A11:G11 — DADOS DO CLIENTE
    { s:{r:12,c:1},e:{r:12,c:6} }, // B13:G13
    { s:{r:13,c:1},e:{r:13,c:6} }, // B14:G14
    { s:{r:14,c:1},e:{r:14,c:6} }, // B15:G15
    { s:{r:15,c:1},e:{r:15,c:6} }, // B16:G16
    { s:{r:16,c:0},e:{r:17,c:6} }, // A17:G18 — ORÇAMENTO
    { s:{r:18,c:0},e:{r:18,c:5} }, // A19:F19 — FORMA PAGAMENTO
    { s:{r:29,c:0},e:{r:29,c:3} }, // A30:D30 — VALIDADE
  ];

  // Formatar células de preço
  const fmtMoeda = '"R$"#,##0.00';
  const linhasPreco = [23, 24, 25, 26, 27, 28, 29]; // rows 24-30 (0-indexed: 23-29)
  linhasPreco.forEach(r => {
    ['E','F','G'].forEach(col => {
      const ref = `${col}${r + 1}`;
      if (ws[ref]) ws[ref].z = fmtMoeda;
    });
  });

  // Adicionar à workbook e baixar
  XLSX.utils.book_append_sheet(wb, ws, 'Orçamento');
  XLSX.writeFile(wb, `Orcamento_${d.codigo.replace(/-/g,'_')}.xlsx`);
  toast('Excel baixado!', 'success');
}
