-- =====================================================
-- Corrigir funções de notas para buscar company_id corretamente
-- Usar company_members ao invés de profiles.company_id
-- =====================================================

-- Função para criar nota de contato (CORRIGIDA)
CREATE OR REPLACE FUNCTION create_contact_note(
  p_contact_id UUID,
  p_note TEXT
)
RETURNS TABLE (
  id UUID,
  contact_id UUID,
  user_id UUID,
  company_id UUID,
  note TEXT,
  is_pinned BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_company_id UUID;
BEGIN
  -- Obter o usuário autenticado
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;

  -- Obter company_id do contato (mais direto)
  SELECT contacts.company_id INTO v_company_id
  FROM contacts
  WHERE contacts.id = p_contact_id;

  IF v_company_id IS NULL THEN
    RAISE EXCEPTION 'Contato não encontrado';
  END IF;

  -- Verificar se o usuário pertence à mesma empresa do contato
  IF NOT EXISTS (
    SELECT 1 FROM company_members
    WHERE company_members.user_id = v_user_id
    AND company_members.company_id = v_company_id
    AND company_members.is_active = true
  ) THEN
    RAISE EXCEPTION 'Você não tem permissão para adicionar notas a este contato';
  END IF;

  -- Inserir a nota
  RETURN QUERY
  INSERT INTO contact_notes (contact_id, user_id, company_id, note)
  VALUES (p_contact_id, v_user_id, v_company_id, p_note)
  RETURNING
    contact_notes.id,
    contact_notes.contact_id,
    contact_notes.user_id,
    contact_notes.company_id,
    contact_notes.note,
    contact_notes.is_pinned,
    contact_notes.created_at,
    contact_notes.updated_at;
END;
$$;

-- Função para criar nota de negócio (CORRIGIDA)
CREATE OR REPLACE FUNCTION create_deal_note(
  p_deal_id UUID,
  p_note TEXT
)
RETURNS TABLE (
  id UUID,
  deal_id UUID,
  user_id UUID,
  company_id UUID,
  note TEXT,
  is_pinned BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_company_id UUID;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;

  -- Obter company_id do deal (mais direto)
  SELECT deals.company_id INTO v_company_id
  FROM deals
  WHERE deals.id = p_deal_id;

  IF v_company_id IS NULL THEN
    RAISE EXCEPTION 'Negócio não encontrado';
  END IF;

  -- Verificar se o usuário pertence à mesma empresa do deal
  IF NOT EXISTS (
    SELECT 1 FROM company_members
    WHERE company_members.user_id = v_user_id
    AND company_members.company_id = v_company_id
    AND company_members.is_active = true
  ) THEN
    RAISE EXCEPTION 'Você não tem permissão para adicionar notas a este negócio';
  END IF;

  -- Inserir a nota
  RETURN QUERY
  INSERT INTO deal_notes (deal_id, user_id, company_id, note)
  VALUES (p_deal_id, v_user_id, v_company_id, p_note)
  RETURNING
    deal_notes.id,
    deal_notes.deal_id,
    deal_notes.user_id,
    deal_notes.company_id,
    deal_notes.note,
    deal_notes.is_pinned,
    deal_notes.created_at,
    deal_notes.updated_at;
END;
$$;

-- Mensagem de sucesso
DO $$
BEGIN
  RAISE NOTICE '✅ Funções de notas corrigidas!';
  RAISE NOTICE 'Agora usam company_members para verificar permissões';
  RAISE NOTICE 'E buscam company_id direto do contato/deal';
END $$;
