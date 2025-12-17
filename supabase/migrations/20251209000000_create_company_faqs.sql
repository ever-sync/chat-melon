CREATE TABLE IF NOT EXISTS public.company_faqs (
  id uuid default gen_random_uuid() primary key,
  company_id uuid references public.companies(id) not null,
  question text not null,
  answer text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS Policies
alter table public.company_faqs enable row level security;

DROP POLICY IF EXISTS "Users can view their company faqs" ON public.company_faqs;
create policy "Users can view their company faqs"
  on public.company_faqs for select
  using (company_id = (select company_id from public.profiles where id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert their company faqs" ON public.company_faqs;
create policy "Users can insert their company faqs"
  on public.company_faqs for insert
  with check (company_id = (select company_id from public.profiles where id = auth.uid()));

DROP POLICY IF EXISTS "Users can update their company faqs" ON public.company_faqs;
create policy "Users can update their company faqs"
  on public.company_faqs for update
  using (company_id = (select company_id from public.profiles where id = auth.uid()));

DROP POLICY IF EXISTS "Users can delete their company faqs" ON public.company_faqs;
create policy "Users can delete their company faqs"
  on public.company_faqs for delete
  using (company_id = (select company_id from public.profiles where id = auth.uid()));
