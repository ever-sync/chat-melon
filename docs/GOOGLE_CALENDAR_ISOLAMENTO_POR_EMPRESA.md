# Google Calendar - Isolamento por Empresa

## Problema Identificado

O Google Calendar estava sendo compartilhado entre empresas, causando um comportamento incorreto.

### Comportamento Incorreto (ANTES):
- ❌ Tokens armazenados na tabela `profiles` (vinculado ao USUÁRIO, não à EMPRESA)
- ❌ Usuário conectava em uma empresa e aparecia conectado em TODAS
- ❌ Ao trocar de empresa, o calendário continuava conectado
- ❌ Impossível ter conexões diferentes do Google Calendar para empresas diferentes

### Comportamento Correto (DEPOIS):
- ✅ Tokens armazenados na tabela `google_calendar_tokens` (vinculado a EMPRESA + USUÁRIO)
- ✅ Cada empresa tem sua própria conexão do Google Calendar
- ✅ Usuário precisa conectar separadamente em cada empresa
- ✅ Ao trocar de empresa, vê apenas a conexão daquela empresa
- ✅ Isolamento completo entre empresas

## Arquitetura da Solução

### 1. Nova Tabela `google_calendar_tokens`

```sql
CREATE TABLE google_calendar_tokens (
  id UUID PRIMARY KEY,
  company_id UUID NOT NULL,  -- 👈 ISOLAMENTO POR EMPRESA
  user_id UUID NOT NULL,     -- 👈 E POR USUÁRIO
  access_token TEXT,
  refresh_token TEXT,
  token_expiry TIMESTAMPTZ,
  google_email TEXT,
  connected_at TIMESTAMPTZ,
  last_sync_at TIMESTAMPTZ,
  UNIQUE(company_id, user_id) -- 👈 Uma conexão por empresa+usuário
);
```

### 2. Diferença das Tabelas

#### ANTES (profiles):
```
profiles
├─ user_id (PK)
├─ google_calendar_token
├─ google_calendar_refresh_token
└─ google_calendar_connected
```

**Problema**: Um token por usuário = compartilhado entre empresas

#### DEPOIS (google_calendar_tokens):
```
google_calendar_tokens
├─ id (PK)
├─ user_id (FK)
├─ company_id (FK) 👈 NOVO!
├─ access_token
├─ refresh_token
└─ UNIQUE(company_id, user_id)
```

**Solução**: Um token por (empresa + usuário) = isolado

## Arquivos Modificados

### 1. Migration: `20251227170000_fix_google_calendar_company_isolation.sql`

**O que faz:**
- Cria tabela `google_calendar_tokens`
- Adiciona índices para performance
- Configura RLS (Row Level Security)
- Depreca campos antigos em `profiles`

**Importante:**
- Os dados antigos em `profiles` NÃO são migrados automaticamente
- Usuários precisarão reconectar o Google Calendar em cada empresa

### 2. Hook: `src/hooks/useGoogleCalendar.ts`

**Mudanças principais:**

#### ANTES:
```typescript
// Não filtrava por empresa
const { data: profile } = await supabase
  .from('profiles')
  .select('google_calendar_connected, google_calendar_email')
  .eq('id', user.id)
  .single();
```

#### DEPOIS:
```typescript
// Filtra por empresa + usuário
const { data: token } = await supabase
  .from('google_calendar_tokens')
  .select('google_email, connected_at')
  .eq('user_id', user.id)
  .eq('company_id', currentCompany.id)  // 👈 NOVO!
  .maybeSingle();
```

#### Mudanças na conexão:
```typescript
// Passa companyId para a Edge Function
const { data, error } = await supabase.functions.invoke('google-calendar-oauth', {
  body: {
    action: 'get_auth_url',
    userId: user.id,
    companyId: currentCompany.id,  // 👈 NOVO!
  },
});
```

#### Mudanças na desconexão:
```typescript
// Passa companyId para desconectar
const { error } = await supabase.functions.invoke('google-calendar-oauth', {
  body: {
    action: 'disconnect',
    userId: user.id,
    companyId: currentCompany.id,  // 👈 NOVO!
  },
});
```

### 3. Edge Function: `supabase/functions/google-calendar-oauth/index.ts`

**Mudanças principais:**

#### OAuth Callback - State Parameter:

**ANTES:**
```typescript
const callbackState = url.searchParams.get('state'); // userId
```

**DEPOIS:**
```typescript
const callbackState = url.searchParams.get('state'); // userId:companyId
const [userId, companyId] = callbackState.split(':');
```

#### Salvando Token:

**ANTES:**
```typescript
await supabase
  .from('profiles')
  .update({
    google_calendar_token: {...},
    google_calendar_connected: true,
  })
  .eq('id', userId);
```

