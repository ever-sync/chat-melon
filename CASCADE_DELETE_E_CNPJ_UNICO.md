# Cascade Delete e CNPJ Único - Documentação

## 📋 Visão Geral

Este documento descreve as implementações de **Cascade Delete** (deleção em cascata) e **CNPJ Único** no sistema.

## 🎯 Objetivos

### 1. Cascade Delete
Quando uma empresa é deletada, **TODOS** os dados relacionados são automaticamente removidos do banco de dados.

### 2. CNPJ Único
Impedir que duas empresas diferentes sejam cadastradas com o mesmo CNPJ.

---

## 🗄️ Cascade Delete

### O que acontece ao deletar uma empresa?

Quando você deleta uma empresa (via SQL `DELETE FROM companies WHERE id = '...'`), o PostgreSQL automaticamente deleta TODOS os registros relacionados nas seguintes tabelas:

#### 📊 Dados deletados automaticamente:

1. **Usuários e Membros**
   - `company_users` - Vinculação de usuários à empresa
   - `company_members` - Membros da equipe (não deletado, mas referência removida)

2. **Contatos e Comunicação**
   - `contacts` - Todos os contatos da empresa
   - `conversations` - Todas as conversas
   - `messages` - Todas as mensagens
   - `contact_notes` - Notas sobre contatos
   - `blocked_contacts` - Contatos bloqueados

3. **CRM e Vendas**
   - `deals` - Negócios/oportunidades
   - `tasks` - Tarefas
   - `pipelines` - Funis de vendas
   - `pipeline_stages` - Etapas dos funis

4. **Marketing**
   - `campaigns` - Campanhas de marketing
   - `campaign_contacts` - Contatos das campanhas
   - `segments` - Segmentações de clientes
   - `segment_contacts` - Contatos em segmentos

5. **Automação**
   - `automations` - Automações configuradas
   - `templates` - Templates de mensagens
   - `quick_replies` - Respostas rápidas

6. **Organização**
   - `labels` - Etiquetas/tags
   - `conversation_labels` - Etiquetas de conversas
   - `sectors` - Setores/departamentos

7. **Personalização**
   - `custom_fields` - Campos personalizados
   - `custom_field_values` - Valores dos campos
   - `lead_scoring_rules` - Regras de pontuação de leads

### ⚠️ Importante

**Esta é uma operação IRREVERSÍVEL!**

- Não há como recuperar os dados após deletar uma empresa
- Todos os dados relacionados são removidos permanentemente
- Recomenda-se fazer backup antes de deletar empresas importantes

### 🔧 Implementação Técnica

A deleção em cascata é implementada através de **Foreign Keys** com `ON DELETE CASCADE`:

```sql
ALTER TABLE contacts
ADD CONSTRAINT contacts_company_id_fkey
  FOREIGN KEY (company_id)
  REFERENCES companies(id)
  ON DELETE CASCADE;
```

Isso significa que quando `companies.id` é deletado, todos os registros em `contacts` com aquele `company_id` também são deletados automaticamente.

---

## 🔒 CNPJ Único

### Regra Implementada

**Não pode haver duas empresas ativas com o mesmo CNPJ.**

### Como funciona?

#### 1. Constraint no Banco de Dados

```sql
ALTER TABLE companies
ADD CONSTRAINT unique_company_cnpj UNIQUE (cnpj);
```

Esta constraint garante que o PostgreSQL rejeite qualquer tentativa de inserir um CNPJ duplicado.

#### 2. Trigger de Validação

Além da constraint, há um trigger que valida antes de inserir/atualizar:

```sql
CREATE TRIGGER trigger_validate_unique_cnpj
  BEFORE INSERT OR UPDATE OF cnpj ON companies
  FOR EACH ROW
  EXECUTE FUNCTION validate_unique_cnpj();
```

O trigger lança uma exceção personalizada:

```
CNPJ já cadastrado. Este CNPJ já está sendo usado por outra empresa.
```

#### 3. Validação no Frontend

Antes de tentar inserir no banco, o sistema verifica se o CNPJ já existe:

```typescript
// Validar CNPJ único antes de inserir
const { data: existingCompany } = await supabase
    .from("companies")
    .select("id, name")
    .eq("cnpj", companyData.cnpj)
    .is("deleted_at", null)
    .maybeSingle();

if (existingCompany) {
    toast.error(
        `CNPJ já cadastrado! Este CNPJ já está sendo usado pela empresa "${existingCompany.name}".`
    );
    return;
}
```

### Mensagens de Erro

O usuário verá uma mensagem clara e informativa:

```
CNPJ já cadastrado! Este CNPJ já está sendo usado pela empresa "Acme Corp".
Se você já possui uma conta, faça login. Caso contrário, entre em contato com o suporte.
```

A mensagem:
- ✅ Informa claramente o problema
- ✅ Mostra o nome da empresa que já usa o CNPJ
- ✅ Sugere ações (fazer login ou contatar suporte)
- ✅ Duração de 8 segundos para o usuário ler

### Onde a validação ocorre?

**Arquivo:** `src/pages/SignUp.tsx`

**Momento:** No Step 2 do cadastro, ao submeter os dados da empresa

**Fluxo:**

1. Usuário preenche CNPJ no formulário
2. Clica em "Finalizar Cadastro"
3. Sistema verifica se CNPJ já existe ⚡
4. Se existir: Mostra erro e **não** cria a empresa ❌
5. Se não existir: Prossegue com cadastro ✅

---

## 📁 Arquivos Modificados

### 1. Migrations (Banco de Dados)

