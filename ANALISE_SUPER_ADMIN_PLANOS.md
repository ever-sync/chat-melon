# 📊 Análise: Sistema de Planos e Super Admin

**Data:** 28/11/2025
**Status:** ⚠️ Funcional com Limitações

---

## 🔍 Resumo Executivo

O sistema de Super Admin e gerenciamento de planos **EXISTE e está parcialmente funcional**, mas possui algumas **limitações críticas** que impedem uso completo:

### ✅ O que está funcionando:

1. **Autenticação de Super Admin** (`SuperAdminGate`)
2. **Visualização de empresas** (`PlatformCompanies`)
3. **Edição de features por plano** (`PlanFeaturesEditor`)
4. **Métricas da plataforma** (`PlatformMetrics`)
5. **Banco de dados** com todas as tabelas necessárias

### ❌ O que está faltando:

1. **Não há interface para CRIAR novos planos**
2. **Não há dados iniciais (seed)** de planos no banco
3. **Gerenciamento de empresas é apenas leitura** (sem editar/suspender/excluir)
4. **Não há visualização de assinaturas** das empresas
5. **Pricing page usa dados hardcoded** em vez do banco

---

## 📁 Estrutura Atual

### Páginas e Componentes

```
src/
├── pages/
│   ├── SuperAdmin.tsx          ✅ Painel principal com 4 tabs
│   └── Pricing.tsx              ⚠️ Usa dados hardcoded
│
├── components/
│   ├── auth/
│   │   └── SuperAdminGate.tsx   ✅ Proteção de rota
│   │
│   └── super-admin/
│       ├── FeatureFlagsManager.tsx      ✅ Gerencia features globais
│       ├── PlanFeaturesEditor.tsx       ✅ Edita features por plano
│       ├── PlatformCompanies.tsx        ⚠️ Só leitura
│       └── PlatformMetrics.tsx          ✅ Métricas
│
└── hooks/
    └── usePlatformAdmin.ts      ✅ Verifica se é super admin
```

### Banco de Dados (Schema)

