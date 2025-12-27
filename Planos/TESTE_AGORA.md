# ✅ TESTE O SISTEMA AGORA!

## 🔧 Correções Aplicadas

1. ✅ Mudou `.single()` para `.maybeSingle()` para evitar erro 406
2. ✅ Adicionado logs detalhados no console
3. ✅ Melhor tratamento de erros

---

## 🧪 Como Testar

### 1️⃣ Recarregue a Página
- Pressione **Ctrl + Shift + R** (recarregar forçado)
- Ou **Ctrl + F5**

### 2️⃣ Verifique o Console
- Pressione **F12** para abrir DevTools
- Vá na aba **Console**
- Procure por:
  ```
  Carregando dados do convite: 3070124c-4ddc-4219-9561-3ac7519c467b
  Resultado da busca: { data: {...}, error: null }
  Convite encontrado: { email: "...", role: "...", company_id: "..." }
  ```

### 3️⃣ Verifique a UI
Você deve ver:
- ✅ Email pré-preenchido
- ✅ Campo email desabilitado (cinza)
- ✅ Texto: "(do convite)"
- ✅ Mensagem: "Este email foi pré-definido pelo convite que você recebeu"
- ✅ Toast verde: "Convite encontrado! Complete seu cadastro."

### 4️⃣ Complete o Cadastro
1. Preencha o **Nome Completo**
2. Preencha a **Senha** (mínimo 6 caracteres)
3. Preencha o **Telefone**
4. Marque **"Eu concordo com os Termos de Uso e Política de Privacidade"**
5. Clique em **"Criar Conta"**

### 5️⃣ Aguarde o Processamento
Você deve ver no console:
```
Processando convite: 3070124c-4ddc-4219-9561-3ac7519c467b
Resultado da busca: { data: {...}, error: null }
```

E então uma das seguintes mensagens:
- ✅ **Sucesso:** "Conta criada com sucesso! Redirecionando..."
- ❌ **Erro:** Mensagem específica do erro

---

## 🔍 Se Der Erro 406 Ainda

O erro 406 pode significar que há um problema de **RLS (Row Level Security)** na tabela `company_invites`.

### Solução: Verificar RLS no Supabase

1. Acesse: **Supabase Dashboard**
2. Vá em: **Table Editor** → **company_invites**
3. Clique em **RLS** (Row Level Security)
4. Verifique se há uma política que permite **SELECT público**

### Política Necessária:

```sql
-- Permitir que qualquer pessoa leia convites pendentes
CREATE POLICY "Permitir leitura de convites pendentes"
ON company_invites
FOR SELECT
USING (status = 'pending');
```

---

## 📊 O Que Esperar no Console

### ✅ Sucesso (o que você DEVE ver):
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

### ❌ Erro 406 (se ainda acontecer):
```javascript
Carregando dados do convite: 3070124c-4ddc-4219-9561-3ac7519c467b
Resultado da busca: {
  data: null,
  error: { code: "PGRST116", details: "...", hint: "..." }
}
```

Se ver isso, o problema é RLS!

---

## 🚨 Solução Rápida para RLS

Se o erro 406 continuar, execute este SQL no Supabase:

### 1. Vá em SQL Editor:
```
Supabase Dashboard → SQL Editor
```

### 2. Execute este SQL:
```sql
-- Criar política para permitir leitura pública de convites pendentes
CREATE POLICY IF NOT EXISTS "allow_public_read_pending_invites"
ON public.company_invites
FOR SELECT
TO public
USING (status = 'pending');

-- Habilitar RLS na tabela (se ainda não estiver)
ALTER TABLE public.company_invites ENABLE ROW LEVEL SECURITY;
```

### 3. Clique em **Run**

### 4. Recarregue a página de signup

---

## ✨ Resultado Esperado Final

1. ✅ Página carrega com email pré-preenchido
2. ✅ Toast verde: "Convite encontrado!"
3. ✅ Usuário preenche nome, senha, telefone
4. ✅ Clica em "Criar Conta"
5. ✅ Toast verde: "Conta criada com sucesso! Redirecionando..."
6. ✅ Após 1.5 segundos → Redireciona para /dashboard
7. ✅ Usuário está logado e pode usar o sistema!

---

## 📞 Me Avise

Depois de testar, me diga:

1. O erro 406 sumiu? ✅ ou ❌
2. O convite foi carregado? ✅ ou ❌
3. Conseguiu criar a conta? ✅ ou ❌
4. Foi redirecionado para o dashboard? ✅ ou ❌

Se algo não funcionou, envie print do console (F12)!
