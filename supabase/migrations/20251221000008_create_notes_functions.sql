-- =====================================================
-- Funções do servidor para gerenciar notas
-- Estas funções têm SECURITY DEFINER para contornar RLS
-- =====================================================

-- =====================================================
-- CONTACT NOTES FUNCTIONS
-- =====================================================

-- Função para criar nota de contato
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

  -- Obter company_id do usuário
  SELECT profiles.company_id INTO v_company_id
  FROM profiles
  WHERE profiles.id = v_user_id;

  IF v_company_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não tem empresa associada';
  END IF;

  -- Verificar se o contato pertence à mesma empresa
  IF NOT EXISTS (
    SELECT 1 FROM contacts
    WHERE contacts.id = p_contact_id
    AND contacts.company_id = v_company_id
  ) THEN
    RAISE EXCEPTION 'Contato não encontrado ou não pertence à sua empresa';
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

-- Função para atualizar nota de contato
CREATE OR REPLACE FUNCTION update_contact_note(
  p_note_id UUID,
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
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;

  -- Verificar se a nota pertence ao usuário
  IF NOT EXISTS (
    SELECT 1 FROM contact_notes
    WHERE contact_notes.id = p_note_id
    AND contact_notes.user_id = v_user_id
  ) THEN
    RAISE EXCEPTION 'Nota não encontrada ou você não tem permissão para editá-la';
  END IF;

  -- Atualizar a nota
  RETURN QUERY
  UPDATE contact_notes
  SET note = p_note, updated_at = NOW()
  WHERE contact_notes.id = p_note_id
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

-- Função para deletar nota de contato
CREATE OR REPLACE FUNCTION delete_contact_note(p_note_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;

  -- Verificar se a nota pertence ao usuário
  IF NOT EXISTS (
    SELECT 1 FROM contact_notes
    WHERE contact_notes.id = p_note_id
    AND contact_notes.user_id = v_user_id
  ) THEN
    RAISE EXCEPTION 'Nota não encontrada ou você não tem permissão para deletá-la';
  END IF;

  -- Deletar a nota
  DELETE FROM contact_notes WHERE id = p_note_id;

  RETURN TRUE;
END;
$$;

-- =====================================================
-- DEAL NOTES FUNCTIONS
-- =====================================================

-- Função para criar nota de negócio
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

  -- Obter company_id do usuário
  SELECT profiles.company_id INTO v_company_id
  FROM profiles
  WHERE profiles.id = v_user_id;

  IF v_company_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não tem empresa associada';
  END IF;

  -- Verificar se o deal pertence à mesma empresa
  IF NOT EXISTS (
    SELECT 1 FROM deals
    WHERE deals.id = p_deal_id
    AND deals.company_id = v_company_id
  ) THEN
    RAISE EXCEPTION 'Negócio não encontrado ou não pertence à sua empresa';
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

-- Função para atualizar nota de negócio
CREATE OR REPLACE FUNCTION update_deal_note(
  p_note_id UUID,
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
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;

  -- Verificar se a nota pertence ao usuário
  IF NOT EXISTS (
    SELECT 1 FROM deal_notes
    WHERE deal_notes.id = p_note_id
    AND deal_notes.user_id = v_user_id
  ) THEN
    RAISE EXCEPTION 'Nota não encontrada ou você não tem permissão para editá-la';
  END IF;

  -- Atualizar a nota
  RETURN QUERY
  UPDATE deal_notes
  SET note = p_note, updated_at = NOW()
  WHERE deal_notes.id = p_note_id
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

-- Função para deletar nota de negócio
CREATE OR REPLACE FUNCTION delete_deal_note(p_note_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;

  -- Verificar se a nota pertence ao usuário
  IF NOT EXISTS (
    SELECT 1 FROM deal_notes
    WHERE deal_notes.id = p_note_id
    AND deal_notes.user_id = v_user_id
  ) THEN
    RAISE EXCEPTION 'Nota não encontrada ou você não tem permissão para deletá-la';
  END IF;

  -- Deletar a nota
  DELETE FROM deal_notes WHERE id = p_note_id;

  RETURN TRUE;
END;
$$;

-- Mensagem de sucesso
DO $$
BEGIN
  RAISE NOTICE '✅ Funções de gerenciamento de notas criadas!';
  RAISE NOTICE 'Funções disponíveis:';
  RAISE NOTICE '  - create_contact_note(contact_id, note)';
  RAISE NOTICE '  - update_contact_note(note_id, note)';
  RAISE NOTICE '  - delete_contact_note(note_id)';
  RAISE NOTICE '  - create_deal_note(deal_id, note)';
  RAISE NOTICE '  - update_deal_note(note_id, note)';
  RAISE NOTICE '  - delete_deal_note(note_id)';
END $$;