**DEPOIS:**
```typescript
await supabase
  .from('google_calendar_tokens')
  .upsert({
    user_id: userId,
    company_id: companyId,  // 👈 NOVO!
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    token_expiry: ...,
    google_email: userEmail,
  }, {
    onConflict: 'company_id,user_id'
  });
```

#### Desconectando:

**ANTES:**
```typescript
await supabase
  .from('profiles')
  .update({
    google_calendar_connected: false,
    google_calendar_token: null,
  })
  .eq('id', userId);
```

**DEPOIS:**
```typescript
await supabase
  .from('google_calendar_tokens')
  .delete()
  .eq('user_id', userId)
  .eq('company_id', companyId);  // 👈 NOVO!
```

#### Refresh Token:

**ANTES:**
```typescript
const { data: profile } = await supabase
  .from('profiles')
  .select('google_calendar_refresh_token')
  .eq('id', userId)
  .single();
```

**DEPOIS:**
```typescript
const { data: tokenData } = await supabase
  .from('google_calendar_tokens')
  .select('refresh_token')
  .eq('user_id', userId)
  .eq('company_id', companyId)  // 👈 NOVO!
  .maybeSingle();
```

## Fluxos de Uso

### Fluxo 1: Conectar Google Calendar em Empresa A

```
1. Usuário está na Empresa A
2. Vai em Settings > Google Calendar
3. Status: ❌ Não conectado
4. Clica em "Conectar Google Calendar"
5. Hook passa { userId, companyId: 'empresa-a-id' }
6. Edge Function gera URL com state = "user-123:empresa-a-id"
7. Usuário autoriza no Google
8. Google retorna callback com state
9. Edge Function salva token em google_calendar_tokens:
   {
     user_id: 'user-123',
     company_id: 'empresa-a-id',
     access_token: '...',
     refresh_token: '...'
   }
10. Status: ✅ Conectado (apenas na Empresa A)
```

### Fluxo 2: Usuário troca para Empresa B

```
1. Usuário troca para Empresa B (selector de empresas)
2. Hook verifica conexão:
   - Busca em google_calendar_tokens
   - Filtra por user_id + company_id (Empresa B)
   - Não encontra nada
3. Status: ❌ Não conectado (na Empresa B)
4. Google Calendar da Empresa A NÃO aparece
```

### Fluxo 3: Conectar também na Empresa B

```
1. Usuário conecta Google Calendar na Empresa B
2. Hook passa { userId, companyId: 'empresa-b-id' }
3. Edge Function salva NOVO token:
   {
     user_id: 'user-123',
     company_id: 'empresa-b-id',  // 👈 Empresa B!
     access_token: '...',
     refresh_token: '...'
   }
4. Agora usuário tem 2 conexões:
   - Uma para Empresa A
   - Uma para Empresa B
5. Cada uma é independente!
```

### Fluxo 4: Desconectar de uma Empresa

```
1. Usuário está na Empresa A
2. Vai em Settings > Google Calendar
3. Clica em "Desconectar"
4. Edge Function deleta:
   DELETE FROM google_calendar_tokens
   WHERE user_id = 'user-123'
   AND company_id = 'empresa-a-id';  // 👈 Só da Empresa A!
5. Status: ❌ Não conectado (na Empresa A)
6. Empresa B continua conectada (não foi afetada)
```

## Row Level Security (RLS)

### Policies Implementadas:

```sql
-- Usuário só vê suas próprias conexões
CREATE POLICY "Users can view their own google calendar tokens"
  ON google_calendar_tokens FOR SELECT
  USING (user_id = auth.uid());

-- Usuário só pode inserir seus próprios tokens
CREATE POLICY "Users can insert their own google calendar tokens"
  ON google_calendar_tokens FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Usuário só pode atualizar seus próprios tokens
CREATE POLICY "Users can update their own google calendar tokens"
  ON google_calendar_tokens FOR UPDATE
  USING (user_id = auth.uid());

-- Usuário só pode deletar seus próprios tokens
CREATE POLICY "Users can delete their own google calendar tokens"
  ON google_calendar_tokens FOR DELETE
  USING (user_id = auth.uid());
```

### Garantias de Segurança:

- ✅ Usuário NÃO pode ver tokens de outros usuários
- ✅ Usuário NÃO pode deletar tokens de outros usuários
- ✅ Usuário NÃO pode inserir tokens para outros usuários
- ✅ Admin de uma empresa NÃO vê tokens de outras empresas

## Como Aplicar as Mudanças

### 1. Aplicar a Migração

```bash
# Conectar ao banco (local ou produção)
psql "postgresql://..."

# Executar a migration
\i supabase/migrations/20251227170000_fix_google_calendar_company_isolation.sql
```

### 2. Deploy das Edge Functions

```bash
# Deploy da função OAuth
npx supabase functions deploy google-calendar-oauth

# Verificar se está funcionando
npx supabase functions inspect google-calendar-oauth
```

### 3. Avisar Usuários