#### Tabela: `subscription_plans`
```sql
CREATE TABLE subscription_plans (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    price_monthly NUMERIC(10,2) NOT NULL,
    price_yearly NUMERIC(10,2) NOT NULL,
    stripe_price_id_monthly TEXT,
    stripe_price_id_yearly TEXT,
    max_companies INTEGER,
    max_users INTEGER,
    max_conversations INTEGER,
    features JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Tabela: `platform_features`
```sql
CREATE TABLE platform_features (
    id UUID PRIMARY KEY,
    feature_key TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    is_global_enabled BOOLEAN DEFAULT true,
    icon TEXT,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Tabela: `plan_features`
```sql
CREATE TABLE plan_features (
    id UUID PRIMARY KEY,
    plan_id UUID REFERENCES subscription_plans(id),
    feature_id UUID REFERENCES platform_features(id),
    is_enabled BOOLEAN DEFAULT true,
    config JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(plan_id, feature_id)
);
```

#### Tabela: `platform_admins`
```sql
CREATE TABLE platform_admins (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE,
    email TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID
);
```

---

## 🔐 Autenticação e Permissões

### Como funciona o Super Admin:

1. **Função RPC:** `is_platform_admin(_user_id UUID)`
   - Verifica se user_id existe na tabela `platform_admins`
   - Retorna `true` ou `false`

2. **Hook React:** `usePlatformAdmin()`
   - Usa React Query para cachear resultado
   - Verifica automaticamente quando usuário muda

3. **Componente de Proteção:** `SuperAdminGate`
   - Bloqueia acesso à rota se não for super admin
   - Redireciona para `/dashboard`

### RLS Policies:

```sql
-- Apenas platform admins podem ver/gerenciar outros admins
CREATE POLICY "Platform admins can view all admins"
  ON platform_admins FOR SELECT
  USING (is_platform_admin(auth.uid()));

-- Qualquer um pode ver features (para exibir na UI)
CREATE POLICY "Anyone can view features"
  ON platform_features FOR SELECT
  USING (true);

-- Apenas platform admins podem modificar
CREATE POLICY "Platform admins can manage features"
  ON platform_features FOR ALL
  USING (is_platform_admin(auth.uid()));
```

---

## 🎯 Funcionalidades Atuais

### 1. Painel Super Admin (`/super-admin`)

#### Tab: Features Globais
- ✅ Ativar/desativar features globalmente
- ✅ Lista todas as features cadastradas
- ✅ Atualiza em tempo real

#### Tab: Planos
- ✅ Seleciona um plano existente
- ✅ Edita quais features o plano possui
- ✅ Checkbox para habilitar/desabilitar feature
- ❌ **NÃO PERMITE CRIAR novos planos**
- ❌ **NÃO PERMITE EDITAR preços/limites**
- ❌ **NÃO PERMITE DELETAR planos**

**Código atual:**
```typescript
// src/components/super-admin/PlanFeaturesEditor.tsx
export function PlanFeaturesEditor() {
  // Busca planos existentes
  const { data: plans = [] } = useQuery({
    queryKey: ["subscription-plans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscription_plans")
        .select("*")
        .order("price");
      if (error) throw error;
      return data;
    },
  });

  // Apenas EDITA features de planos existentes
  // NÃO HÁ FUNÇÃO PARA CRIAR PLANO
}
```

#### Tab: Empresas
- ✅ Lista todas as empresas cadastradas
- ✅ Mostra logo, nome, data de criação
- ✅ Badge de status (ativa/inativa)
- ❌ **NÃO PERMITE EDITAR empresa**
- ❌ **NÃO PERMITE SUSPENDER/ATIVAR**
- ❌ **NÃO PERMITE DELETAR**
- ❌ **NÃO MOSTRA qual plano a empresa usa**

**Código atual:**
```typescript
// src/components/super-admin/PlatformCompanies.tsx
export function PlatformCompanies() {
  // Apenas SELECT - sem UPDATE/DELETE
  const { data: companies = [] } = useQuery({
    queryKey: ["platform-companies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Renderiza apenas visualização
  return (
    <div>
      {companies.map(company => (
        <div>{company.name}</div> // SEM BOTÕES DE AÇÃO
      ))}
    </div>
  );
}
```

#### Tab: Métricas
- ✅ Exibe métricas da plataforma
- ✅ Quantidade de empresas, usuários, etc.

---

## 🚨 Problemas Identificados

### 1. ❌ Não há dados de planos no banco

**Problema:**
A tabela `subscription_plans` está **VAZIA**. Não há migration com dados iniciais.

**Impacto:**
- Pricing page usa dados hardcoded
- Super admin não consegue editar planos que não existem
- Sistema de assinaturas não funciona

**Solução:**
Criar migration com seed data:

```sql
-- supabase/migrations/XXXXXX_seed_subscription_plans.sql
INSERT INTO subscription_plans (slug, name, price_monthly, price_yearly, max_companies, max_users, max_conversations)
VALUES
  ('starter', 'Starter', 97.00, 931.20, 1, 5, 1000),
  ('professional', 'Professional', 297.00, 2851.20, 3, 15, 5000),
  ('enterprise', 'Enterprise', 697.00, 6691.20, NULL, 50, NULL);
```

### 2. ❌ Não há interface para criar planos

**Problema:**
`PlanFeaturesEditor` só EDITA planos existentes. Não há botão "Criar Novo Plano".

**Impacto:**
Super admin não consegue adicionar novos planos sem SQL direto.

**Solução:**
Criar componente `PlanManager` com formulário CRUD completo.

### 3. ⚠️ Gerenciamento de empresas limitado

**Problema:**
`PlatformCompanies` é apenas visualização. Não há ações.

**Impacto:**
Super admin não consegue:
- Suspender empresa que não pagou
- Editar limites da empresa
- Ver qual plano a empresa usa
- Ver histórico de pagamentos

**Solução:**
Adicionar tabela de ações (editar, suspender, ver detalhes).

### 4. ❌ Não há visualização de assinaturas

**Problema:**
Não existe tab ou componente para ver:
- Quais empresas estão em qual plano
- Status de pagamento
- Upgrades/downgrades
- Receita recorrente (MRR)

**Impacto:**
Super admin não tem visibilidade financeira.

**Solução:**
Criar componente `SubscriptionsOverview`.

---

## 📝 Recomendações de Melhorias

### Prioridade ALTA 🔴

1. **Criar seed data de planos**
   - Migration com 3 planos iniciais
   - Sincronizar com Pricing page

2. **Interface de CRUD de planos**
   - Botão "Criar Novo Plano"
   - Formulário com: nome, slug, preços, limites
   - Editar plano existente
   - Deletar plano (com validação)

3. **Melhorar gerenciamento de empresas**
   - Botão "Editar" em cada empresa
   - Modal com:
     - Trocar plano
     - Suspender/Ativar
     - Editar limites customizados
     - Ver usuários e uso

### Prioridade MÉDIA 🟡

4. **Dashboard de assinaturas**
   - Tab "Assinaturas" no Super Admin
   - Lista empresas com plano atual
   - Status de pagamento
   - Histórico de upgrades
   - Gráfico de MRR (receita mensal)

5. **Auditoria e logs**
   - Registrar mudanças de planos
   - Registrar ações de super admin
   - Visualizar histórico

### Prioridade BAIXA 🟢

6. **Features avançadas**
   - Criar planos customizados por empresa
   - Sistema de cupons/descontos
   - Trials automáticos
   - Notificações de vencimento

---

## 💡 Como Testar Agora

### 1. Criar um Super Admin manualmente:

```sql
-- No Supabase SQL Editor
INSERT INTO platform_admins (user_id, email, is_active)
VALUES (
  'SEU-USER-ID-AQUI', -- Pegue do auth.users
  'seu-email@exemplo.com',
  true
);
```

Para pegar seu user_id:
```sql
SELECT id, email FROM auth.users WHERE email = 'seu-email@exemplo.com';
```

### 2. Criar planos de teste:

```sql
INSERT INTO subscription_plans (slug, name, price_monthly, price_yearly, max_companies, max_users, max_conversations)
VALUES
  ('starter', 'Starter', 97.00, 931.20, 1, 5, 1000),
  ('professional', 'Professional', 297.00, 2851.20, 3, 15, 5000),
  ('enterprise', 'Enterprise', 697.00, 6691.20, NULL, 50, NULL);
```

### 3. Criar features de exemplo:

```sql
INSERT INTO platform_features (feature_key, name, description, category, order_index)
VALUES
  ('chat', 'Chat', 'Sistema de chat integrado', 'communication', 1),
  ('crm', 'CRM', 'Gestão de relacionamento com cliente', 'sales', 2),
  ('automation', 'Automação', 'Workflows automatizados', 'automation', 3),
  ('reports', 'Relatórios', 'Relatórios avançados', 'analytics', 4),
  ('api', 'API Pública', 'Acesso via API', 'integration', 5);
```

### 4. Acessar o painel:

1. Faça login com o usuário que você tornou super admin
2. Vá para: `/super-admin`
3. Teste as 4 tabs:
   - ✅ Features Globais → Funciona
   - ✅ Planos → Funciona (se criou os planos)
   - ✅ Empresas → Funciona (lista apenas)
   - ✅ Métricas → Funciona

---

## 📊 Comparação: O que existe vs O que precisa

| Funcionalidade | Status Atual | O que falta |
|----------------|--------------|-------------|
| **Autenticação Super Admin** | ✅ Completo | - |
| **Ver lista de planos** | ✅ Completo | - |
| **Criar novo plano** | ❌ Não existe | Interface de criação |
| **Editar plano** | ⚠️ Só features | Editar preços/limites |
| **Deletar plano** | ❌ Não existe | Botão + confirmação |
| **Ver empresas** | ✅ Completo | - |
| **Editar empresa** | ❌ Não existe | Modal de edição |
| **Suspender empresa** | ❌ Não existe | Toggle + API |
| **Ver assinaturas** | ❌ Não existe | Tab completa |
| **Histórico financeiro** | ❌ Não existe | Componente novo |
| **Seed data de planos** | ❌ Não existe | Migration |

---

## 🎯 Conclusão

### O sistema tem uma base sólida:
- ✅ Banco de dados bem estruturado
- ✅ Autenticação de super admin funcional
- ✅ RLS policies corretas
- ✅ Componentes React organizados

### Mas precisa de desenvolvimento:
- ❌ Interface CRUD completa de planos
- ❌ Gerenciamento ativo de empresas
- ❌ Dashboard financeiro
- ❌ Dados iniciais (seed)

### Recomendação:
**Implementar as 5 melhorias de prioridade ALTA** para ter um sistema funcional de gestão de planos e empresas no painel de Super Admin.

---

**Próximos passos sugeridos:**
1. Criar migration com seed data
2. Implementar CRUD de planos
3. Melhorar gerenciamento de empresas
4. Adicionar dashboard de assinaturas
