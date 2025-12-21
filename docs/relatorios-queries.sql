-- =====================================================
-- QUERIES DE EXEMPLO PARA RELATÓRIOS
-- Sistema MelonChat - Análise de Atendimentos
-- =====================================================

-- 1. TABULAÇÕES - Top 10 motivos de encerramento
SELECT
  t.name AS tabulacao,
  t.color,
  COUNT(c.id) AS total_atendimentos,
  ROUND(COUNT(c.id) * 100.0 / SUM(COUNT(c.id)) OVER(), 2) AS percentual
FROM conversations c
JOIN tabulations t ON c.tabulation_id = t.id
WHERE c.status = 'closed'
  AND c.resolved_at >= NOW() - INTERVAL '30 days'
  AND c.company_id = 'YOUR_COMPANY_ID'
GROUP BY t.id, t.name, t.color
ORDER BY total_atendimentos DESC
LIMIT 10;

-- 2. PERFORMANCE POR ATENDENTE (últimos 30 dias)
SELECT
  cm.display_name AS atendente,
  cm.role AS funcao,
  t.name AS equipe,
  COUNT(DISTINCT c.id) AS total_atendimentos,
  COUNT(DISTINCT CASE WHEN c.status = 'closed' THEN c.id END) AS resolvidos,
  ROUND(
    COUNT(DISTINCT CASE WHEN c.status = 'closed' THEN c.id END) * 100.0 /
    NULLIF(COUNT(DISTINCT c.id), 0),
    2
  ) AS taxa_resolucao,
  ROUND(
    AVG(EXTRACT(EPOCH FROM (c.resolved_at - c.created_at)) / 60),
    2
  ) AS tempo_medio_minutos
FROM conversations c
JOIN company_members cm ON c.assigned_to = cm.user_id
LEFT JOIN teams t ON cm.team_id = t.id
WHERE c.company_id = 'YOUR_COMPANY_ID'
  AND c.created_at >= NOW() - INTERVAL '30 days'
GROUP BY cm.user_id, cm.display_name, cm.role, t.name
ORDER BY total_atendimentos DESC;

-- 3. PERFORMANCE POR EQUIPE
SELECT
  t.name AS equipe,
  COUNT(DISTINCT c.id) AS total_atendimentos,
  COUNT(DISTINCT c.assigned_to) AS atendentes_ativos,
  ROUND(
    COUNT(DISTINCT c.id) * 1.0 /
    NULLIF(COUNT(DISTINCT c.assigned_to), 0),
    2
  ) AS media_por_atendente,
  ROUND(
    AVG(EXTRACT(EPOCH FROM (c.resolved_at - c.created_at)) / 60),
    2
  ) AS tempo_medio_minutos
FROM conversations c
JOIN company_members cm ON c.assigned_to = cm.user_id
JOIN teams t ON cm.team_id = t.id
WHERE c.company_id = 'YOUR_COMPANY_ID'
  AND c.created_at >= NOW() - INTERVAL '30 days'
GROUP BY t.id, t.name
ORDER BY total_atendimentos DESC;

-- 4. VOLUME POR CANAL
SELECT
  c.channel_type AS canal,
  COUNT(c.id) AS total,
  COUNT(CASE WHEN c.status = 'closed' THEN 1 END) AS fechados,
  ROUND(
    COUNT(CASE WHEN c.status = 'closed' THEN 1 END) * 100.0 /
    NULLIF(COUNT(c.id), 0),
    2
  ) AS taxa_fechamento,
  ROUND(AVG(EXTRACT(EPOCH FROM (c.resolved_at - c.created_at)) / 3600), 2) AS tempo_medio_horas
FROM conversations c
WHERE c.company_id = 'YOUR_COMPANY_ID'
  AND c.created_at >= NOW() - INTERVAL '30 days'
GROUP BY c.channel_type
ORDER BY total DESC;

-- 5. TAGS MAIS UTILIZADAS
SELECT
  l.name AS tag,
  l.color,
  COUNT(DISTINCT cl.conversation_id) AS total_conversas,
  ROUND(
    COUNT(DISTINCT cl.conversation_id) * 100.0 /
    (SELECT COUNT(DISTINCT id) FROM conversations WHERE company_id = 'YOUR_COMPANY_ID' AND created_at >= NOW() - INTERVAL '30 days'),
    2
  ) AS percentual_uso
