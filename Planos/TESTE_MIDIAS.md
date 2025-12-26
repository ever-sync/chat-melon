# 🧪 GUIA DE TESTE - SISTEMA DE MÍDIAS

## ✅ CHECKLIST PRÉ-TESTE

Antes de testar, verifique se tudo está configurado:

### **1. Verificar Migration Aplicada:**
```bash
# ✅ JÁ EXECUTADO - Migration aplicada com sucesso!
npx supabase db push
```

### **2. Verificar Bucket Criado:**

**Via Dashboard (RECOMENDADO):**
1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. Menu lateral: **Storage**
4. Deve aparecer o bucket `message-media`

**Verificações importantes:**
- ✅ Bucket existe
- ✅ Bucket é público (`public = true`)
- ✅ Limite de 50MB configurado
- ✅ Políticas RLS ativas

---

## 🧪 TESTES A REALIZAR

### **TESTE 1: Enviar Imagem** 📷

**Passo a passo:**
1. Abra o chat no navegador
2. Selecione uma conversa
3. Clique no ícone 📎 (clipe de papel)
4. Selecione uma **imagem JPG/PNG** (máx 50MB)
5. Adicione uma legenda: "Teste de imagem"
6. Clique em "Enviar"

**Resultado esperado:**
- ✅ Barra de progresso aparece
- ✅ Toast: "Fazendo upload do arquivo..."
- ✅ Toast: "Enviando mensagem..."
- ✅ Toast: "Mídia enviada com sucesso!"
- ✅ Imagem aparece no chat
- ✅ Clique na imagem abre em nova aba
- ✅ Botão de download aparece ao passar o mouse

**Como verificar no Storage:**
```
Dashboard > Storage > message-media >
  [company_id]/[conversation_id]/[timestamp]_[random]_[filename].jpg
```

---

### **TESTE 2: Enviar Vídeo** 🎥

**Passo a passo:**
1. Clique no ícone 📎
2. Selecione um **vídeo MP4** (máx 50MB)
3. Legenda: "Teste de vídeo"
4. Enviar

**Resultado esperado:**
- ✅ Upload com progresso
- ✅ Player de vídeo aparece
- ✅ Controles funcionam (play, pause, volume)
- ✅ Barra de tempo funcional

---

### **TESTE 3: Enviar Áudio** 🎵

**Passo a passo:**
1. Clique no ícone 📎
2. Selecione um **áudio MP3/OGG**
3. Enviar

**Resultado esperado:**
- ✅ Player de áudio nativo HTML5
- ✅ Controles funcionam
- ✅ Duração é exibida
- ✅ Possibilidade de avançar/voltar

---

### **TESTE 4: Receber Mídia (WhatsApp → App)** 📱

**Passo a passo:**
1. Do seu celular, envie uma **imagem** para o número conectado no Evolution API
2. Aguarde alguns segundos
3. Verifique o chat no app

**Resultado esperado:**
- ✅ Webhook processa automaticamente
- ✅ Mídia é baixada da Evolution API
- ✅ Upload para Supabase Storage
- ✅ Imagem aparece no chat com URL permanente
- ✅ URL começa com: `https://[seu-projeto].supabase.co/storage/v1/object/public/message-media/...`

**Verificar logs do webhook:**
```
Dashboard > Edge Functions > evolution-webhook > Logs

Procure por:
📥 Baixando mídia: https://...
✅ Mídia armazenada: https://[seu-projeto].supabase.co/storage/...
```

---

### **TESTE 5: Receber Áudio (PTT - Push to Talk)** 🎤

**Passo a passo:**
1. Do celular, envie um **áudio de voz** (segure o microfone no WhatsApp)
2. Verifique o app

**Resultado esperado:**
- ✅ Áudio aparece com player
- ✅ Pode reproduzir o áudio
- ✅ URL permanente no storage

---

### **TESTE 6: Receber Figurinha** 🎨

**Passo a passo:**
1. Do celular, envie uma **figurinha (sticker)**
2. Verifique o app

**Resultado esperado:**
- ✅ Figurinha aparece renderizada
- ✅ Tamanho correto (128x128 ou similar)
- ✅ Armazenada como WebP

---

### **TESTE 7: Enviar Documento (PDF)** 📄

**Passo a passo:**
1. Clique no ícone 📎
2. Selecione um **arquivo PDF**
3. Enviar

**Resultado esperado:**
- ✅ Botão "Abrir documento" aparece
- ✅ Clique abre o PDF em nova aba
- ✅ Download funciona

---

## 🐛 TROUBLESHOOTING

### **Problema 1: "Erro ao fazer upload"**

**Possíveis causas:**
1. Arquivo muito grande (>50MB)
2. Tipo de arquivo não permitido
3. Bucket não existe
4. RLS policy bloqueando

**Solução:**
```sql
-- Verificar bucket
SELECT * FROM storage.buckets WHERE id = 'message-media';

-- Verificar policies
SELECT * FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';

-- Verificar tamanho do arquivo no código
console.log('Tamanho do arquivo:', file.size / 1024 / 1024, 'MB');
```

