// ============================================================
// marketing.js — Campanhas de Marketing
// ============================================================

const EDGE_URL = `${SUPA_URL}/functions/v1/enviar-campanha`;

async function renderMarketing() {
  setLoading();
  const c = document.getElementById('content');

  c.innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;align-items:start">

      <!-- FORMULÁRIO DE CAMPANHA -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">📣 Nova Campanha</span>
        </div>
        <div style="padding:20px">

          <div class="form-group" style="margin-bottom:16px">
            <label class="form-label">Assunto do Email *</label>
            <input id="camp-assunto" placeholder="Ex: Oferta especial de fim de semana!">
          </div>

          <div class="form-group" style="margin-bottom:16px">
            <label class="form-label">Mensagem *</label>
            <textarea id="camp-mensagem" style="min-height:140px"
              placeholder="Olá! Temos ofertas imperdíveis para você...&#10;&#10;Confira nossas promoções especiais!"></textarea>
          </div>

          <div class="form-group" style="margin-bottom:20px">
            <label class="form-label">Imagem (opcional)</label>
            <div id="camp-img-area"
              style="border:2px dashed var(--border2);border-radius:8px;padding:24px;text-align:center;cursor:pointer;transition:border-color 0.2s"
              onclick="document.getElementById('camp-img-input').click()"
              ondragover="event.preventDefault();this.style.borderColor='var(--accent)'"
              ondragleave="this.style.borderColor='var(--border2)'"
              ondrop="handleImgDrop(event)">
              <div id="camp-img-preview" style="display:none;margin-bottom:12px">
                <img id="camp-img-thumb" style="max-width:100%;max-height:200px;border-radius:6px;object-fit:contain">
              </div>
              <div id="camp-img-placeholder">
                <div style="font-size:28px;margin-bottom:8px">🖼️</div>
                <div style="font-size:13px;color:var(--text2)">Clique ou arraste uma imagem aqui</div>
                <div style="font-family:var(--mono);font-size:10px;color:var(--text3);margin-top:4px">JPG, PNG ou GIF · Máx 2MB</div>
              </div>
            </div>
            <input id="camp-img-input" type="file" accept="image/*" style="display:none" onchange="handleImgSelect(this)">
            <div id="camp-img-nome" style="font-family:var(--mono);font-size:11px;color:var(--text3);margin-top:6px;display:none"></div>
            <button id="camp-img-remover" class="btn ghost sm" style="display:none;margin-top:8px" onclick="removerImagem()">✕ Remover imagem</button>
          </div>

          <!-- PREVIEW DO EMAIL -->
          <div style="margin-bottom:20px">
            <div class="form-label" style="margin-bottom:8px">Preview do Email</div>
            <div id="camp-preview"
              style="background:#f4f4f4;border-radius:8px;padding:16px;font-size:12px;color:#333;border:1px solid var(--border)">
              <div style="background:#E8191A;padding:12px;text-align:center;border-radius:6px 6px 0 0;margin:-16px -16px 12px">
                <div style="font-weight:800;color:#fff;font-size:16px">Ramsons</div>
                <div style="font-size:10px;color:rgba(255,255,255,0.8)">CADA DIA MAIS VOCÊ</div>
              </div>
              <div id="preview-img-wrap" style="display:none;text-align:center;margin-bottom:10px">
                <img id="preview-img" style="max-width:100%;border-radius:4px;max-height:120px;object-fit:contain">
              </div>
              <div id="preview-msg" style="white-space:pre-line;line-height:1.6;color:#555;font-size:12px">
                Sua mensagem aparecerá aqui...
              </div>
            </div>
          </div>

          <!-- DESTINATÁRIOS -->
          <div id="camp-dest-info"
            style="background:var(--bg4);border-radius:8px;padding:12px 14px;margin-bottom:16px;font-size:13px;display:flex;align-items:center;gap:10px">
            <span style="font-size:18px">👥</span>
            <div id="camp-dest-texto" style="color:var(--text2)">Carregando clientes...</div>
          </div>

          <button class="btn primary" id="btn-enviar-campanha" onclick="enviarCampanha()"
            style="width:100%;justify-content:center;padding:12px">
            📤 Enviar Campanha
          </button>
        </div>
      </div>

      <!-- PAINEL DIREITO -->
      <div style="display:flex;flex-direction:column;gap:16px">

        <!-- WHATSAPP -->
        <div class="card">
          <div class="card-header">
            <span class="card-title">💬 WhatsApp</span>
          </div>
          <div style="padding:16px 20px">
            <p style="font-size:13px;color:var(--text2);margin-bottom:14px;line-height:1.6">
              Após enviar a campanha por email, use os links abaixo para enviar também pelo WhatsApp — um link por cliente.
            </p>
            <div id="wpp-links" style="display:none">
              <div style="font-family:var(--mono);font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:0.1em;margin-bottom:10px">
                Links gerados após o envio
              </div>
              <div id="wpp-lista" style="display:flex;flex-direction:column;gap:6px;max-height:300px;overflow-y:auto"></div>
            </div>
            <div id="wpp-placeholder" style="text-align:center;padding:20px;color:var(--text3);font-size:13px">
              Os links aparecem aqui após o envio da campanha.
            </div>
          </div>
        </div>

        <!-- HISTÓRICO -->
        <div class="card">
          <div class="card-header">
            <span class="card-title">📋 Últimas Campanhas</span>
          </div>
          <div id="camp-historico" style="padding:0">
            <div class="loading"><div class="spinner"></div></div>
          </div>
        </div>
      </div>
    </div>`;

  // Sincronizar preview em tempo real
  document.getElementById('camp-mensagem').addEventListener('input', atualizarPreview);
  document.getElementById('camp-assunto').addEventListener('input', atualizarPreview);

  // Carregar contagem de clientes e histórico
  carregarInfoClientes();
  carregarHistoricoCampanhas();
}

// ── PREVIEW ───────────────────────────────────────────────────

function atualizarPreview() {
  const msg = document.getElementById('camp-mensagem').value || 'Sua mensagem aparecerá aqui...';
  document.getElementById('preview-msg').textContent = msg;
}

// ── IMAGEM ────────────────────────────────────────────────────

let imagemBase64 = null;
let imagemFile   = null;

function handleImgSelect(input) {
  if (input.files && input.files[0]) processarImagem(input.files[0]);
}

function handleImgDrop(e) {
  e.preventDefault();
  document.getElementById('camp-img-area').style.borderColor = 'var(--border2)';
  const file = e.dataTransfer.files[0];
  if (file && file.type.startsWith('image/')) processarImagem(file);
}

function processarImagem(file) {
  if (file.size > 2 * 1024 * 1024) { toast('Imagem muito grande. Máximo 2MB.', 'error'); return; }
  imagemFile = file;
  const reader = new FileReader();
  reader.onload = e => {
    imagemBase64 = e.target.result;
    // Mostrar thumb no form
    document.getElementById('camp-img-thumb').src    = imagemBase64;
    document.getElementById('camp-img-preview').style.display  = '';
    document.getElementById('camp-img-placeholder').style.display = 'none';
    document.getElementById('camp-img-nome').textContent = file.name;
    document.getElementById('camp-img-nome').style.display = '';
    document.getElementById('camp-img-remover').style.display = '';
    // Mostrar no preview
    document.getElementById('preview-img').src = imagemBase64;
    document.getElementById('preview-img-wrap').style.display = '';
  };
  reader.readAsDataURL(file);
}

function removerImagem() {
  imagemBase64 = null; imagemFile = null;
  document.getElementById('camp-img-input').value            = '';
  document.getElementById('camp-img-thumb').src              = '';
  document.getElementById('camp-img-preview').style.display  = 'none';
  document.getElementById('camp-img-placeholder').style.display = '';
  document.getElementById('camp-img-nome').style.display     = 'none';
  document.getElementById('camp-img-remover').style.display  = 'none';
  document.getElementById('preview-img-wrap').style.display  = 'none';
}

// ── CLIENTES ─────────────────────────────────────────────────

async function carregarInfoClientes() {
  try {
    const clientes = await sb('clientes', {
      params: `vendedor_id=eq.${sessao.id}&status=eq.ativo&select=id,email,whatsapp`,
    });
    const comEmail = clientes.filter(c => c.email && c.email.trim()).length;
    const comWpp   = clientes.filter(c => c.whatsapp && c.whatsapp.trim()).length;
    document.getElementById('camp-dest-texto').innerHTML =
      `<span style="color:var(--text)"><strong>${clientes.length}</strong> clientes ativos</span>
       &nbsp;·&nbsp; <span style="color:var(--green)"><strong>${comEmail}</strong> com email</span>
       &nbsp;·&nbsp; <span style="color:#25D366"><strong>${comWpp}</strong> com WhatsApp</span>`;
  } catch(e) {
    document.getElementById('camp-dest-texto').textContent = 'Erro ao carregar clientes.';
  }
}

// ── ENVIAR ────────────────────────────────────────────────────

async function enviarCampanha() {
  const assunto  = document.getElementById('camp-assunto').value.trim();
  const mensagem = document.getElementById('camp-mensagem').value.trim();

  if (!assunto)  { toast('Informe o assunto do email.', 'error');  return; }
  if (!mensagem) { toast('Informe a mensagem da campanha.', 'error'); return; }

  confirmar(
    `Enviar campanha "${assunto}" para todos os seus clientes com email cadastrado?`,
    async () => {
      btnLoading('btn-enviar-campanha', '📤 Enviando...');
      try {
        // Upload da imagem para Supabase Storage (temporário)
        let imagem_url = null;
        if (imagemFile) {
          imagem_url = await uploadImagemTemporaria(imagemFile);
        }

        // Chamar Edge Function
        const res = await fetch(EDGE_URL, {
          method:  'POST',
          headers: {
            'Content-Type':  'application/json',
            'Authorization': `Bearer ${SUPA_KEY}`,
          },
          body: JSON.stringify({
            vendedor_id: sessao.id,
            assunto,
            mensagem,
            imagem_url,
          }),
        });

        const data = await res.json();

        if (data.erro) {
          toast('Erro: ' + data.erro, 'error');
          return;
        }

        // Sucesso — mostrar resultado
        toast(`✅ ${data.enviados} email(s) enviado(s)!`, 'success');

        // Gerar links WhatsApp
        if (data.whatsapps && data.whatsapps.length > 0) {
          gerarLinksWhatsApp(data.whatsapps, mensagem, imagem_url);
        }

        // Limpar formulário
        document.getElementById('camp-assunto').value  = '';
        document.getElementById('camp-mensagem').value = '';
        removerImagem();
        atualizarPreview();
        carregarHistoricoCampanhas();

        // Deletar imagem temporária após envio
        if (imagem_url) deletarImagemTemporaria(imagem_url);

      } catch(e) {
        toast('Erro de conexão: ' + e.message, 'error');
      } finally {
        btnReset('btn-enviar-campanha');
        document.getElementById('btn-enviar-campanha').textContent = '📤 Enviar Campanha';
      }
    }
  );
}

// ── UPLOAD IMAGEM TEMPORÁRIA ──────────────────────────────────

async function uploadImagemTemporaria(file) {
  try {
    const ext      = file.name.split('.').pop();
    const nomeArq  = `campanha_${Date.now()}.${ext}`;
    const formData = new FormData();
    formData.append('', file, nomeArq);

    const res = await fetch(
      `${SUPA_URL}/storage/v1/object/campanhas/${nomeArq}`,
      {
        method:  'POST',
        headers: { 'Authorization': `Bearer ${SUPA_KEY}`, 'x-upsert': 'true' },
        body:    file,
      }
    );

    if (res.ok) {
      return `${SUPA_URL}/storage/v1/object/public/campanhas/${nomeArq}`;
    }
    return null;
  } catch { return null; }
}

async function deletarImagemTemporaria(url) {
  try {
    const nomeArq = url.split('/').pop();
    await fetch(`${SUPA_URL}/storage/v1/object/campanhas/${nomeArq}`, {
      method:  'DELETE',
      headers: { 'Authorization': `Bearer ${SUPA_KEY}` },
    });
  } catch {}
}

// ── LINKS WHATSAPP ────────────────────────────────────────────

async function gerarLinksWhatsApp(numeros, mensagem, imagemUrl) {
  // Buscar nomes dos clientes para exibição
  const clientes = await sb('clientes', {
    params: `vendedor_id=eq.${sessao.id}&status=eq.ativo&select=nome,whatsapp`,
  }).catch(() => []);

  const mapaWpp = {};
  clientes.forEach(c => {
    const num = (c.whatsapp || '').replace(/\D/g, '');
    if (num) mapaWpp[num] = c.nome;
  });

  const msgEncoded = encodeURIComponent(mensagem + (imagemUrl ? `\n\n🖼️ ${imagemUrl}` : ''));

  document.getElementById('wpp-placeholder').style.display = 'none';
  document.getElementById('wpp-links').style.display       = '';

  document.getElementById('wpp-lista').innerHTML = numeros.map(num => {
    const nome = mapaWpp[num] || num;
    const link = `https://wa.me/55${num}?text=${msgEncoded}`;
    return `
      <a href="${link}" target="_blank" rel="noopener"
        style="display:flex;align-items:center;gap:10px;padding:10px 12px;
               background:#0a1a0f;border:1px solid #25D366;border-radius:8px;
               color:#25D366;text-decoration:none;font-size:13px;transition:background 0.15s"
        onmouseover="this.style.background='#122018'" onmouseout="this.style.background='#0a1a0f'">
        <span style="font-size:18px">💬</span>
        <div>
          <div style="font-weight:600">${nome}</div>
          <div style="font-family:var(--mono);font-size:10px;color:#1ea551">${num}</div>
        </div>
        <span style="margin-left:auto;font-size:11px;opacity:0.7">Abrir →</span>
      </a>`;
  }).join('');
}

// ── HISTÓRICO ─────────────────────────────────────────────────

async function carregarHistoricoCampanhas() {
  const el = document.getElementById('camp-historico');
  try {
    const logs = await sb('logs', {
      params: `acao=eq.CAMPANHA_ENVIADA&usuario=eq.${sessao.id}&order=created_at.desc&limit=5&select=detalhe,created_at`,
    });

    if (!logs.length) {
      el.innerHTML = '<div style="padding:20px;text-align:center;color:var(--text3);font-size:13px">Nenhuma campanha enviada ainda.</div>';
      return;
    }

    el.innerHTML = logs.map(l => `
      <div style="padding:12px 20px;border-bottom:1px solid var(--border)">
        <div style="font-size:12px;color:var(--text2);line-height:1.5">${l.detalhe}</div>
        <div style="font-family:var(--mono);font-size:10px;color:var(--text3);margin-top:4px">${fmtDataHora(l.created_at)}</div>
      </div>`).join('');
  } catch {
    el.innerHTML = '<div style="padding:20px;color:var(--text3);font-size:13px">Erro ao carregar histórico.</div>';
  }
}
