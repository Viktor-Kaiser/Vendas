// ============================================================
// auth.js — Autenticação e Sessão
// ============================================================

let sessao = null;

async function fazerLogin() {
  const usuario = document.getElementById('l-usuario').value.trim();
  const senha   = document.getElementById('l-senha').value;
  const err     = document.getElementById('login-err');

  err.style.display = 'none';
  if (!usuario || !senha) { mostrarErroLogin('Preencha usuário e senha.'); return; }

  btnLoading('btn-login', 'Entrando...');

  try {
    const rows = await sb('vendedores', {
      params: `usuario=eq.${encodeURIComponent(usuario)}&select=id,nome,usuario,cargo,meta,status,senha_hash`,
    });

    if (!rows || !rows.length) { mostrarErroLogin('Usuário não encontrado.'); return; }

    const vend = rows[0];
    if (vend.status !== STATUS.ATIVO) { mostrarErroLogin('Conta inativa ou bloqueada.'); return; }

    const hash = await hashSenha(senha);
    if (vend.senha_hash !== hash) { mostrarErroLogin('Senha incorreta.'); return; }

    sessao = {
      id:       vend.id,
      nome:     vend.nome,
      usuario:  vend.usuario,
      cargo:    vend.cargo,
      meta:     vend.meta || 0,
    };

    localStorage.setItem('ramsons_sessao', JSON.stringify(sessao));

    // Atualizar último login em background
    sb(`vendedores?id=eq.${vend.id}`, {
      metodo: 'PATCH',
      body:   { ultimo_login: new Date().toISOString() },
    }).catch(() => {});

    iniciarApp();
  } catch (e) {
    mostrarErroLogin('Erro de conexão. Tente novamente.');
    console.error(e);
  } finally {
    btnReset('btn-login');
  }
}

function mostrarErroLogin(msg) {
  const err = document.getElementById('login-err');
  err.textContent    = msg;
  err.style.display  = 'block';
  btnReset('btn-login');
}

function fazerLogout() {
  sessao = null;
  localStorage.removeItem('ramsons_sessao');
  document.getElementById('app').style.display          = 'none';
  document.getElementById('login-screen').style.display = 'flex';
  document.getElementById('l-senha').value              = '';
}

function ehAdmin() {
  return sessao && [CARGOS.ADMIN, CARGOS.COADMIN].includes(sessao.cargo);
}

function iniciarApp() {
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('app').style.display          = 'flex';

  document.getElementById('user-nome').textContent  = sessao.nome;
  document.getElementById('user-cargo').textContent = sessao.cargo.toUpperCase();
  document.getElementById('user-avatar').textContent = sessao.nome.charAt(0).toUpperCase();

  // Mostrar menu admin
  document.querySelectorAll('.admin-only').forEach(el => {
    el.style.display = ehAdmin() ? '' : 'none';
  });

  ir('dashboard');
}

// Restaurar sessão ao carregar
document.addEventListener('DOMContentLoaded', () => {
  const salvo = localStorage.getItem('ramsons_sessao');
  if (salvo) {
    try { sessao = JSON.parse(salvo); iniciarApp(); } catch (e) {}
  }

  document.getElementById('l-usuario').addEventListener('keydown', e => {
    if (e.key === 'Enter') document.getElementById('l-senha').focus();
  });
  document.getElementById('l-senha').addEventListener('keydown', e => {
    if (e.key === 'Enter') fazerLogin();
  });
});
