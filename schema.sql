-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create a table for public profiles
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  role text not null check (role in ('admin', 'user')) default 'user',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

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
alter table profiles enable row level security;
alter table materia_prima enable row level security;
alter table movimientos enable row level security;

-- Function to handle new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'user');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to create profile on signup
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Policies for profiles
create policy "Users can view their own profile" on profiles for select using (auth.uid() = id);
-- Function to check if user is admin (avoids recursion)
create or replace function public.is_admin()
returns boolean as $$
begin
  return exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
end;
$$ language plpgsql security definer;

-- Drop old policies
drop policy if exists "Admins can view all profiles" on profiles;
drop policy if exists "Admins can manage materia_prima" on materia_prima;

-- Policies for profiles
create policy "Admins can view all profiles" on profiles for select using (public.is_admin());

-- Policies for materia_prima
create policy "Admins can manage materia_prima" on materia_prima for all using (public.is_admin());

-- Policies for movimientos
create policy "Authenticated users can read movimientos" on movimientos for select using (auth.role() = 'authenticated');
create policy "Authenticated users can insert movimientos" on movimientos for insert with check (auth.role() = 'authenticated');