**IMPORTANTE:** Usuários que já tinham Google Calendar conectado precisarão:
1. Ir em Settings > Google Calendar
2. Verão status como "Não conectado" (normal, pois a tabela mudou)
3. Clicar em "Conectar Google Calendar" novamente
4. Fazer isso para CADA empresa que quiserem usar o calendário

## Logs de Debug

### No Frontend (Console):

```javascript
// Ao verificar conexão
🔍 Google Calendar status: {
  userId: 'user-123',
  companyId: 'empresa-a-id',
  connected: true,
  email: 'user@gmail.com'
}

// Ao conectar
📅 Connecting Google Calendar: {
  userId: 'user-123',
  companyId: 'empresa-a-id'
}

// Ao desconectar
🔌 Disconnecting Google Calendar: {
  userId: 'user-123',
  companyId: 'empresa-a-id'
}
```

### Na Edge Function (Supabase Logs):

```
🔐 OAuth callback received: { userId: 'user-123', companyId: 'empresa-a-id' }
📧 User info from Google: { email: 'user@gmail.com', ... }
✅ Token salvo com sucesso para empresa: empresa-a-id

🔄 Refreshing token: { userId: 'user-123', companyId: 'empresa-a-id' }
✅ Token refreshed successfully

🔌 Disconnecting Google Calendar: { userId: 'user-123', companyId: 'empresa-a-id' }
✅ Google Calendar desconectado com sucesso
```

## Teste Manual

### Passo 1: Criar 2 Empresas

```sql
-- No Supabase SQL Editor
SELECT id, name FROM companies;

-- Anote os IDs:
-- Empresa A: xxx-aaa-111
-- Empresa B: xxx-bbb-222
```

### Passo 2: Conectar na Empresa A

1. Selecione Empresa A no selector
2. Vá em Settings > Google Calendar
3. Clique em "Conectar Google Calendar"
4. Autorize no Google
5. Verifique status: ✅ Conectado

### Passo 3: Verificar Isolamento

1. Troque para Empresa B no selector
2. Vá em Settings > Google Calendar
3. Status deve mostrar: ❌ Não conectado
4. **CORRETO**: Calendário é independente por empresa

### Passo 4: Conectar na Empresa B

1. Clique em "Conectar Google Calendar"
2. Autorize novamente
3. Status: ✅ Conectado (na Empresa B)

### Passo 5: Verificar Banco de Dados

```sql
-- Ver todas as conexões do usuário
SELECT
  company_id,
  user_id,
  google_email,
  connected_at
FROM google_calendar_tokens
WHERE user_id = 'seu-user-id';

-- Deve retornar 2 linhas:
-- 1. company_id = empresa-a-id
-- 2. company_id = empresa-b-id
```

### Passo 6: Desconectar da Empresa A

1. Volte para Empresa A
2. Clique em "Desconectar"
3. Status: ❌ Não conectado (Empresa A)
4. Troque para Empresa B
5. Status: ✅ Conectado (Empresa B não foi afetada)

## Troubleshooting

### Problema: Status continua mostrando "Conectado" em todas as empresas

**Causa**: Ainda está usando campos antigos de `profiles`

**Solução**:
1. Verificar se migration foi aplicada
2. Limpar campos antigos:
```sql
UPDATE profiles
SET
  google_calendar_connected = false,
  google_calendar_token = null,
  google_calendar_refresh_token = null,
  google_calendar_email = null;
```

### Problema: Erro "companyId é obrigatório"

**Causa**: Edge Function não está recebendo `companyId`

**Solução**:
1. Verificar se hook está passando `companyId`
2. Verificar se `currentCompany` está definido
3. Logs devem mostrar: `📅 Connecting Google Calendar: { userId: ..., companyId: ... }`

### Problema: Token não está sendo salvo

**Causa**: RLS pode estar bloqueando insert

**Solução**:
```sql
-- Verificar se policies existem
SELECT * FROM pg_policies WHERE tablename = 'google_calendar_tokens';

-- Se não existir, aplicar migration novamente
```

### Problema: Popup fecha mas não conecta

**Causa**: OAuth callback não está parseando state corretamente

**Solução**:
1. Verificar logs da Edge Function
2. Procurar por "State inválido"
3. Verificar formato do state: deve ser "userId:companyId"

## Conclusão

O Google Calendar agora está completamente isolado por empresa:

1. ✅ **Isolamento por Empresa** - Cada empresa tem suas próprias conexões
2. ✅ **Isolamento por Usuário** - Cada usuário conecta separadamente
3. ✅ **Segurança** - RLS impede acesso a tokens de outros usuários
4. ✅ **Independência** - Desconectar em uma empresa não afeta outras

**Impacto nos Usuários:**
- Precisarão reconectar o Google Calendar
- Farão isso uma vez por empresa
- Cada empresa terá sua própria conexão independente
