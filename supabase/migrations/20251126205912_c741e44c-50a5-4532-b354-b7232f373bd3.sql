-- Adicionar tabelas ao supabase_realtime publication para habilitar real-time
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Garantir REPLICA IDENTITY FULL para capturar todas as mudanças
ALTER TABLE public.conversations REPLICA IDENTITY FULL;
ALTER TABLE public.messages REPLICA IDENTITY FULL;