FROM labels l
JOIN conversation_labels cl ON l.id = cl.label_id
JOIN conversations c ON cl.conversation_id = c.id
WHERE l.company_id = 'YOUR_COMPANY_ID'
  AND c.created_at >= NOW() - INTERVAL '30 days'
GROUP BY l.id, l.name, l.color
ORDER BY total_conversas DESC
LIMIT 15;

-- 6. FUNIL DE ATENDIMENTO (Status)
SELECT
  c.status AS status,
  COUNT(c.id) AS total,
  ROUND(
    COUNT(c.id) * 100.0 /
    SUM(COUNT(c.id)) OVER(),
    2
  ) AS percentual
FROM conversations c
WHERE c.company_id = 'YOUR_COMPANY_ID'
  AND c.created_at >= NOW() - INTERVAL '7 days'
GROUP BY c.status
ORDER BY total DESC;

-- 7. HORÁRIOS DE PICO (por hora do dia)
SELECT
  EXTRACT(HOUR FROM c.created_at) AS hora,
  COUNT(c.id) AS total_conversas,
  ROUND(AVG(EXTRACT(EPOCH FROM (c.resolved_at - c.created_at)) / 60), 2) AS tempo_medio_minutos
FROM conversations c
WHERE c.company_id = 'YOUR_COMPANY_ID'
  AND c.created_at >= NOW() - INTERVAL '30 days'
GROUP BY EXTRACT(HOUR FROM c.created_at)
ORDER BY hora;

-- 8. ATENDENTE x TABULAÇÃO (correlação)
SELECT
  cm.display_name AS atendente,
  t.name AS tabulacao,
  COUNT(c.id) AS total,
  ROUND(
    COUNT(c.id) * 100.0 /
    SUM(COUNT(c.id)) OVER(PARTITION BY cm.user_id),
    2
  ) AS percentual_atendente
FROM conversations c
JOIN tabulations t ON c.tabulation_id = t.id
JOIN company_members cm ON c.resolved_by = cm.user_id
WHERE c.company_id = 'YOUR_COMPANY_ID'
  AND c.status = 'closed'
  AND c.resolved_at >= NOW() - INTERVAL '30 days'
GROUP BY cm.user_id, cm.display_name, t.id, t.name
ORDER BY cm.display_name, total DESC;

-- 9. TEMPO MÉDIO DE PRIMEIRA RESPOSTA (FRT)
-- Requer join com tabela messages
SELECT
  cm.display_name AS atendente,
  COUNT(DISTINCT c.id) AS total_conversas,
  ROUND(
    AVG(EXTRACT(EPOCH FROM (
      SELECT MIN(m.created_at)
      FROM messages m
      WHERE m.conversation_id = c.id
        AND m.is_from_me = true
    ) - c.created_at) / 60),
    2
  ) AS frt_medio_minutos
FROM conversations c
JOIN company_members cm ON c.assigned_to = cm.user_id
WHERE c.company_id = 'YOUR_COMPANY_ID'
  AND c.created_at >= NOW() - INTERVAL '30 days'
GROUP BY cm.user_id, cm.display_name
ORDER BY frt_medio_minutos;

-- 10. DASHBOARD EXECUTIVO (visão geral)
SELECT
  COUNT(DISTINCT c.id) AS total_conversas,
  COUNT(DISTINCT CASE WHEN c.status = 'closed' THEN c.id END) AS resolvidas,
  COUNT(DISTINCT CASE WHEN c.status = 'waiting' THEN c.id END) AS aguardando,
  COUNT(DISTINCT CASE WHEN c.status = 'active' THEN c.id END) AS ativas,
  COUNT(DISTINCT c.assigned_to) AS atendentes_ativos,
  ROUND(
    AVG(EXTRACT(EPOCH FROM (c.resolved_at - c.created_at)) / 3600),
    2
  ) AS tempo_medio_horas,
  ROUND(
    COUNT(DISTINCT CASE WHEN c.status = 'closed' THEN c.id END) * 100.0 /
    NULLIF(COUNT(DISTINCT c.id), 0),
    2
  ) AS taxa_resolucao
FROM conversations c
WHERE c.company_id = 'YOUR_COMPANY_ID'
  AND c.created_at >= NOW() - INTERVAL '7 days';

-- =====================================================
-- NOTAS:
-- - Substitua 'YOUR_COMPANY_ID' pelo ID da sua empresa
-- - Ajuste os intervalos de tempo conforme necessário
-- - Adicione filtros adicionais (data específica, atendente, etc.)
-- - Use essas queries como base para criar seus relatórios
-- =====================================================
