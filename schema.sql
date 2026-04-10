-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Table: materia_prima
create table materia_prima (
  id uuid default uuid_generate_v4() primary key,
  nombre text not null,
  unidad_medida text not null,
  stock numeric default 0 check (stock >= 0),
  min_stock numeric default 0,
  max_stock numeric default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Table: movimientos
create table movimientos (
  id uuid default uuid_generate_v4() primary key,
  bundle_id text not null,
  materia_prima_id uuid references materia_prima(id) on delete cascade,
  tipo text not null check (tipo in ('entrada', 'salida')),
  cantidad numeric not null check (cantidad > 0),
  unidad_medida text not null,
  fecha timestamptz default now(),
  imagen_url text,
  created_at timestamptz default now()
);

-- Enable RLS
alter table materia_prima enable row level security;
alter table movimientos enable row level security;

-- Policies for materia_prima
create policy "Authenticated users can read materia_prima" on materia_prima for select using (auth.role() = 'authenticated');
create policy "Authenticated users can insert materia_prima" on materia_prima for insert with check (auth.role() = 'authenticated');
create policy "Authenticated users can update materia_prima" on materia_prima for update using (auth.role() = 'authenticated');
create policy "Authenticated users can delete materia_prima" on materia_prima for delete using (auth.role() = 'authenticated');

-- Policies for movimientos
create policy "Authenticated users can read movimientos" on movimientos for select using (auth.role() = 'authenticated');
create policy "Authenticated users can insert movimientos" on movimientos for insert with check (auth.role() = 'authenticated');
