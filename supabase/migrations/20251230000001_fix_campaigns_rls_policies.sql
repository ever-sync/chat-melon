-- ============================================
-- FIX CAMPAIGNS RLS POLICIES
-- ============================================
-- Atualiza as políticas RLS da tabela campaigns para usar company_members
-- em vez de get_user_company que pode não funcionar corretamente

-- Habilitar RLS na tabela campaigns (se ainda não estiver)
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas
DROP POLICY IF EXISTS "Users can view campaigns in their company" ON public.campaigns;
DROP POLICY IF EXISTS "Users can create campaigns in their company" ON public.campaigns;
DROP POLICY IF EXISTS "Users can update campaigns in their company" ON public.campaigns;
DROP POLICY IF EXISTS "Admins can delete campaigns" ON public.campaigns;

-- Criar nova política de SELECT
CREATE POLICY "Users can view their company campaigns"
ON public.campaigns
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM company_members
    WHERE user_id = auth.uid()
      AND company_id = campaigns.company_id
      AND is_active = true
  )
);

-- Criar nova política de INSERT
CREATE POLICY "Users can create campaigns in their company"
ON public.campaigns
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM company_members
    WHERE user_id = auth.uid()
      AND company_id = campaigns.company_id
      AND is_active = true
  )
);

-- Criar nova política de UPDATE
CREATE POLICY "Users can update their company campaigns"
ON public.campaigns
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM company_members
    WHERE user_id = auth.uid()
      AND company_id = campaigns.company_id
      AND is_active = true
  )
);

-- Criar nova política de DELETE (permitir para todos os membros ativos, não só admins)
CREATE POLICY "Users can delete their company campaigns"
ON public.campaigns
FOR DELETE
USING (
  EXISTS (
    SELECT 1
    FROM company_members
    WHERE user_id = auth.uid()
      AND company_id = campaigns.company_id
      AND is_active = true
  )
);

-- ============================================
-- FIX CAMPAIGN_CONTACTS RLS POLICIES
-- ============================================

-- Habilitar RLS
ALTER TABLE public.campaign_contacts ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas
DROP POLICY IF EXISTS "Users can view campaign contacts in their company" ON public.campaign_contacts;
DROP POLICY IF EXISTS "Users can create campaign contacts" ON public.campaign_contacts;
DROP POLICY IF EXISTS "Users can update campaign contacts" ON public.campaign_contacts;

-- Criar nova política de SELECT
CREATE POLICY "Users can view their company campaign contacts"
ON public.campaign_contacts
FOR SELECT
USING (
  campaign_id IN (
    SELECT c.id FROM campaigns c
    WHERE EXISTS (
      SELECT 1 FROM company_members cm
      WHERE cm.user_id = auth.uid()
        AND cm.company_id = c.company_id
        AND cm.is_active = true
    )
  )
);

-- Criar nova política de INSERT
CREATE POLICY "Users can create campaign contacts"
ON public.campaign_contacts
FOR INSERT
WITH CHECK (
  campaign_id IN (
    SELECT c.id FROM campaigns c
    WHERE EXISTS (
      SELECT 1 FROM company_members cm
      WHERE cm.user_id = auth.uid()
        AND cm.company_id = c.company_id
        AND cm.is_active = true
    )
  )
);

-- Criar nova política de UPDATE
CREATE POLICY "Users can update campaign contacts"
ON public.campaign_contacts
FOR UPDATE
USING (
  campaign_id IN (
    SELECT c.id FROM campaigns c
    WHERE EXISTS (
      SELECT 1 FROM company_members cm
      WHERE cm.user_id = auth.uid()
        AND cm.company_id = c.company_id
        AND cm.is_active = true
    )
  )
);

-- Criar nova política de DELETE
CREATE POLICY "Users can delete campaign contacts"
ON public.campaign_contacts
FOR DELETE
USING (
  campaign_id IN (
    SELECT c.id FROM campaigns c
    WHERE EXISTS (
      SELECT 1 FROM company_members cm
      WHERE cm.user_id = auth.uid()
        AND cm.company_id = c.company_id
        AND cm.is_active = true
    )
  )
);
