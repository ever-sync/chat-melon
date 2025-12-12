-- ============================================
-- SEED: ACHIEVEMENTS PADRÃO PARA GAMIFICAÇÃO
-- ============================================

-- Inserir achievements padrão (globais, sem company_id para serem usados como template)
INSERT INTO achievements (id, company_id, name, description, icon, criteria, points, created_at)
SELECT 
  gen_random_uuid(),
  c.id,
  a.name,
  a.description,
  a.icon,
  a.criteria::jsonb,
  a.points,
  now()
FROM companies c
CROSS JOIN (VALUES
  ('Primeiro Negócio', 'Fechou seu primeiro negócio', '🎯', '{"type": "deals_won", "count": 1}', 10),
  ('Vendedor Bronze', 'Fechou 5 negócios', '🥉', '{"type": "deals_won", "count": 5}', 25),
  ('Vendedor Prata', 'Fechou 10 negócios', '🥈', '{"type": "deals_won", "count": 10}', 50),
  ('Vendedor Ouro', 'Fechou 25 negócios', '🥇', '{"type": "deals_won", "count": 25}', 100),
  ('Vendedor Platina', 'Fechou 50 negócios', '💎', '{"type": "deals_won", "count": 50}', 200),
  ('Mestre das Vendas', 'Fechou 100 negócios', '👑', '{"type": "deals_won", "count": 100}', 500),
  ('Primeira Conversa', 'Respondeu sua primeira conversa', '💬', '{"type": "conversations", "count": 1}', 5),
  ('Comunicador', 'Respondeu 50 conversas', '📱', '{"type": "conversations", "count": 50}', 30),
  ('Expert em Atendimento', 'Respondeu 200 conversas', '🌟', '{"type": "conversations", "count": 200}', 75),
  ('Resposta Rápida', 'Tempo médio de resposta menor que 5 minutos', '⚡', '{"type": "response_time", "max_minutes": 5}', 40),
  ('Campanha Iniciada', 'Enviou sua primeira campanha', '📢', '{"type": "campaigns", "count": 1}', 15),
  ('Marketeiro', 'Enviou 10 campanhas', '📊', '{"type": "campaigns", "count": 10}', 60),
  ('Meta Batida', 'Atingiu sua primeira meta', '🎯', '{"type": "goals_completed", "count": 1}', 20),
  ('Determinado', 'Atingiu 5 metas', '💪', '{"type": "goals_completed", "count": 5}', 50),
  ('Imparável', 'Atingiu 10 metas', '🔥', '{"type": "goals_completed", "count": 10}', 100)
) AS a(name, description, icon, criteria, points)
WHERE NOT EXISTS (
  SELECT 1 FROM achievements ach 
  WHERE ach.company_id = c.id AND ach.name = a.name
);

-- Mensagem de sucesso
DO $$
DECLARE
  achievement_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO achievement_count FROM achievements;
  RAISE NOTICE '✅ % achievements criados!', achievement_count;
END $$;
