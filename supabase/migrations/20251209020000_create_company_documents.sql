-- Create document_categories table
create table if not exists public.document_categories (
  id uuid default gen_random_uuid() primary key,
  company_id uuid references public.companies(id) not null,
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create company_documents table
create table if not exists public.company_documents (
  id uuid default gen_random_uuid() primary key,
  company_id uuid references public.companies(id) not null,
  category_id uuid references public.document_categories(id),
  title text not null,
  description text,
  file_url text not null,
  file_type text not null, -- 'PDF', 'DOC', 'LINK', etc.
  file_size text, -- Optional string for display like '2.4 MB'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS Policies for document_categories
alter table public.document_categories enable row level security;

do $$
begin
    if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'document_categories' and policyname = 'Users can view their company document categories') then
        create policy "Users can view their company document categories"
          on public.document_categories for select
          using (company_id = (select company_id from public.profiles where id = auth.uid()));
    end if;

    if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'document_categories' and policyname = 'Users can insert their company document categories') then
        create policy "Users can insert their company document categories"
          on public.document_categories for insert
          with check (company_id = (select company_id from public.profiles where id = auth.uid()));
    end if;

    if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'document_categories' and policyname = 'Users can update their company document categories') then
        create policy "Users can update their company document categories"
          on public.document_categories for update
          using (company_id = (select company_id from public.profiles where id = auth.uid()));
    end if;
    
    if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'document_categories' and policyname = 'Users can delete their company document categories') then
        create policy "Users can delete their company document categories"
          on public.document_categories for delete
          using (company_id = (select company_id from public.profiles where id = auth.uid()));
    end if;
end $$;


-- RLS Policies for company_documents
alter table public.company_documents enable row level security;

do $$
begin
    if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'company_documents' and policyname = 'Users can view their company documents') then
        create policy "Users can view their company documents"
          on public.company_documents for select
          using (company_id = (select company_id from public.profiles where id = auth.uid()));
    end if;

    if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'company_documents' and policyname = 'Users can insert their company documents') then
        create policy "Users can insert their company documents"
          on public.company_documents for insert
          with check (company_id = (select company_id from public.profiles where id = auth.uid()));
    end if;

    if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'company_documents' and policyname = 'Users can update their company documents') then
        create policy "Users can update their company documents"
          on public.company_documents for update
          using (company_id = (select company_id from public.profiles where id = auth.uid()));
    end if;
    
    if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'company_documents' and policyname = 'Users can delete their company documents') then
        create policy "Users can delete their company documents"
          on public.company_documents for delete
          using (company_id = (select company_id from public.profiles where id = auth.uid()));
    end if;
end $$;
