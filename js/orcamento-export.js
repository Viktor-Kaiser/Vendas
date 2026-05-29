// ============================================================
// orcamento-export.js — Gerador de Excel fiel ao modelo
// Replica layout, cores, mesclas e estilos do modelo original
// ============================================================

function carregarSheetJS(cb) {
  if (window.XLSX) { cb(); return; }
  const s = document.createElement('script');
  s.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
  s.onload = cb;
  document.head.appendChild(s);
}

// ── FUNÇÃO PRINCIPAL ──────────────────────────────────────────

async function baixarOrcamentoExcel(orcamentoId) {
  toast('Gerando Excel...', 'info');
  try {
    const [orcs, itens] = await Promise.all([
      sb('orcamentos', { params: `id=eq.${orcamentoId}` }),
      sb('orcamento_itens', { params: `orcamento_id=eq.${orcamentoId}` }),
    ]);

    if (!orcs.length) { toast('Orçamento não encontrado.', 'error'); return; }
    const orc = orcs[0];

    let cliente = {};
    if (orc.cliente_id) {
      const cls = await sb('clientes', { params: `id=eq.${orc.cliente_id}` });
      if (cls.length) cliente = cls[0];
    }

    let vendedorNome = orc.vendedor_key || '';
    if (orc.vendedor_id) {
      const vs = await sb('vendedores', { params: `id=eq.${orc.vendedor_id}&select=nome` });
      if (vs.length) vendedorNome = vs[0].nome;
    }

    carregarSheetJS(() => gerarExcel({
      codigo:           orc.codigo || orc.id.slice(0,8),
      data:             new Date().toLocaleDateString('pt-BR'),
      vendedor:         vendedorNome,
      cliente_nome:     cliente.nome      || orc.cliente_nome || '',
      cliente_endereco: cliente.endereco  || '',
      cliente_cidade:   cliente.cidade    || '',
      cliente_cnpj:     cliente.cpf_cnpj  || '',
      forma_pagamento:  'À combinar',
      itens:            itens,
      subtotal:         orc.subtotal  || 0,
      desconto:         orc.desconto  || 0,
      total:            orc.total     || 0,
      observacoes:      orc.observacoes || '',
    }));

  } catch (e) { toast('Erro: ' + e.message, 'error'); }
}

// ── GERADOR EXCEL ─────────────────────────────────────────────

