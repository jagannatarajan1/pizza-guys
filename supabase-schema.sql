-- ============================================================
-- Pizza Guys — Supabase Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- profiles: extends Supabase's built-in auth.users
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  name        text        not null default '',
  phone       text        not null default '',
  created_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-create a profile row when a new user signs up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── addresses ───────────────────────────────────────────────
create table if not exists public.addresses (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references auth.users(id) on delete cascade,
  label       text        not null default 'Home',
  line1       text        not null default '',
  line2       text        not null default '',
  city        text        not null default '',
  postcode    text        not null default '',
  notes       text        not null default '',
  is_default  boolean     not null default false,
  created_at  timestamptz not null default now()
);

alter table public.addresses enable row level security;

create policy "Users can manage own addresses"
  on public.addresses for all
  using (auth.uid() = user_id);

-- ── orders ──────────────────────────────────────────────────
create table if not exists public.orders (
  id                 uuid        primary key default gen_random_uuid(),
  order_number       text        not null unique,
  user_id            uuid        references auth.users(id) on delete set null,
  status             text        not null default 'pending'
                                 check (status in ('pending','confirmed','preparing','out_for_delivery','ready_for_collection','delivered','cancelled','payment_failed')),
  order_type         text        not null check (order_type in ('delivery','collection')),
  customer_name      text        not null,
  customer_email     text        not null,
  customer_phone     text        not null,
  delivery_address   jsonb,
  subtotal           integer     not null,  -- pence
  delivery_fee       integer     not null default 0,
  discount           integer     not null default 0,
  total              integer     not null,
  payment_intent_id  text,
  payment_method     text        not null default 'card',
  scheduled_time     timestamptz,
  created_at         timestamptz not null default now()
);

alter table public.orders enable row level security;

create policy "Users can read own orders"
  on public.orders for select
  using (auth.uid() = user_id);

-- Service role (used by API routes with SUPABASE_SERVICE_ROLE_KEY) can insert/update
create policy "Service role can manage orders"
  on public.orders for all
  using (true)
  with check (true);

-- ── order_items ─────────────────────────────────────────────
create table if not exists public.order_items (
  id                   uuid    primary key default gen_random_uuid(),
  order_id             uuid    not null references public.orders(id) on delete cascade,
  product_id           text    not null,
  product_name         text    not null,
  quantity             integer not null check (quantity > 0),
  unit_price           integer not null,  -- pence
  modifiers            jsonb   not null default '[]',
  special_instructions text    not null default '',
  item_total           integer not null
);

alter table public.order_items enable row level security;

create policy "Users can read own order items"
  on public.order_items for select
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_id and o.user_id = auth.uid()
    )
  );

create policy "Service role can manage order items"
  on public.order_items for all
  using (true)
  with check (true);