#### `supabase/migrations/20251129000002_company_cascade_and_unique_cnpj.sql`

**O que faz:**
- Adiciona constraint `unique_company_cnpj`
- Adiciona índice `idx_companies_cnpj` para performance
- Atualiza todas as Foreign Keys para `ON DELETE CASCADE`
- Cria função `validate_unique_cnpj()`
- Cria trigger `trigger_validate_unique_cnpj`

#### `supabase/migrations/20251129000003_add_company_delete_policy.sql`

**O que faz:**
- Adiciona política RLS de DELETE para a tabela companies
- Permite que o criador da empresa possa deletá-la
- **IMPORTANTE**: Sem esta política, o botão de deletar não funciona!

### 2. Frontend (Validação)

**Arquivo:** `src/pages/SignUp.tsx`

**Mudanças:**
- Função `handleStep2Submit` agora valida CNPJ antes de inserir
- Tratamento de erro específico para CNPJ duplicado
- Mensagens de erro personalizadas

---

## 🧪 Como Testar

### Teste 1: CNPJ Duplicado

1. Cadastre uma empresa com CNPJ `12.345.678/0001-90`
2. Tente cadastrar outra empresa com o mesmo CNPJ
3. **Resultado esperado:** Mensagem de erro informando que CNPJ já existe

### Teste 2: Cascade Delete

1. Crie uma empresa de teste
2. Adicione dados relacionados:
   - 5 contatos
   - 3 conversas
   - 10 mensagens
   - 2 deals
3. Delete a empresa via SQL:
   ```sql
   DELETE FROM companies WHERE id = 'id-da-empresa-teste';
   ```
4. **Resultado esperado:** Todos os dados relacionados são deletados
5. Verifique:
   ```sql
   SELECT COUNT(*) FROM contacts WHERE company_id = 'id-da-empresa-teste';
   -- Deve retornar 0

   SELECT COUNT(*) FROM conversations WHERE company_id = 'id-da-empresa-teste';
   -- Deve retornar 0
   ```

---

## 🔍 Troubleshooting

### Problema: "CNPJ já cadastrado" mas não encontro a empresa

**Possíveis causas:**
1. A empresa foi soft-deleted (campo `deleted_at` não é NULL)
2. O CNPJ tem espaços ou formatação diferente

**Solução:**
```sql
-- Buscar empresas (incluindo deletadas) por CNPJ
SELECT id, name, cnpj, deleted_at
FROM companies
WHERE cnpj = '12.345.678/0001-90';

-- Se houver empresa deletada, você pode:
-- 1. Restaurá-la (UPDATE deleted_at = NULL)
-- 2. Deletá-la permanentemente (DELETE FROM companies)
```

### Problema: Erro ao deletar empresa

**Mensagem:** "cannot delete from table companies because other objects depend on it"

**Causa:** Alguma tabela não tem `ON DELETE CASCADE` configurado

**Solução:**
1. Verifique qual tabela está causando o problema no erro
2. Execute a migration novamente
3. Ou adicione manualmente:
   ```sql
   ALTER TABLE nome_da_tabela
   DROP CONSTRAINT constraint_name,
   ADD CONSTRAINT constraint_name
     FOREIGN KEY (company_id)
     REFERENCES companies(id)
     ON DELETE CASCADE;
   ```

---

## 📊 Tabelas com Cascade Delete

Lista completa das tabelas afetadas:

1. company_users
2. contacts
3. conversations
4. messages
5. deals
6. tasks
7. campaigns
8. campaign_contacts
9. automations
10. pipelines
11. pipeline_stages
12. quick_replies
13. templates
14. labels
15. conversation_labels
16. sectors
17. custom_fields
18. custom_field_values
19. blocked_contacts
20. contact_notes
21. segments
22. segment_contacts
23. lead_scoring_rules

**Total:** 23 tabelas com cascade delete configurado

---

## ✅ Benefícios

### Cascade Delete

✅ **Integridade dos Dados** - Não ficam dados órfãos no banco
✅ **Limpeza Automática** - Não precisa deletar manualmente em cada tabela
✅ **Performance** - Deleção rápida e eficiente
✅ **Simplicidade** - Uma única operação limpa tudo

### CNPJ Único

✅ **Evita Duplicação** - Uma empresa = Um CNPJ
✅ **Segurança** - Impede fraudes ou erros de cadastro
✅ **UX Melhorada** - Mensagens claras para o usuário
✅ **Validação em 3 camadas** - Frontend + Trigger + Constraint

---

## 🚀 Aplicação das Migrations

Para aplicar essas mudanças ao banco de dados, você precisa aplicar **3 migrations** nesta ordem:

```bash
# Via Supabase CLI (aplica todas as migrations pendentes)
supabase db push

# Ou via SQL Editor no Dashboard do Supabase
# Cole o conteúdo dos arquivos na ordem:
# 1. supabase/migrations/20251129000001_add_evolution_api_config.sql
# 2. supabase/migrations/20251129000002_company_cascade_and_unique_cnpj.sql
# 3. supabase/migrations/20251129000003_add_company_delete_policy.sql
```

### ⚠️ IMPORTANTE

**O botão de deletar empresa NÃO funciona sem a migration 20251129000003!**

A migration `20251129000003_add_company_delete_policy.sql` adiciona a política RLS (Row Level Security) que permite ao usuário deletar empresas. Sem ela, o PostgreSQL bloqueia qualquer tentativa de DELETE na tabela companies.

---

**Última atualização:** 29/11/2025
**Versão:** 1.0
**Autor:** Claude (Anthropic)
