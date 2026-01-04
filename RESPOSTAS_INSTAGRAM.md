# Respostas - Instagram

## 1. ✅ Nome do usuário do Instagram

**Resposta:** SIM, o webhook JÁ busca o nome real do usuário!

### Como funciona:

Quando uma nova mensagem chega, o webhook:
1. Busca o perfil do usuário na API do Instagram
2. Pega o `name` ou `username` do perfil
3. Salva no contato

**Código (instagram-webhook/index.ts, linhas 155-162):**
```typescript
const profileRes = await fetch(
    `https://graph.facebook.com/v18.0/${senderId}?fields=name,username,profile_pic&access_token=${accessToken}`
);
const profile = await profileRes.json();
userName = profile.name || profile.username || userName;
profilePic = profile.profile_pic;
```

### Por que está mostrando "Instagram User 7890"?

Se está mostrando esse nome genérico, pode ser:

**Causa 1: API não retorna nome (conta privada ou sem permissão)**
- Alguns perfis do Instagram não permitem acesso ao nome via API
- Solução: Funcionalidade normal, é limitação do Instagram

**Causa 2: Token sem permissões**
- O token pode não ter a permissão `instagram_basic`
- Solução: Reconectar o canal pelo OAuth

**Causa 3: Erro na API**
- A API do Instagram pode ter falhado momentaneamente
- Solução: Próxima mensagem tentará buscar novamente

### Como verificar nos logs:

No Supabase, procure por:
```
✅ Sucesso:
📸 Got profile: [Nome Real do Usuário]

❌ Erro:
⚠️ Could not fetch profile, status: 403
⚠️ Error fetching Instagram profile: [erro]
```

### Solução se não estiver funcionando:

1. **Verificar permissões do token:**
```sql
SELECT
    credentials->>'page_access_token' as token_exists,
    credentials
FROM channels
WHERE type = 'instagram';
```

2. **Testar chamada da API manualmente:**
```bash
curl "https://graph.facebook.com/v18.0/[SENDER_ID]?fields=name,username,profile_pic&access_token=[TOKEN]"
```

3. **Reconectar o canal** se necessário (desconectar e conectar novamente)

---

## 2. ✅ Canal vinculado automaticamente à empresa

**Resposta:** SIM! O canal é AUTOMATICAMENTE vinculado à empresa correta.

### Como funciona:

**Passo 1: Frontend solicita URL do OAuth**
```javascript
POST /functions/v1/meta-oauth
{
  "action": "get_auth_url",
  "companyId": "61215833-73aa-49c6-adcc-790b9d11fd30"  // ← Empresa do usuário
}
```

**Passo 2: OAuth cria URL com company_id no state**
```javascript
const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?
  client_id=${FB_APP_ID}&
  redirect_uri=${REDIRECT_URI}&
  state=${companyId}&  // ← Company ID vai aqui
  scope=${scopes}&
  response_type=code`;
```

**Passo 3: Facebook redireciona de volta**
```
GET /functions/v1/meta-oauth?code=ABC123&state=61215833-73aa-49c6-adcc-790b9d11fd30
                                                    ↑
                                            Company ID de volta
```

**Passo 4: OAuth cria canal com company_id correto**
```typescript
await supabase.from('channels').upsert({
    company_id: callbackState,  // ← Company ID do state
    type: 'instagram',
    name: insta.username,
    external_id: insta.id,
    credentials: {...},
    status: 'connected'
});
```

### Garantia de segurança:

✅ O `company_id` vem do **frontend autenticado**
✅ O `state` é **preservado** pelo Facebook durante todo o fluxo OAuth
✅ Impossível criar canal em empresa errada (a menos que o usuário mude de empresa no meio do processo)

### Fluxo completo:

```
1. Usuário clica em "Conectar Instagram" na empresa A
2. Frontend pega company_id da empresa A
3. OAuth gera URL com state=company_id_A
4. Usuário autoriza no Facebook
5. Facebook redireciona com state=company_id_A
6. OAuth cria canal vinculado à empresa A
✅ Canal sempre vinculado à empresa correta!
```

---

## 🔍 Verificações Úteis

### Ver nome dos contatos Instagram:
```sql
SELECT
    name,
    external_id,
    profile_picture_url,
    created_at
FROM contacts
WHERE channel_type = 'instagram'
ORDER BY created_at DESC;
```

### Ver qual empresa está conectada ao canal:
```sql
SELECT
    ch.name as canal,
    ch.company_id,
    co.name as empresa
FROM channels ch
LEFT JOIN companies co ON co.id = ch.company_id
WHERE ch.type = 'instagram';
```

### Ver logs do webhook (busca de perfil):
No Supabase Logs, filtre por:
- `Got profile:` - Sucesso
- `Could not fetch profile` - Erro na API
- `Error fetching Instagram profile` - Exceção

---

## 📊 Status Atual

| Item | Status | Nota |
|------|--------|------|
| Nome do usuário sendo buscado | ✅ | Código implementado |
| Foto de perfil sendo buscada | ✅ | Código implementado |
| Canal vinculado à empresa | ✅ | Automático via OAuth state |
| Permissões necessárias | ✅ | `instagram_basic`, `instagram_manage_messages` |

---

## 🚀 Melhorias Futuras (Opcional)

### 1. Atualizar nome de contatos antigos
```sql
-- Contatos com nome genérico que podem ser atualizados
SELECT
    id,
    name,
    external_id
FROM contacts
WHERE channel_type = 'instagram'
  AND name LIKE 'Instagram User %';
```

### 2. Retry automático se API falhar
Adicionar retry na busca do perfil (não implementado ainda)

### 3. Cache de perfis
Evitar buscar o mesmo perfil múltiplas vezes (não implementado ainda)

---

**Resumo:**
1. ✅ **Nome do usuário:** JÁ é buscado automaticamente (se a API do Instagram permitir)
2. ✅ **Vínculo à empresa:** SEMPRE automático via OAuth state
3. ✅ **Seguro:** Impossível criar canal em empresa errada