---

### **Problema 2: "Mídia não aparece no chat"**

**Verificar:**
1. **Console do navegador** (F12) para erros
2. **Network tab** - requisição retornou 200?
3. **Banco de dados** - mensagem foi salva?

```sql
-- Ver últimas mensagens com mídia
SELECT id, content, media_url, media_type, created_at
FROM messages
WHERE media_url IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;
```

---

### **Problema 3: "URL da mídia retorna 404"**

**Causas:**
1. Storage path incorreto
2. Bucket não é público
3. RLS bloqueando acesso

**Solução:**
```sql
-- Tornar bucket público (se não estiver)
UPDATE storage.buckets
SET public = true
WHERE id = 'message-media';

-- Verificar objetos no storage
SELECT name, bucket_id, created_at
FROM storage.objects
WHERE bucket_id = 'message-media'
ORDER BY created_at DESC
LIMIT 10;
```

---

### **Problema 4: "Webhook não baixa mídia recebida"**

**Verificar logs:**
```
Dashboard > Edge Functions > evolution-webhook > Logs

Procure por:
❌ Erro ao baixar mídia: [status] [error]
❌ Erro ao fazer upload: [error]
```

**Verificar se Evolution API está retornando URL:**
```javascript
// No webhook, adicione log
console.log('Evolution API retornou:', {
  imageMessage: message.imageMessage,
  url: message.imageMessage?.url
});
```

---

### **Problema 5: "Player de áudio/vídeo não funciona"**

**Possíveis causas:**
1. MIME type incorreto
2. Arquivo corrompido
3. CORS bloqueado
4. Formato não suportado pelo navegador

**Verificar:**
```javascript
// Console do navegador
const audio = document.querySelector('audio');
console.log('Audio element:', audio);
console.log('Can play type:', audio.canPlayType('audio/mpeg'));
```

**Formatos suportados:**
- ✅ **Áudio:** MP3, OGG, WAV, WebM
- ✅ **Vídeo:** MP4, WebM
- ❌ **Não suportado:** WMV, AVI, FLV

---

## 📊 MONITORAMENTO

### **1. Ver uso de Storage:**

**Dashboard:**
```
Settings > Usage > Storage
```

**SQL:**
```sql
-- Tamanho total usado
SELECT
  bucket_id,
  COUNT(*) as total_files,
  SUM(pg_column_size(metadata)) as total_size_bytes,
  pg_size_pretty(SUM(pg_column_size(metadata))) as total_size
FROM storage.objects
WHERE bucket_id = 'message-media'
GROUP BY bucket_id;
```

---

### **2. Ver mídias por empresa:**

```sql
SELECT
  SPLIT_PART(name, '/', 1) as company_id,
  COUNT(*) as total_files,
  pg_size_pretty(SUM(pg_column_size(metadata))) as total_size
FROM storage.objects
WHERE bucket_id = 'message-media'
GROUP BY SPLIT_PART(name, '/', 1)
ORDER BY COUNT(*) DESC;
```

---

### **3. Ver mídias mais recentes:**

```sql
SELECT
  name,
  created_at,
  metadata->>'mimetype' as mime_type,
  pg_size_pretty(pg_column_size(metadata)) as size
FROM storage.objects
WHERE bucket_id = 'message-media'
ORDER BY created_at DESC
LIMIT 20;
```

---

## 🎯 CHECKLIST FINAL

Após todos os testes, verifique:

- [ ] ✅ Envio de imagem funciona
- [ ] ✅ Envio de vídeo funciona
- [ ] ✅ Envio de áudio funciona
- [ ] ✅ Envio de PDF funciona
- [ ] ✅ Recebimento de imagem funciona
- [ ] ✅ Recebimento de vídeo funciona
- [ ] ✅ Recebimento de áudio (PTT) funciona
- [ ] ✅ Recebimento de figurinha funciona
- [ ] ✅ Player de áudio reproduz
- [ ] ✅ Player de vídeo reproduz
- [ ] ✅ Download de arquivos funciona
- [ ] ✅ URLs são permanentes (não expiram)
- [ ] ✅ Webhook baixa e armazena mídias automaticamente
- [ ] ✅ Storage organizado por empresa/conversa

---

## 🚀 PRÓXIMOS PASSOS

Se tudo funcionou:

1. **Monitorar uso de storage** (evitar surpresas na fatura)
2. **Configurar backup** (opcional)
3. **Implementar limpeza automática** de arquivos antigos (>1 ano)
4. **Adicionar compressão de imagens** (converter para WebP)

---

## 📞 SUPORTE

**Se encontrar problemas:**

1. **Verificar logs:**
   - Console do navegador (F12)
   - Dashboard > Edge Functions > Logs
   - Dashboard > Database > Query Editor (SQL)

2. **Documentação:**
   - `GUIA_MIDIAS.md` - Documentação completa
   - Supabase Storage Docs: https://supabase.com/docs/guides/storage

3. **Comunidade:**
   - Discord do Supabase
   - GitHub Issues

---

**✨ Sistema de Mídias 100% Operacional!**
