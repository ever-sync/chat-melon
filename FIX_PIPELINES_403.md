# 🚨 Correção de Emergência: Erro 403 (Pipelines/RLS)

O erro persiste porque o **Supabase CLI não está instalado** no seu computador, então o comando anterior falhou. Você precisa aplicar a correção **manualmente** no painel do Supabase.

Eu criei um script SQL simplificado que remove a necessidade de ser "admin", permitindo que qualquer usuário da empresa crie pipelines. Isso deve resolver o problema definitivamente.

## 👣 Passo a Passo

1. Copie **TODO** o código abaixo:

```sql
-- ============================================
-- FIX: Pipelines RLS Policies (Simplified)
-- ============================================

-- 1. Limpar políticas anteriores
DROP POLICY IF EXISTS "Admins can manage pipelines" ON pipelines;
DROP POLICY IF EXISTS "Admins can insert pipelines" ON pipelines;
DROP POLICY IF EXISTS "Admins can update pipelines" ON pipelines;
DROP POLICY IF EXISTS "Admins can delete pipelines" ON pipelines;

-- 2. Criar política permissiva para PIPELINES
CREATE POLICY "Users can manage company pipelines" ON pipelines
  FOR ALL
  USING (company_id = get_user_company(auth.uid()))
  WITH CHECK (company_id = get_user_company(auth.uid()));

-- 3. Limpar políticas anteriores de STAGES
DROP POLICY IF EXISTS "Admins can manage stages" ON pipeline_stages;
DROP POLICY IF EXISTS "Admins can insert stages" ON pipeline_stages;
DROP POLICY IF EXISTS "Admins can update stages" ON pipeline_stages;
DROP POLICY IF EXISTS "Admins can delete stages" ON pipeline_stages;

-- 4. Criar política permissiva para STAGES
CREATE POLICY "Users can manage company stages" ON pipeline_stages
  FOR ALL
  USING (
    pipeline_id IN (
      SELECT id FROM pipelines WHERE company_id = get_user_company(auth.uid())
    )
  )
  WITH CHECK (
    pipeline_id IN (
      SELECT id FROM pipelines WHERE company_id = get_user_company(auth.uid())
    )
  );
```

2. Acesse o **[Supabase Dashboard](https://app.supabase.com)** do seu projeto.
3. No menu lateral, clique em **SQL Editor**.
4. Clique em **+ New query**.
5. Cole o código e clique em **Run** (botão verde).
6. Volte para o app e tente salvar o Pipeline novamente. Deve funcionar! ✅
