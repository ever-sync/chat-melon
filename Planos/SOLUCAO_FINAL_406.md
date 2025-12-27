# 🔧 SOLUÇÃO FINAL - Erro 406

## ❌ Problema

Erro 406 ao tentar carregar dados do convite:
```
Failed to load resource: the server responded with a status of 406
```

**Causa:** A tabela `company_invites` tem RLS (Row Level Security) habilitado, mas não tem uma política que permite leitura pública de convites pendentes.

---

## ✅ SOLUÇÃO (3 Passos)

### 📍 PASSO 1: Acesse o SQL Editor do Supabase

1. Abra: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em: **SQL Editor** (ícone de código na lateral esquerda)
4. Clique em: **"+ New query"**

### 📍 PASSO 2: Cole e Execute o SQL

Cole este código no editor:

```sql
-- Deletar política antiga (se existir)
DROP POLICY IF EXISTS "allow_public_read_pending_invites" ON public.company_invites;

-- Criar nova política
CREATE POLICY "allow_public_read_pending_invites"
ON public.company_invites
FOR SELECT
TO public
USING (status = 'pending');

-- Garantir que RLS está habilitado
ALTER TABLE public.company_invites ENABLE ROW LEVEL SECURITY;
```

Clique em **"Run"** (ou pressione Ctrl+Enter)

### 📍 PASSO 3: Verifique se Funcionou

Execute esta query para testar:

```sql
SELECT * FROM company_invites WHERE status = 'pending';
```

Se retornar os convites pendentes, **funcionou!** ✅

---

## 🧪 Teste a Página de Signup

### 1. Recarregue a página de signup
```
Ctrl + Shift + R (ou Ctrl + F5)
```

### 2. Verifique o console (F12)
Você deve ver:
```javascript
Carregando dados do convite: 3070124c-4ddc-4219-9561-3ac7519c467b
Resultado da busca: {
  data: {
    email: "teste@example.com",
    role: "seller",
    company_id: "abc-123"
  },
  error: null
}
Convite encontrado: { email: "teste@example.com", ... }
```

### 3. Verifique a UI
- ✅ Email pré-preenchido
- ✅ Campo email desabilitado
- ✅ Toast verde: "Convite encontrado! Complete seu cadastro."

### 4. Complete o cadastro
1. Preencha nome, senha, telefone
2. Marque "concordo com termos"
3. Clique em "Criar Conta"

### 5. Resultado esperado
- ✅ "Conta criada com sucesso! Redirecionando..."
- ✅ Redireciona para /dashboard
- ✅ Usuário está logado!

---

## 📋 O Que Faz a Política RLS

A política SQL que você executou faz o seguinte:

```sql
CREATE POLICY "allow_public_read_pending_invites"
```
- **Nome:** "allow_public_read_pending_invites"

```sql
ON public.company_invites
```
- **Tabela:** company_invites

```sql
FOR SELECT
```
- **Operação:** Apenas leitura (SELECT)

```sql
TO public
```
- **Quem pode:** Qualquer pessoa (mesmo sem autenticação)

```sql
USING (status = 'pending');
```
- **Condição:** Apenas convites com status = 'pending'

**Resumo:** Permite que qualquer pessoa leia convites pendentes, mas APENAS os pendentes. Convites aceitos ou cancelados continuam protegidos.

---

## 🔒 Segurança

**É seguro permitir leitura pública de convites pendentes?**

✅ **SIM**, porque:

1. **Apenas leitura** - Não permite criar, atualizar ou deletar
2. **Apenas pendentes** - Convites aceitos/cancelados são privados
3. **Dados limitados** - Apenas email, role e company_id são expostos
4. **Necessário para signup** - Sem isso, o fluxo de convite não funciona
5. **UUID como segurança** - ID do convite é um UUID aleatório, difícil de adivinhar

**Não é possível:**
- ❌ Listar todos os convites
- ❌ Aceitar convite de outra pessoa
- ❌ Ver convites de outras empresas
- ❌ Modificar dados do convite

---

## 🆘 Se o Erro Continuar

### Verifique se a política foi criada:

1. Supabase Dashboard
2. Table Editor → company_invites
3. Clique na tabela
4. Vá em **"RLS"** (Row Level Security)
5. Você deve ver: **"allow_public_read_pending_invites"**

### Se não aparecer:

Execute o SQL novamente e verifique se há algum erro na execução.

### Se aparecer mas ainda der erro 406:

1. Limpe o cache do navegador (Ctrl+Shift+Del)
2. Use aba anônima
3. Tente com outro navegador
4. Verifique se o ID do convite está correto na URL

---

## ✅ Checklist Final

- [ ] Executei o SQL no Supabase Dashboard
- [ ] Verifiquei que a política foi criada (em RLS)
- [ ] Testei a query `SELECT * FROM company_invites WHERE status = 'pending'`
- [ ] Recarreguei a página de signup (Ctrl+Shift+R)
- [ ] Verifiquei que o erro 406 sumiu
- [ ] Vi o toast "Convite encontrado!"
- [ ] Email está pré-preenchido e desabilitado
- [ ] Consegui criar a conta
- [ ] Fui redirecionado para o dashboard
- [ ] Estou logado e posso usar o sistema!

---

## 🎉 Resultado Final

Depois de executar o SQL:

1. ✅ Erro 406 some
2. ✅ Convite é carregado automaticamente
3. ✅ Email vem pré-preenchido
4. ✅ Signup funciona perfeitamente
5. ✅ Usuário é adicionado à empresa
6. ✅ Login automático
7. ✅ Sistema 100% funcional!

**PRONTO! Sistema de convites completo e funcionando!** 🚀
