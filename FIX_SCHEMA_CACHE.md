# 🔧 Correção Completa do Schema Cache - Passo a Passo

## ⚠️ PROBLEMA CRÍTICO

Você está enfrentando erros de cache do PostgREST no Supabase Free Plan:
- `PGRST204`: Colunas não encontradas no cache (subscription_status, trial_ends_at, evolution_instance_name)
- `PGRST205`: View online_users não encontrada no cache
- Campos undefined na aplicação mesmo existindo no banco

## ✅ SOLUÇÃO COMPLETA

### PASSO 1: Execute este SQL no Supabase SQL Editor

```sql
-- 1️⃣ Atualizar empresa EverSync com dados de trial
UPDATE companies
SET
  subscription_status = 'trial',
  trial_started_at = NOW(),
  trial_ends_at = NOW() + INTERVAL '3 days',
  evolution_instance_name = 'eversync'
WHERE id = '7e21bb42-a351-4359-b6c4-67a9ccc22762';

-- Verificar se atualizou
SELECT
  id,
  name,
  subscription_status,
  trial_ends_at,
  evolution_instance_name
FROM companies
WHERE id = '7e21bb42-a351-4359-b6c4-67a9ccc22762';

-- 2️⃣ Criar view online_users (para chat interno)
DROP VIEW IF EXISTS online_users CASCADE;

CREATE VIEW online_users AS
SELECT DISTINCT
  u.id,
  u.email,
  u.raw_user_meta_data->>'full_name' as full_name,
  cm.company_id,
  cm.display_name,
  CASE
    WHEN u.last_sign_in_at > NOW() - INTERVAL '5 minutes'
    THEN true
    ELSE false
  END as is_online
FROM auth.users u
JOIN company_members cm ON cm.user_id = u.id
WHERE cm.is_active = true;

-- Verificar view
SELECT * FROM online_users;

-- 3️⃣ Adicionar coluna team_id em company_invites (se não existir)
ALTER TABLE company_invites
ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES teams(id) ON DELETE SET NULL;

-- 4️⃣ Garantir que todas as empresas tenham dados de trial
UPDATE companies
SET
  subscription_status = COALESCE(subscription_status, 'trial'),
  trial_started_at = COALESCE(trial_started_at, NOW()),
  trial_ends_at = COALESCE(trial_ends_at, NOW() + INTERVAL '3 days')
WHERE subscription_status IS NULL
   OR trial_ends_at IS NULL;

-- Verificar todas as empresas
SELECT id, name, subscription_status, trial_ends_at
FROM companies
ORDER BY created_at DESC;
```

### PASSO 2: 🔄 LIMPAR O CACHE (OBRIGATÓRIO!)

**Opção A - Pause/Restore (RECOMENDADO para Free Plan):**

1. Vá em: **Project Settings → General**
2. Role até o final da página
3. Clique em **"Pause project"**
4. Aguarde 30 segundos
5. Clique em **"Restore project"**
6. Aguarde 1-2 minutos até o projeto estar 100% ativo

**Opção B - Restart Project (se disponível):**

1. Vá em: **Project Settings → General**
2. Procure por **"Restart project"**
3. Confirme o restart
4. Aguarde 2-3 minutos

### PASSO 3: ✅ Habilitar Replicação Realtime

Após o projeto estar ativo novamente:

1. Vá em: **Database → Replication**
2. Habilite replicação para estas tabelas:
   - ✅ `messages`
   - ✅ `conversations`
   - ✅ `internal_messages`
   - ✅ `companies`
   - ✅ `contacts`
3. Clique em **Save**

### PASSO 4: 🚀 Deploy da Edge Function (se ainda não fez)

A função `handle-evolution-webhook` está criada no arquivo `EDGE_FUNCTION_CODE.txt`.

**Deploy Manual pelo Dashboard:**

1. Vá em: **Edge Functions**
2. Clique em **"New Function"**
3. Nome: `handle-evolution-webhook`
4. Cole o código do arquivo `EDGE_FUNCTION_CODE.txt`
5. Clique em **"Deploy"**

**URL final do webhook:**
```
https://nmbiuebxhovmwxrbaxsz.supabase.co/functions/v1/handle-evolution-webhook
```

### PASSO 5: ⚙️ Configurar Evolution API

No painel da Evolution API, configure o webhook:

1. URL: `https://nmbiuebxhovmwxrbaxsz.supabase.co/functions/v1/handle-evolution-webhook`
2. Eventos habilitados:
   - `MESSAGES_UPSERT`
   - `MESSAGES_UPDATE`
   - `CONNECTION_UPDATE`
   - `QRCODE_UPDATED`
3. Headers: (vazio, não precisa)

### PASSO 6: 🧪 Testar Tudo

Após concluir os passos acima:

1. **Teste Trial Banner:**
   - Abra a aplicação
   - Verifique se aparece o banner de trial no topo
   - Deve mostrar "X dias restantes"

2. **Teste Chat Interno:**
   - Clique no ícone de chat interno no header
   - Deve mostrar a lista de membros da equipe
   - Status online/offline deve aparecer

3. **Teste WhatsApp:**
   - Envie uma mensagem para o número da instância Evolution
   - A mensagem deve aparecer AUTOMATICAMENTE no chat (sem refresh)
   - Responda pelo chat - deve enviar via Evolution API

4. **Teste Realtime:**
   - Abra o chat em duas abas diferentes
   - Envie mensagem em uma aba
   - Deve aparecer na outra aba INSTANTANEAMENTE

## 📊 VERIFICAÇÃO DE SUCESSO

Execute este SQL para verificar se tudo está OK:

```sql
-- Verificar se view existe
SELECT table_name, table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name = 'online_users';

-- Verificar dados da empresa
SELECT
  id,
  name,
  subscription_status,
  trial_ends_at::date as trial_expira,
  evolution_instance_name,
  evolution_connected
FROM companies;

-- Verificar se Edge Function está recebendo (após enviar msg)
SELECT
  id,
  conversation_id,
  content,
  external_id,
  created_at
FROM messages
ORDER BY created_at DESC
LIMIT 5;
```

## 🐛 SE AINDA HOUVER ERROS

**Console mostra erro PGRST204/PGRST205:**
- Você NÃO fez o Pause/Restore do projeto
- O cache ainda está antigo
- Faça o Passo 2 obrigatoriamente

**Mensagens não chegam automaticamente:**
- Edge Function não foi deployada
- Webhook Evolution não está configurado
- Instance name não bate com o cadastrado

**Chat interno não mostra membros:**
- View online_users não foi criada
- Replicação Realtime não foi habilitada
- Cache não foi limpo

**Trial banner não aparece:**
- Campos trial_ends_at/subscription_status não foram atualizados
- Cache não foi limpo
- Componente TrialBadge não está renderizando

## 📞 PRÓXIMOS PASSOS

Após executar TODOS os passos acima, me avise:

✅ "Executei o SQL e pausei/restaurei o projeto"

Aí eu vou verificar se tudo está funcionando e vamos testar o fluxo completo! 🚀
