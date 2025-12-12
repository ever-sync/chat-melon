-- Enable UUID extension if not enabled
create extension if not exists "uuid-ossp";

-- 1. Product Settings
create table if not exists public.product_settings (
    id uuid not null default gen_random_uuid(),
    company_id uuid not null references public.companies(id) on delete cascade,
    entity_name text not null default 'Produto',
    entity_name_plural text not null default 'Produtos',
    entity_icon text not null default 'Package',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    primary key (id),
    constraint product_settings_company_id_key unique (company_id)
);

alter table public.product_settings enable row level security;

drop policy if exists "Users can view their company's product settings" on public.product_settings;
create policy "Users can view their company's product settings"
    on public.product_settings for select
    using (company_id = (select company_id from public.profiles where id = auth.uid()));

drop policy if exists "Users can insert their company's product settings" on public.product_settings;
create policy "Users can insert their company's product settings"
    on public.product_settings for insert
    with check (company_id = (select company_id from public.profiles where id = auth.uid()));

drop policy if exists "Users can update their company's product settings" on public.product_settings;
create policy "Users can update their company's product settings"
    on public.product_settings for update
    using (company_id = (select company_id from public.profiles where id = auth.uid()));

-- 2. Product Categories
create table if not exists public.product_categories (
    id uuid not null default gen_random_uuid(),
    company_id uuid not null references public.companies(id) on delete cascade,
    name text not null,
    description text,
    color text default '#6366F1',
    sort_order integer default 0,
    is_active boolean default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    primary key (id)
);

alter table public.product_categories enable row level security;

drop policy if exists "Users can view their company's product categories" on public.product_categories;
create policy "Users can view their company's product categories"
    on public.product_categories for select
    using (company_id = (select company_id from public.profiles where id = auth.uid()));

drop policy if exists "Users can insert their company's product categories" on public.product_categories;
create policy "Users can insert their company's product categories"
    on public.product_categories for insert
    with check (company_id = (select company_id from public.profiles where id = auth.uid()));

drop policy if exists "Users can update their company's product categories" on public.product_categories;
create policy "Users can update their company's product categories"
    on public.product_categories for update
    using (company_id = (select company_id from public.profiles where id = auth.uid()));

drop policy if exists "Users can delete their company's product categories" on public.product_categories;
create policy "Users can delete their company's product categories"
    on public.product_categories for delete
    using (company_id = (select company_id from public.profiles where id = auth.uid()));

-- Add category_id to products if not exists
do $$ 
begin 
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'products' and column_name = 'category_id') then
        alter table public.products add column category_id uuid references public.product_categories(id) on delete set null;
    end if;
end $$;

-- 3. Product Custom Fields
create table if not exists public.product_custom_fields (
    id uuid not null default gen_random_uuid(),
    company_id uuid not null references public.companies(id) on delete cascade,
    name text not null,
    label text not null,
    field_type text not null,
    options text[], 
    is_required boolean default false,
    default_value text,
    sort_order integer default 0,
    is_active boolean default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    primary key (id)
);

alter table public.product_custom_fields enable row level security;

drop policy if exists "Users can view their company's product custom fields" on public.product_custom_fields;
create policy "Users can view their company's product custom fields"
    on public.product_custom_fields for select
    using (company_id = (select company_id from public.profiles where id = auth.uid()));

drop policy if exists "Users can insert their company's product custom fields" on public.product_custom_fields;
create policy "Users can insert their company's product custom fields"
    on public.product_custom_fields for insert
    with check (company_id = (select company_id from public.profiles where id = auth.uid()));

drop policy if exists "Users can update their company's product custom fields" on public.product_custom_fields;
create policy "Users can update their company's product custom fields"
    on public.product_custom_fields for update
    using (company_id = (select company_id from public.profiles where id = auth.uid()));

drop policy if exists "Users can delete their company's product custom fields" on public.product_custom_fields;
create policy "Users can delete their company's product custom fields"
    on public.product_custom_fields for delete
    using (company_id = (select company_id from public.profiles where id = auth.uid()));

-- Add custom_field_values JSONB to products if not exists
do $$ 
begin 
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'products' and column_name = 'custom_field_values') then
        alter table public.products add column custom_field_values jsonb default '{}'::jsonb;
    end if;
end $$;

-- Grant permissions
grant all on public.product_settings to authenticated;
grant all on public.product_categories to authenticated;
grant all on public.product_custom_fields to authenticated;
