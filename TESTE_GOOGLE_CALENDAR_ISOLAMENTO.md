# ✅ Teste: Google Calendar Isolamento por Empresa

## Status: Pronto para Testar! 🚀

A migração foi aplicada com sucesso! Agora você pode testar o isolamento.

## Passo a Passo para Testar

### 1️⃣ Abrir o Sistema

```
URL: http://localhost:5173
```

Faça login com seu usuário.

### 2️⃣ Verificar Empresas Disponíveis

1. Clique no **seletor de empresas** (canto superior)
2. Anote quantas empresas você tem
3. **Importante**: Você precisa ter pelo menos 2 empresas para testar o isolamento

### 3️⃣ Teste na Empresa A

1. **Selecione a Empresa A** no selector
2. Vá em **Settings** → **Integrações** → **Google Calendar**
3. Status deve mostrar: ❌ **Não conectado**
4. Clique em **"Conectar Google Calendar"**
5. **Observe o console do navegador** (F12):
   ```
   📅 Connecting Google Calendar: { userId: '...', companyId: '...' }
   ```
6. Autorize no popup do Google
7. Aguarde a mensagem: "✅ Conectado com sucesso"
8. Status deve mostrar: ✅ **Conectado** (com seu email)

### 4️⃣ Verificar Isolamento (Troca para Empresa B)

1. **Troque para a Empresa B** no selector
2. Vá em **Settings** → **Integrações** → **Google Calendar**
3. ⚠️ **TESTE CRÍTICO**: Status deve mostrar: ❌ **Não conectado**
4. **Observe o console**:
   ```
   🔍 Google Calendar status: {
     userId: '...',
     companyId: 'empresa-b-id',
     connected: false,  // 👈 DEVE SER FALSE!
     email: null
   }
   ```

### 5️⃣ Conectar na Empresa B (Opcional)

1. Ainda na Empresa B, clique em **"Conectar Google Calendar"**
2. Autorize novamente
3. Status deve mostrar: ✅ **Conectado** (na Empresa B)

### 6️⃣ Verificar Independência

1. **Volte para a Empresa A**
2. Status: ✅ **Conectado** (deve continuar)
3. **Troque para Empresa B**
4. Status: ✅ **Conectado** (também deve continuar)
5. **Agora desconecte na Empresa A**
6. **Volte para Empresa B**
7. Status: ✅ **Ainda conectado** (não foi afetado!)

## 🔍 Logs para Observar no Console

### Ao conectar:
```javascript
📅 Connecting Google Calendar: { userId: 'xxx', companyId: 'yyy' }
🔐 OAuth callback received: { userId: 'xxx', companyId: 'yyy' }
📧 User info from Google: { email: 'seu@email.com', ... }
✅ Token salvo com sucesso para empresa: yyy
✅ Google Calendar conectado com sucesso para empresa: yyy
```

### Ao verificar status:
```javascript
🔍 Google Calendar status: {
  userId: 'xxx',
  companyId: 'yyy',
  connected: true,
  email: 'seu@email.com'
}
```

### Ao desconectar:
```javascript
🔌 Disconnecting Google Calendar: { userId: 'xxx', companyId: 'yyy' }
✅ Google Calendar desconectado com sucesso
```

## ✅ Checklist de Sucesso

- [ ] Migration aplicada (tabela `google_calendar_tokens` existe)
- [ ] Conectou na Empresa A com sucesso
- [ ] Trocou para Empresa B e viu status "Não conectado"
- [ ] Console mostra logs corretos com `companyId`
- [ ] Conectou na Empresa B separadamente
- [ ] Desconectou da Empresa A sem afetar Empresa B
- [ ] Nenhum erro no console

## ❌ Problemas Comuns

### Erro: "Could not find the table 'google_calendar_tokens'"
**Solução**: Migration não foi aplicada. Execute novamente.

### Status mostra "Conectado" em todas as empresas
**Causa**: Ainda está usando dados antigos da tabela `profiles`

**Solução**: Limpar dados antigos:
```sql
UPDATE profiles
SET
  google_calendar_connected = false,
  google_calendar_token = null,
  google_calendar_refresh_token = null,
  google_calendar_email = null;
```

### Popup não abre ou fecha imediatamente
**Causa**: Bloqueador de popup do navegador

**Solução**: Permitir popups para `localhost:5173`

### Console não mostra logs
**Causa**: Precisa recarregar a página após aplicar migration

**Solução**: Pressione F5 para recarregar

## 🗄️ Verificar no Banco de Dados

Execute esta query no Supabase SQL Editor para ver as conexões:

```sql
-- Ver todas as conexões do Google Calendar
SELECT
  c.name as empresa,
  p.full_name as usuario,
  gct.google_email,
  gct.connected_at,
  gct.last_sync_at
FROM google_calendar_tokens gct
JOIN companies c ON c.id = gct.company_id
JOIN profiles p ON p.id = gct.user_id
ORDER BY gct.connected_at DESC;
```

### Resultado Esperado:

Se você conectou em 2 empresas, deve ver 2 linhas:

```
┌──────────────┬─────────────┬──────────────────┬─────────────────────┬──────────────┐
│   empresa    │   usuario   │  google_email    │   connected_at      │ last_sync_at │
├──────────────┼─────────────┼──────────────────┼─────────────────────┼──────────────┤
│ Empresa A    │ Seu Nome    │ seu@gmail.com    │ 2025-12-27 17:30:00 │ NULL         │
│ Empresa B    │ Seu Nome    │ seu@gmail.com    │ 2025-12-27 17:35:00 │ NULL         │
└──────────────┴─────────────┴──────────────────┴─────────────────────┴──────────────┘
```

## 📊 Fluxo Visual do Teste

```
┌─────────────────────────────────────────────────────────┐
│ 1. Login no Sistema                                     │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 2. Selecionar Empresa A                                 │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 3. Settings → Google Calendar → Conectar                │
│    Status: ❌ Não conectado → ✅ Conectado              │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 4. Trocar para Empresa B                                │
│    🔍 TESTE CRÍTICO: Status deve ser ❌ Não conectado   │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 5. Conectar também na Empresa B (opcional)              │
│    Status: ❌ Não conectado → ✅ Conectado              │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 6. Voltar para Empresa A e desconectar                  │
│    Status: ✅ Conectado → ❌ Não conectado              │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 7. Verificar Empresa B                                  │
│    🔍 TESTE: Status deve continuar ✅ Conectado         │
│    (não foi afetado pela desconexão da Empresa A)       │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ ✅ SUCESSO: Isolamento funcionando!                     │
└─────────────────────────────────────────────────────────┘
```

## 🎯 Resultado Final Esperado

Após todos os testes, você deve ter:

1. ✅ Google Calendar funcionando
2. ✅ Isolamento por empresa confirmado
3. ✅ Cada empresa com sua própria conexão
4. ✅ Desconexão em uma empresa não afeta outras
5. ✅ Logs corretos no console mostrando `companyId`
6. ✅ Dados corretos na tabela `google_calendar_tokens`

---

**Tudo certo?** 🚀 Se todos os testes passarem, o isolamento está funcionando perfeitamente!

**Problemas?** 🐛 Me avise qual teste falhou e te ajudo a resolver!
