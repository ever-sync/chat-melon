# Fix: Google Calendar Isolamento por Empresa

## 🐛 Problema

O Google Calendar estava sendo compartilhado entre empresas. Quando um usuário conectava o Google Calendar em uma empresa, aparecia como conectado em TODAS as empresas.

## ✅ Solução

Implementado isolamento completo por empresa + usuário.

## 📝 Mudanças

### 1. Nova Tabela no Banco de Dados

**Arquivo:** `supabase/migrations/20251227170000_fix_google_calendar_company_isolation.sql`

- Criada tabela `google_calendar_tokens` com `company_id` + `user_id`
- Cada empresa tem suas próprias conexões do Google Calendar
- RLS (Row Level Security) implementado

### 2. Hook Atualizado

**Arquivo:** `src/hooks/useGoogleCalendar.ts`

**Antes:**
```typescript
// Buscava apenas por user_id (compartilhado entre empresas)
.from('profiles')
.eq('id', user.id)
```

**Depois:**
```typescript
// Busca por user_id + company_id (isolado)
.from('google_calendar_tokens')
.eq('user_id', user.id)
.eq('company_id', currentCompany.id)
```

### 3. Edge Functions Atualizadas

**Arquivo:** `supabase/functions/google-calendar-oauth/index.ts`

**Mudanças:**
- OAuth callback agora recebe `userId:companyId` no state
- Tokens salvos em `google_calendar_tokens` em vez de `profiles`
- Todas as ações (connect, disconnect, refresh) agora requerem `companyId`

## 🚀 Como Aplicar

### 1. Aplicar Migration (IMPORTANTE!)

Execute no seu banco de dados:

```bash
psql "postgresql://..." -f supabase/migrations/20251227170000_fix_google_calendar_company_isolation.sql
```

Ou via Supabase Dashboard:
1. Vá em SQL Editor
2. Cole o conteúdo do arquivo `20251227170000_fix_google_calendar_company_isolation.sql`
3. Execute

### 2. Deploy das Edge Functions

```bash
npx supabase functions deploy google-calendar-oauth
```

### 3. Limpar Dados Antigos (Opcional mas Recomendado)

```sql
-- Limpar campos antigos da tabela profiles
UPDATE profiles
SET
  google_calendar_connected = false,
  google_calendar_token = null,
  google_calendar_refresh_token = null,
  google_calendar_email = null;
```

## ⚠️ Impacto nos Usuários

**IMPORTANTE:** Usuários que já tinham Google Calendar conectado precisarão reconectar!

### O que os usuários verão:

1. **Antes do fix:**
   - Empresa A: ✅ Conectado
   - Empresa B: ✅ Conectado (BUG - mesmo sem ter conectado)

2. **Depois do fix:**
   - Empresa A: ❌ Não conectado (precisa reconectar)
   - Empresa B: ❌ Não conectado

3. **Após reconectar:**
   - Empresa A: ✅ Conectado (independente)
   - Empresa B: ❌ Não conectado (até conectar manualmente)

### Como reconectar:

1. Ir em **Settings** > **Google Calendar**
2. Clicar em "Conectar Google Calendar"
3. Autorizar novamente
4. Repetir para cada empresa onde quiser usar o calendário

## 📊 Comportamento Correto

### Cenário 1: Usuário com 1 Empresa

```
Usuário: joao@email.com
Empresa: Empresa A

Antes: ✅ Conectado (compartilhado)
Depois: ❌ Não conectado → Precisa reconectar
Após reconectar: ✅ Conectado (isolado na Empresa A)
```

### Cenário 2: Usuário com 2 Empresas

```
Usuário: maria@email.com
Empresa A: Marketing Digital
Empresa B: Vendas Online

Antes:
- Conectava na Empresa A
- Aparecia conectado na Empresa B também (BUG)

Depois:
- Conecta na Empresa A → ✅ Conectado apenas na A
- Troca para Empresa B → ❌ Não conectado
- Conecta na Empresa B → ✅ Conectado também na B
- Agora tem 2 conexões independentes
```

### Cenário 3: Desconectar de uma Empresa

```
Usuário com Google Calendar conectado em:
- Empresa A ✅
- Empresa B ✅

Desconecta da Empresa A:
- Empresa A ❌ (desconectado)
- Empresa B ✅ (continua conectado - não foi afetado)
```

## 🔍 Como Testar

### Teste 1: Verificar Isolamento

1. Conectar Google Calendar na Empresa A
2. Trocar para Empresa B
3. Verificar status: Deve mostrar "Não conectado"
4. ✅ Sucesso: Calendários são independentes

### Teste 2: Múltiplas Conexões

1. Conectar na Empresa A
2. Conectar na Empresa B
3. Verificar banco de dados:
```sql
SELECT company_id, user_id, google_email
FROM google_calendar_tokens
WHERE user_id = 'seu-user-id';
```
4. Deve retornar 2 linhas (uma para cada empresa)

### Teste 3: Desconexão Isolada

1. Conectar em ambas as empresas
2. Desconectar da Empresa A
3. Verificar Empresa B: Deve continuar conectado
4. ✅ Sucesso: Desconexão não afeta outras empresas

## 📋 Checklist de Deploy

- [ ] Migration aplicada no banco de dados
- [ ] Edge function `google-calendar-oauth` deployed
- [ ] Dados antigos de `profiles` limpos (opcional)
- [ ] Usuários avisados sobre necessidade de reconectar
- [ ] Testes realizados em ambiente de staging
- [ ] Documentação atualizada

## 📚 Documentação Completa

Veja `docs/GOOGLE_CALENDAR_ISOLAMENTO_POR_EMPRESA.md` para documentação técnica detalhada.

## 🎯 Resultado Final

- ✅ Google Calendar isolado por empresa
- ✅ Cada empresa tem suas próprias conexões
- ✅ RLS implementado para segurança
- ✅ Usuários podem ter calendários diferentes em cada empresa
- ✅ Desconexão em uma empresa não afeta outras

## 📞 Suporte

Se usuários reportarem problemas:

1. Verificar se migration foi aplicada
2. Verificar logs da Edge Function
3. Pedir para reconectar o Google Calendar
4. Se persistir, verificar RLS policies

---

**Data da correção:** 2025-12-27
**Versão:** 1.0.0
**Impacto:** Alto (requer reconexão dos usuários)
**Breaking Change:** Sim (usuários precisam reconectar)