function gerarExcel(d) {
  const wb = XLSX.utils.book_new();

  // ── ESTILOS ────────────────────────────────────────────────

  const RED    = 'FFFF0000';
  const NAVY   = 'FF002060';
  const YELLOW = 'FFFFFF99';
  const LYELLOW= 'FFFFFF00';
  const WHITE  = 'FFFFFFFF';
  const LGRAY  = 'FFF2F2F2';
  const BLACK  = 'FF000000';

  function cell(valor, opts = {}) {
    const c = { v: valor, t: typeof valor === 'number' ? 'n' : 's' };
    if (opts.fmt)  c.z = opts.fmt;
    if (opts.bold || opts.color || opts.size || opts.bg || opts.align || opts.italic || opts.wrap) {
      c.s = {};
      if (opts.bold || opts.color || opts.size || opts.italic) {
        c.s.font = {};
        if (opts.bold)   c.s.font.bold   = true;
        if (opts.italic) c.s.font.italic = true;
        if (opts.size)   c.s.font.sz     = opts.size;
        if (opts.color)  c.s.font.color  = { rgb: opts.color };
      }
      if (opts.bg) {
        c.s.fill = { fgColor: { rgb: opts.bg }, patternType: 'solid' };
      }
      if (opts.align) {
        c.s.alignment = {
          horizontal: opts.align,
          vertical:   'center',
          wrapText:   opts.wrap || false,
        };
      }
      if (opts.border) {
        const b = { style: 'thin', color: { rgb: 'FF000000' } };
        c.s.border = { top: b, bottom: b, left: b, right: b };
      }
    }
    return c;
  }

  function empty() { return { v: '', t: 's' }; }

  // ── DADOS DAS LINHAS ───────────────────────────────────────
  // Estrutura: 7 colunas A-G, linhas 1-31+

  const rows = [];

  // L1 — DATA | DADOS CADASTRAIS (B1:G2 mesclado)
  rows.push([
    cell(d.data,               { bold:true, size:10, align:'center' }),
    cell('DADOS CADASTRAIS',   { bold:true, size:11, color:RED, align:'center' }),
    empty(), empty(), empty(), empty(), empty(),
  ]);
  // L2 — continuação da mescla B1:G2
  rows.push([empty(), empty(), empty(), empty(), empty(), empty(), empty()]);

  // L3 — CONSULTOR
  rows.push([
    empty(),
    cell(`CONSULTOR(A): ${d.vendedor}`, { size:10, color:RED, bg:LYELLOW }),
    empty(), empty(), empty(), empty(), empty(),
  ]);

  // L4 — DADOS DO FORNECEDOR (A4:G4 mesclado)
  rows.push([
    cell('DADOS DO FORNECEDOR', { bold:true, size:10, align:'center', bg:LGRAY }),
    empty(), empty(), empty(), empty(), empty(), empty(),
  ]);

  // L5 — linha vazia (A5:G5 mesclado)
  rows.push([empty(), empty(), empty(), empty(), empty(), empty(), empty()]);

  // L6 — Razão Social
  rows.push([
    cell('Razão Social',                     { size:10, bg:LGRAY }),
    cell('MIR IMPORTAÇÃO E EXPORTAÇÃO LTDA', { bold:true, size:10, color:NAVY, align:'center' }),
    empty(), empty(), empty(), empty(), empty(),
  ]);

  // L7 — Endereço
  rows.push([
    cell('Endereço',                              { size:10, bg:LGRAY }),
    cell('Avenida Torquato Tapajós, 4865 - Flores', { size:10, align:'center' }),
    empty(), empty(), empty(), empty(), empty(),
  ]);

  // L8 — Cidade
  rows.push([
    cell('Cidade/UF',   { size:10, bg:LGRAY }),
    cell('Manaus - AM', { size:10, align:'center' }),
    empty(), empty(), empty(), empty(), empty(),
  ]);

  // L9 — Telefone
  rows.push([
    cell('Telefone',                       { size:10, bg:LGRAY }),
    cell('(92) 2121-4350 / 98825-4963',   { size:10, align:'center' }),
    empty(), empty(), empty(), empty(), empty(),
  ]);

  // L10 — CNPJ
  rows.push([
    cell('CNPJ',               { size:10, bg:LGRAY }),
    cell('03.341.024/0001-00', { size:10, align:'center' }),
    empty(), empty(), empty(), empty(), empty(),
  ]);

  // L11 — DADOS DO CLIENTE (A11:G11 mesclado)
  rows.push([
    cell('DADOS DO CLIENTE', { bold:true, size:10, align:'center', bg:LGRAY }),
    empty(), empty(), empty(), empty(), empty(), empty(),
  ]);

  // L12 — vazia (B12:G12 mesclado)
  rows.push([empty(), empty(), empty(), empty(), empty(), empty(), empty()]);

  // L13 — Cliente
  rows.push([
    cell('Cliente:', { size:10, bg:LGRAY }),
    cell(d.cliente_nome, { size:10 }),
    empty(), empty(), empty(), empty(), empty(),
  ]);

  // L14 — Endereço cliente
  rows.push([
    cell('Endereço:', { size:10, bg:LGRAY }),
    cell(d.cliente_endereco, { size:10 }),
    empty(), empty(), empty(), empty(), empty(),
  ]);

  // L15 — Cidade cliente
  rows.push([
    cell('Cidade/UF', { size:10, bg:LGRAY }),
    cell(d.cliente_cidade, { size:10 }),
    empty(), empty(), empty(), empty(), empty(),
  ]);

  // L16 — CNPJ cliente
  rows.push([
    cell('CNPJ', { size:10, bg:LGRAY }),
    cell(d.cliente_cnpj, { size:10 }),
    empty(), empty(), empty(), empty(), empty(),
  ]);

  // L17-18 — ORÇAMENTO Nº (A17:G18 mesclado)
  rows.push([
    cell(`                  ORÇAMENTO Nº ${d.codigo}`,
      { bold:true, size:11, color:RED, bg:YELLOW, align:'center' }),
    empty(), empty(), empty(), empty(), empty(), empty(),
  ]);
  rows.push([empty(), empty(), empty(), empty(), empty(), empty(), empty()]);

  // L19 — Forma de pagamento
  rows.push([
    cell(`FORMA DE PAGAMENTO: ${d.forma_pagamento}`,
      { bold:true, size:8 }),
    empty(), empty(), empty(), empty(), empty(), empty(),
  ]);

  // L20 — linha vazia (A20:F20 mesclado)
  rows.push([empty(), empty(), empty(), empty(), empty(), empty(), empty()]);

  // L21-22 — Cabeçalho da tabela de itens
  rows.push([
    cell('ITEM',             { bold:true, size:10, align:'center', bg:LGRAY, border:true }),
    cell('MATERIAL',         { bold:true, size:10, align:'center', bg:LGRAY, border:true }),
    cell('Código',           { bold:true, size:10, align:'center', bg:LGRAY, border:true }),
    cell('QT.',              { bold:true, size:10, align:'center', bg:LGRAY, border:true }),
    cell('PREÇO',            { bold:true, size:10, align:'center', bg:LGRAY, border:true }),
    cell('PROD C/ DESCONTO', { bold:true, size:10, align:'center', bg:LGRAY, border:true }),
    cell('TOTAL',            { bold:true, size:10, align:'center', bg:LGRAY, border:true }),
  ]);
  rows.push([
    empty(),
    empty(),
    empty(),
    empty(),
    cell('UNITÁRIO', { bold:true, size:10, align:'center', bg:LGRAY, border:true }),
    empty(),
    empty(),
  ]);

  // L23 — linha vazia
  rows.push([empty(), empty(), empty(), empty(), empty(), empty(), empty()]);

  // L24-28 — Itens (5 linhas)
  const fmtMoeda = '"R$"#,##0.00';
  for (let i = 0; i < 5; i++) {
    if (i < d.itens.length) {
      const it = d.itens[i];
      const total = Number(it.total || 0);
      const preco = Number(it.valor_unitario || 0);
      rows.push([
        cell(i + 1,           { size:10, align:'center', border:true }),
        cell(it.nome || '',   { size:10, border:true, wrap:true }),
        cell(it.codigo || '', { size:10, align:'center', border:true }),
        cell(Number(it.quantidade || 1), { size:10, align:'center', border:true }),
        { v: preco, t:'n', z: fmtMoeda, s:{ font:{sz:10}, alignment:{horizontal:'center'}, border:{ top:{style:'thin'}, bottom:{style:'thin'}, left:{style:'thin'}, right:{style:'thin'} } } },
        { v: total, t:'n', z: fmtMoeda, s:{ font:{sz:10}, alignment:{horizontal:'center'}, border:{ top:{style:'thin'}, bottom:{style:'thin'}, left:{style:'thin'}, right:{style:'thin'} } } },
        { v: total, t:'n', z: fmtMoeda, s:{ font:{sz:10, color:{rgb:NAVY}}, alignment:{horizontal:'center'}, border:{ top:{style:'thin'}, bottom:{style:'thin'}, left:{style:'thin'}, right:{style:'thin'} } } },
      ]);
    } else {
      rows.push([
        cell(i + 1,  { size:10, align:'center', border:true }),
        cell('',     { border:true }),
        cell('',     { border:true }),
        cell('',     { border:true }),
        cell('',     { border:true }),
        cell('',     { border:true }),
        cell('',     { border:true }),
      ]);
    }
  }

  // L29 — vazia
  rows.push([empty(), empty(), empty(), empty(), empty(), empty(), empty()]);

  // L30 — Validade + Total geral
  rows.push([
    cell('VALIDADE PROPOSTA: 24 H', { bold:true, size:11, color:RED }),
    empty(), empty(), empty(), empty(), empty(),
    { v: Number(d.total), t:'n', z: fmtMoeda,
      s: { font:{bold:true, sz:11, color:{rgb:NAVY}}, alignment:{horizontal:'center'},
           fill:{fgColor:{rgb:'FFDCE6F1'}, patternType:'solid'} } },
  ]);

  // L31 — observações
  if (d.observacoes) {
    rows.push([
      cell(`Obs: ${d.observacoes}`, { size:9, italic:true, color:'00666666' }),
      empty(), empty(), empty(), empty(), empty(), empty(),
    ]);
  }

  // ── CRIAR PLANILHA ─────────────────────────────────────────
  const ws = XLSX.utils.aoa_to_sheet(rows);

  // Larguras das colunas (fiéis ao modelo)
  ws['!cols'] = [
    { wch: 13.4 }, // A
    { wch: 47.7 }, // B
    { wch: 10.6 }, // C
    { wch: 7.4  }, // D
    { wch: 14.0 }, // E
    { wch: 14.1 }, // F
    { wch: 15.1 }, // G
  ];

  // Alturas das linhas
  ws['!rows'] = [];
  const alturas = {
    0:24.9, 1:24.9, 3:20.1, 5:20.1, 6:20.1, 7:20.1, 8:20.1, 9:20.1,
    10:20.1, 12:20.1, 13:20.1, 14:20.1, 15:20.1, 16:34.5, 17:13.5,
    18:23.2, 19:12.0, 20:25.5, 21:13.5, 22:13.5, 23:13.5, 24:13.5,
    25:28.5, 26:28.5, 27:28.5, 28:28.5, 29:23.2,
  };
  for (let i = 0; i < rows.length; i++) {
    ws['!rows'][i] = { hpt: alturas[i] || 18 };
  }

  // Mesclas (fiéis ao modelo)
  ws['!merges'] = [
    // B1:G2 — DADOS CADASTRAIS
    { s:{r:0,c:1}, e:{r:1,c:6} },
    // B3:G3 — CONSULTOR
    { s:{r:2,c:1}, e:{r:2,c:6} },
    // A4:G4 — DADOS DO FORNECEDOR
    { s:{r:3,c:0}, e:{r:3,c:6} },
    // A5:G5
    { s:{r:4,c:0}, e:{r:4,c:6} },
    // B6:G6
    { s:{r:5,c:1}, e:{r:5,c:6} },
    // B7:G7
    { s:{r:6,c:1}, e:{r:6,c:6} },
    // B8:G8
    { s:{r:7,c:1}, e:{r:7,c:6} },
    // B9:G9
    { s:{r:8,c:1}, e:{r:8,c:6} },
    // B10:G10
    { s:{r:9,c:1}, e:{r:9,c:6} },
    // A11:G11 — DADOS DO CLIENTE
    { s:{r:10,c:0}, e:{r:10,c:6} },
    // B12:G12
    { s:{r:11,c:1}, e:{r:11,c:6} },
    // B13:G13
    { s:{r:12,c:1}, e:{r:12,c:6} },
    // B14:G14
    { s:{r:13,c:1}, e:{r:13,c:6} },
    // B15:G15
    { s:{r:14,c:1}, e:{r:14,c:6} },
    // B16:G16
    { s:{r:15,c:1}, e:{r:15,c:6} },
    // A17:G18 — ORÇAMENTO
    { s:{r:16,c:0}, e:{r:17,c:6} },
    // A19:F19 — FORMA PAGAMENTO (G livre)
    { s:{r:18,c:0}, e:{r:18,c:5} },
    // A20:F20
    { s:{r:19,c:0}, e:{r:19,c:5} },
    // A21:A22 — ITEM
    { s:{r:20,c:0}, e:{r:21,c:0} },
    // B21:B22 — MATERIAL
    { s:{r:20,c:1}, e:{r:21,c:1} },
    // C21:C22 — CÓDIGO
    { s:{r:20,c:2}, e:{r:21,c:2} },
    // D21:D22 — QT
    { s:{r:20,c:3}, e:{r:21,c:3} },
    // F21:F22 — PROD C/ DESCONTO
    { s:{r:20,c:5}, e:{r:21,c:5} },
    // G21:G22 — TOTAL
    { s:{r:20,c:6}, e:{r:21,c:6} },
    // A30:F30 — VALIDADE
    { s:{r:29,c:0}, e:{r:29,c:5} },
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Orçamento');
  XLSX.writeFile(wb, `Orcamento_${(d.codigo||'').replace(/-/g,'_')}.xlsx`);
  toast('Excel baixado!', 'success');
}
