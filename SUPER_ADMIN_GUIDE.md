# 🎯 Guia Rápido: Administração de Planos

## ✅ O que foi implementado

### 1. **SQL Migration - Catálogo Completo de Features**
📁 `supabase/migrations/20251217000001_full_access_plan.sql`

- ✅ 33 features catalogadas e inseridas
- ✅ Plano "Full Access" criado (ID: `44444444-4444-4444-4444-444444444444`)
- ✅ Todas as features vinculadas automaticamente ao plano

### 2. **Interface de Administração Aprimorada**
📁 `src/components/super-admin/PlatformCompanies.tsx`

- ✅ Dropdown para trocar planos de empresas
- ✅ Visualização do plano atual
- ✅ Atualização em tempo real
- ✅ Feedback visual (loading states)

---

## 🚀 Como Usar

### Passo 1: Aplicar a Migration
Copie o conteúdo de `supabase/migrations/20251217000001_full_access_plan.sql` e execute no **SQL Editor** do Supabase Dashboard.

### Passo 2: Acessar o Painel Super Admin
1. Navegue para `/super-admin`
2. Vá para a aba **"Empresas"**

### Passo 3: Trocar o Plano de uma Empresa
1. Localize a empresa na lista
2. Use o dropdown ao lado direito
3. Selecione o plano desejado (ex: "Full Access")
4. Aguarde a confirmação "Plano atualizado com sucesso!"

---

## 📋 Planos Disponíveis

| Plano | ID | Descrição |
|:------|:---|:----------|
| **Starter** | `11111111-1111-1111-1111-111111111111` | Plano básico com features limitadas |
| **Professional** | `22222222-2222-2222-2222-222222222222` | Plano intermediário com mais recursos |
| **Enterprise** | `33333333-3333-3333-3333-333333333333` | Plano avançado com quase tudo |
| **Full Access** | `44444444-4444-4444-4444-444444444444` | **NOVO** - Todas as 33 features habilitadas |

---

## 🔍 Verificação

### Como verificar se funcionou:
1. Atribua o plano "Full Access" a uma empresa de teste
2. Faça login como usuário dessa empresa
3. Verifique na sidebar: **todos** os módulos devem estar visíveis
4. No Super Admin > Features, desabilite uma feature globalmente
5. Verifique que ela sumiu mesmo com "Full Access"

---

## ⚙️ Customização Futura

### Para criar novos planos:
1. Insira na tabela `subscription_plans`
2. Vincule features em `plan_features`
3. O dropdown no Super Admin exibirá automaticamente

### Para adicionar novas features:
1. Insira em `platform_features` com `feature_key` único
2. Adicione no array `FeatureKey` em `src/hooks/useFeatureFlags.ts`
3. Proteja rotas/componentes com `<FeatureGate feature="nova_feature">`
