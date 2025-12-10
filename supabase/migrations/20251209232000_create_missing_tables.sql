-- Enable UUID extension if not enabled
create extension if not exists "uuid-ossp";

-- 1. Contact Settings
create table if not exists public.contact_settings (
    id uuid not null default gen_random_uuid(),
    company_id uuid not null references public.companies(id) on delete cascade,
    entity_name text not null default 'Contato',
    entity_name_plural text not null default 'Contatos',
    entity_icon text not null default 'User',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    primary key (id),
    constraint contact_settings_company_id_key unique (company_id)
);

alter table public.contact_settings enable row level security;

create policy "Users can view/edit their company contact settings"
    on public.contact_settings for all
    using (company_id in (select company_id from public.profiles where id = auth.uid()))
    with check (company_id in (select company_id from public.profiles where id = auth.uid()));

-- 2. Contact Categories
create table if not exists public.contact_categories (
    id uuid not null default gen_random_uuid(),
    company_id uuid not null references public.companies(id) on delete cascade,
    name text not null,
    color text not null default '#6366F1',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    primary key (id)
);

alter table public.contact_categories enable row level security;

create policy "Users can manage their company contact categories"
    on public.contact_categories for all
    using (company_id in (select company_id from public.profiles where id = auth.uid()))
    with check (company_id in (select company_id from public.profiles where id = auth.uid()));

-- Add category_id to contacts if not exists
do $$ 
begin 
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'contacts' and column_name = 'category_id') then
        alter table public.contacts add column category_id uuid references public.contact_categories(id) on delete set null;
    end if;
end $$;

-- 3. Product Settings
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

create policy "Users can manage their company product settings"
    on public.product_settings for all
    using (company_id in (select company_id from public.profiles where id = auth.uid()))
    with check (company_id in (select company_id from public.profiles where id = auth.uid()));

-- 4. Product Categories
create table if not exists public.product_categories (
    id uuid not null default gen_random_uuid(),
    company_id uuid not null references public.companies(id) on delete cascade,
    name text not null,
    description text,
    color text default '#6366F1',
    sort_order integer default 0,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    primary key (id)
);

alter table public.product_categories enable row level security;

create policy "Users can manage their company product categories"
    on public.product_categories for all
    using (company_id in (select company_id from public.profiles where id = auth.uid()))
    with check (company_id in (select company_id from public.profiles where id = auth.uid()));

-- Add category_id to products if not exists
do $$ 
begin 
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'products' and column_name = 'category_id') then
        alter table public.products add column category_id uuid references public.product_categories(id) on delete set null;
    end if;
end $$;

-- 5. Custom Fields (Contacts, Deals, etc)
create table if not exists public.custom_fields (
    id uuid not null default gen_random_uuid(),
    company_id uuid not null references public.companies(id) on delete cascade,
    entity_type text not null check (entity_type in ('contact', 'company', 'deal')),
    field_name text not null,
    field_label text not null,
    field_type text not null,
    options text[], 
    is_required boolean default false,
    default_value text,
    display_order integer default 0,
    is_active boolean default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    primary key (id)
);

alter table public.custom_fields enable row level security;

create policy "Users can manage their company custom fields"
    on public.custom_fields for all
    using (company_id in (select company_id from public.profiles where id = auth.uid()))
    with check (company_id in (select company_id from public.profiles where id = auth.uid()));

-- 6. Custom Field Values
create table if not exists public.custom_field_values (
    id uuid not null default gen_random_uuid(),
    custom_field_id uuid not null references public.custom_fields(id) on delete cascade,
    entity_id uuid not null, 
    value text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    primary key (id),
    unique(custom_field_id, entity_id)
);

alter table public.custom_field_values enable row level security;

-- Policies for custom_field_values need to query custom_fields to check company permission
create policy "Users can manage their company custom field values"
    on public.custom_field_values for all
    using (
        exists (
            select 1 from public.custom_fields cf
            join public.profiles p on p.company_id = cf.company_id
            where cf.id = custom_field_values.custom_field_id
            and p.id = auth.uid()
        )
    )
    with check (
        exists (
            select 1 from public.custom_fields cf
            join public.profiles p on p.company_id = cf.company_id
            where cf.id = custom_field_values.custom_field_id
            and p.id = auth.uid()
        )
    );

-- 7. Product Custom Fields
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

create policy "Users can manage their company product custom fields"
    on public.product_custom_fields for all
    using (company_id in (select company_id from public.profiles where id = auth.uid()))
    with check (company_id in (select company_id from public.profiles where id = auth.uid()));

-- Add custom_field_values JSONB to products if not exists
do $$ 
begin 
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'products' and column_name = 'custom_field_values') then
        alter table public.products add column custom_field_values jsonb default '{}'::jsonb;
    end if;
end $$;

-- Grant permissions (if needed for authenticated role, though policies usu. handle it)
grant all on public.contact_settings to authenticated;
grant all on public.contact_categories to authenticated;
grant all on public.product_settings to authenticated;
grant all on public.product_categories to authenticated;
grant all on public.custom_fields to authenticated;
grant all on public.custom_field_values to authenticated;
grant all on public.product_custom_fields to authenticated;
