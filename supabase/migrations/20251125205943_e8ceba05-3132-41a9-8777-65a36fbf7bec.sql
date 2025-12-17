-- Criar tabela de filas
CREATE TABLE IF NOT EXISTS queues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#3B82F6',
  max_conversations_per_agent INTEGER DEFAULT 5,
  auto_assign BOOLEAN DEFAULT true,
  assignment_method TEXT DEFAULT 'round_robin',
  working_hours JSONB DEFAULT '{"monday": {"enabled": true, "start": "08:00", "end": "18:00"}, "tuesday": {"enabled": true, "start": "08:00", "end": "18:00"}, "wednesday": {"enabled": true, "start": "08:00", "end": "18:00"}, "thursday": {"enabled": true, "start": "08:00", "end": "18:00"}, "friday": {"enabled": true, "start": "08:00", "end": "18:00"}, "saturday": {"enabled": false, "start": "09:00", "end": "13:00"}, "sunday": {"enabled": false, "start": "09:00", "end": "13:00"}}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Criar tabela de membros da fila
CREATE TABLE IF NOT EXISTS queue_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_id UUID REFERENCES queues(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  max_conversations INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(queue_id, user_id)
);

-- Adicionar campo queue_id na tabela conversations
ALTER TABLE conversations ADD COLUMN queue_id UUID REFERENCES queues(id) ON DELETE SET NULL;

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_queues_company ON queues(company_id);
CREATE INDEX IF NOT EXISTS idx_queues_active ON queues(is_active);
CREATE INDEX IF NOT EXISTS idx_queue_members_queue ON queue_members(queue_id);
CREATE INDEX IF NOT EXISTS idx_queue_members_user ON queue_members(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_queue ON conversations(queue_id);

-- RLS Policies para queues
ALTER TABLE queues ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view queues in their company" ON queues;
CREATE POLICY "Users can view queues in their company"
  ON queues FOR SELECT
  USING (company_id = get_user_company(auth.uid()));

DROP POLICY IF EXISTS "Admins can manage queues" ON queues;
CREATE POLICY "Admins can manage queues"
  ON queues FOR ALL
  USING (has_role(auth.uid(), company_id, 'admin'));

-- RLS Policies para queue_members
ALTER TABLE queue_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view queue members in their company" ON queue_members;
CREATE POLICY "Users can view queue members in their company"
  ON queue_members FOR SELECT
  USING (queue_id IN (
    SELECT id FROM queues WHERE company_id = get_user_company(auth.uid())
  ));

DROP POLICY IF EXISTS "Admins can manage queue members" ON queue_members;
CREATE POLICY "Admins can manage queue members"
  ON queue_members FOR ALL
  USING (queue_id IN (
    SELECT id FROM queues WHERE has_role(auth.uid(), company_id, 'admin')
  ));

-- Trigger para updated_at
DROP TRIGGER IF EXISTS update_queues_updated_at ON queues;
CREATE TRIGGER update_queues_updated_at
  BEFORE UPDATE ON queues
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();