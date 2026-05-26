-- ============================================================
-- Ramsons CRM — Schema Supabase
-- Execute no SQL Editor do Supabase (Database → SQL Editor)
-- ============================================================

create extension if not exists "uuid-ossp";

-- VENDEDORES
create table if not exists vendedores (
  id           uuid primary key default uuid_generate_v4(),
  nome         text not null,
  usuario      text not null unique,
  senha_hash   text not null,
  cargo        text not null default 'vendedor',
  meta         numeric default 0,
  status       text not null default 'ativo',
  email        text,
  telefone     text,
  created_at   timestamptz default now(),
  ultimo_login timestamptz
);

-- CLIENTES
create table if not exists clientes (
  id           uuid primary key default uuid_generate_v4(),
  nome         text not null,
  cpf_cnpj     text,
  telefone     text,
  whatsapp     text,
  endereco     text,
  cidade       text default 'Manaus',
  observacoes  text,
  status       text not null default 'ativo',
  vendedor_id  uuid references vendedores(id) on delete set null,
  vendedor_key text,
  created_at   timestamptz default now()
);

-- PRODUTOS
create table if not exists produtos (
  id          uuid primary key default uuid_generate_v4(),
  codigo      text not null unique,
  nome        text not null,
  descricao   text,
  categoria   text,
  marca       text,
  preco       numeric not null default 0,
  unidade     text default 'un',
  status      text not null default 'ativo',
  created_at  timestamptz default now()
);

-- ORÇAMENTOS
create table if not exists orcamentos (
  id           uuid primary key default uuid_generate_v4(),
  codigo       text unique,
  cliente_id   uuid references clientes(id) on delete set null,
  cliente_nome text,
  vendedor_id  uuid references vendedores(id) on delete set null,
  vendedor_key text,
  subtotal     numeric default 0,
  desconto     numeric default 0,
  total        numeric default 0,
  status       text not null default 'pendente',
  observacoes  text,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- ITENS DE ORÇAMENTO
create table if not exists orcamento_itens (
  id             uuid primary key default uuid_generate_v4(),
  orcamento_id   uuid references orcamentos(id) on delete cascade,
  produto_id     uuid references produtos(id) on delete set null,
  codigo         text,
  nome           text not null,
  quantidade     numeric not null default 1,
  valor_unitario numeric not null default 0,
  desconto       numeric default 0,
  total          numeric not null default 0
);

-- VENDAS
create table if not exists vendas (
  id           uuid primary key default uuid_generate_v4(),
  codigo       text unique,
  orcamento_id uuid references orcamentos(id) on delete set null,
  cliente_id   uuid references clientes(id) on delete set null,
  cliente_nome text,
  vendedor_id  uuid references vendedores(id) on delete set null,
  vendedor_key text,
  subtotal     numeric default 0,
  desconto     numeric default 0,
  total        numeric not null default 0,
  status       text not null default 'concluida',
  observacoes  text,
  created_at   timestamptz default now()
);

-- ITENS DE VENDA
create table if not exists venda_itens (
  id             uuid primary key default uuid_generate_v4(),
  venda_id       uuid references vendas(id) on delete cascade,
  produto_id     uuid references produtos(id) on delete set null,
  codigo         text,
  nome           text not null,
  quantidade     numeric not null default 1,
  valor_unitario numeric not null default 0,
  desconto       numeric default 0,
  total          numeric not null default 0
);

-- LOGS
create table if not exists logs (
  id         uuid primary key default uuid_generate_v4(),
  usuario    text,
  acao       text,
  detalhe    text,
  created_at timestamptz default now()
);

-- ROW LEVEL SECURITY
alter table vendedores    enable row level security;
alter table clientes      enable row level security;
alter table produtos      enable row level security;
alter table orcamentos    enable row level security;
alter table orcamento_itens enable row level security;
alter table vendas        enable row level security;
alter table venda_itens   enable row level security;
alter table logs          enable row level security;

create policy "anon_vendedores"     on vendedores     for all using (true) with check (true);
create policy "anon_clientes"       on clientes       for all using (true) with check (true);
create policy "anon_produtos"       on produtos       for all using (true) with check (true);
create policy "anon_orcamentos"     on orcamentos     for all using (true) with check (true);
create policy "anon_orc_itens"      on orcamento_itens for all using (true) with check (true);
create policy "anon_vendas"         on vendas         for all using (true) with check (true);
create policy "anon_venda_itens"    on venda_itens    for all using (true) with check (true);
create policy "anon_logs"           on logs           for all using (true) with check (true);

-- ÍNDICES
create index if not exists idx_clientes_vendedor   on clientes(vendedor_id);
create index if not exists idx_orcamentos_vendedor on orcamentos(vendedor_id);
create index if not exists idx_vendas_vendedor     on vendas(vendedor_id);
create index if not exists idx_vendas_created      on vendas(created_at);
create index if not exists idx_produtos_codigo     on produtos(codigo);

-- ADMIN INICIAL (senha: admin123)
insert into vendedores (nome, usuario, senha_hash, cargo, status)
values (
  'Administrador',
  'admin',
  'aab2d417436863632143eda3cb450191f7f3189c85dada04f1e299f7b9ec387b',
  'admin',
  'ativo'
) on conflict (usuario) do nothing;
