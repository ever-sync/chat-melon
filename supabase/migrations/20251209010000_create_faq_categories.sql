create table if not exists public.faq_categories (
  id uuid default gen_random_uuid() primary key,
  company_id uuid references public.companies(id) not null,
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add category_id to company_faqs if it doesn't exist
do $$
begin
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'company_faqs' and column_name = 'category_id') then
        alter table public.company_faqs 
        add column category_id uuid references public.faq_categories(id);
    end if;
end $$;

-- RLS Policies for faq_categories
alter table public.faq_categories enable row level security;

do $$
begin
    if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'faq_categories' and policyname = 'Users can view their company faq categories') then
        create policy "Users can view their company faq categories"
          on public.faq_categories for select
          using (company_id = (select company_id from public.profiles where id = auth.uid()));
    end if;

    if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'faq_categories' and policyname = 'Users can insert their company faq categories') then
        create policy "Users can insert their company faq categories"
          on public.faq_categories for insert
          with check (company_id = (select company_id from public.profiles where id = auth.uid()));
    end if;

    if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'faq_categories' and policyname = 'Users can update their company faq categories') then
        create policy "Users can update their company faq categories"
          on public.faq_categories for update
          using (company_id = (select company_id from public.profiles where id = auth.uid()));
    end if;
    
    if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'faq_categories' and policyname = 'Users can delete their company faq categories') then
        create policy "Users can delete their company faq categories"
          on public.faq_categories for delete
          using (company_id = (select company_id from public.profiles where id = auth.uid()));
    end if;
end $$;
