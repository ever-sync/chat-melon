# 🔧 Troubleshooting - Erro 403 ao Criar Instância

## ❌ O Erro

```
Failed to load resource: the server responded with a status of 403
Erro 403: API Key inválida ou sem permissão
```

## 🔍 Causas Possíveis

### 1. API Key Incorreta ou Expirada

**Sintoma:** Erro 403 imediato ao criar instância

**Solução:**

1. Verifique se a API Key está correta no `.env`:
   ```bash
   VITE_EVOLUTION_API_KEY=d2a0995484bd8fd1039d9a119c7c39e4
   ```

2. Se mudou a key, **reinicie o servidor de desenvolvimento**:
   ```bash
   npm run dev
   ```

3. Teste a API Key manualmente:
   ```bash
   curl -X GET "https://api.eversync.com.br/instance/fetchInstances" \
     -H "apikey: d2a0995484bd8fd1039d9a119c7c39e4"
   ```

   **Resposta esperada:** Lista de instâncias (pode ser vazia `[]`)

   **Se der 403:** A API Key está errada!

---

### 2. Instância com Nome Duplicado

**Sintoma:** Erro 403 ou 400 dizendo "already exists"

**Solução Automática:** O código agora deleta automaticamente instâncias antigas antes de criar nova.

**Solução Manual:**

1. Liste todas as instâncias:
   ```bash
   curl -X GET "https://api.eversync.com.br/instance/fetchInstances" \
     -H "apikey: d2a0995484bd8fd1039d9a119c7c39e4"
   ```

2. Delete a instância antiga:
   ```bash
   curl -X DELETE "https://api.eversync.com.br/instance/delete/30497794000101" \
     -H "apikey: d2a0995484bd8fd1039d9a119c7c39e4"
   ```

3. Tente criar novamente

---

### 3. Limite de Instâncias Atingido

**Sintoma:** Erro 403 com mensagem sobre limite

**Solução:**

1. Verifique quantas instâncias você tem:
   ```bash
   curl -X GET "https://api.eversync.com.br/instance/fetchInstances" \
     -H "apikey: d2a0995484bd8fd1039d9a119c7c39e4"
   ```

2. Delete instâncias não usadas:
   ```bash
   curl -X DELETE "https://api.eversync.com.br/instance/delete/NOME_INSTANCIA" \
     -H "apikey: d2a0995484bd8fd1039d9a119c7c39e4"
   ```

3. Ou entre em contato com o provedor da Evolution API para aumentar o limite

---

### 4. Servidor Evolution API com Problema

**Sintoma:** Erro 403 intermitente ou depois de funcionar antes

**Solução:**

1. Verifique se a Evolution API está online:
   ```bash
   curl https://api.eversync.com.br
   ```

2. Tente em alguns minutos

3. Entre em contato com o suporte da Evolution API

---

## ✅ Solução Rápida (90% dos casos)

### Opção 1: Deletar Tudo e Começar do Zero

Execute no PowerShell:

```powershell
# 1. Deletar instância antiga
$API_URL = "https://api.eversync.com.br"
$API_KEY = "d2a0995484bd8fd1039d9a119c7c39e4"
$INSTANCE = "30497794000101"

# Listar instâncias
Invoke-RestMethod -Uri "$API_URL/instance/fetchInstances" -Headers @{"apikey"=$API_KEY}

# Deletar instância específica
Invoke-RestMethod -Uri "$API_URL/instance/delete/$INSTANCE" -Method Delete -Headers @{"apikey"=$API_KEY}

# Aguardar 2 segundos
Start-Sleep -Seconds 2

# Criar nova instância (use a interface da aplicação depois disso)
```

### Opção 2: Usar Interface da Aplicação

1. **Recarregue a página** (Ctrl+F5 para limpar cache)

2. Tente **criar a instância novamente**

3. O código agora **deleta automaticamente** instâncias antigas!

---

## 🧪 Como Testar se a API Key Funciona

### Teste 1: Listar Instâncias

```bash
curl -X GET "https://api.eversync.com.br/instance/fetchInstances" \
  -H "apikey: d2a0995484bd8fd1039d9a119c7c39e4"
```

**✅ Sucesso:** Retorna array (vazio ou com instâncias)
**❌ Falha:** Retorna 403 → API Key errada!

### Teste 2: Criar Instância de Teste

```bash
curl -X POST "https://api.eversync.com.br/instance/create" \
  -H "Content-Type: application/json" \
  -H "apikey: d2a0995484bd8fd1039d9a119c7c39e4" \
  -d '{
    "instanceName": "TESTE_123",
    "qrcode": true
  }'
```

**✅ Sucesso:** Retorna dados da instância com QR Code
**❌ Falha 403:** API Key errada
**❌ Falha 400:** Instância já existe

### Teste 3: Deletar Instância de Teste

```bash
curl -X DELETE "https://api.eversync.com.br/instance/delete/TESTE_123" \
  -H "apikey: d2a0995484bd8fd1039d9a119c7c39e4"
```

**✅ Sucesso:** `{"message":"Instance deleted"}`

---

## 📞 Quando Entrar em Contato com Suporte

Se nada funcionar, colete estas informações:

1. **Logs do Console** (F12 → Console):
   - Copie todos os logs que começam com 🔄, ❌, etc.

2. **Resposta da API**:
   ```bash
   curl -v -X GET "https://api.eversync.com.br/instance/fetchInstances" \
     -H "apikey: d2a0995484bd8fd1039d9a119c7c39e4" 2>&1 | tee evolution-debug.log
   ```

3. **Variáveis de Ambiente**:
   - `VITE_EVOLUTION_API_URL`: https://api.eversync.com.br
   - `VITE_EVOLUTION_API_KEY`: (primeiros 10 caracteres)

4. **Mensagem de Erro Completa**

---

## 🔄 Mudanças Recentes no Código

O código foi atualizado para:

1. ✅ **Deletar automaticamente** instâncias antigas antes de criar nova
2. ✅ **Configurar webhook automaticamente** ao criar instância
3. ✅ **Mensagens de erro mais claras** (403 = API Key inválida)
4. ✅ **Logs detalhados** no console para debug

---

## 💡 Dica Pro

**Sempre verifique os logs do console (F12)** - eles mostram exatamente o que está acontecendo!

Procure por:
- 🔑 API Key (primeiros caracteres)
- 📍 URL sendo chamada
- 📊 Status da resposta (403, 400, 200, etc.)
- ❌ Mensagem de erro completa

---

**Boa sorte!** 🚀

Se o erro persistir, mande um print dos logs do console que eu te ajudo!
