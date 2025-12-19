# 📱 GUIA COMPLETO - MÍDIAS NO MELONCHAT

## ✅ O QUE FOI IMPLEMENTADO

### 1. **Supabase Storage (Bucket `message-media`)**
- ✅ Armazenamento de até **50MB por arquivo**
- ✅ Suporte a: Imagens, Vídeos, Áudios, Documentos, Figurinhas
- ✅ URLs públicas e permanentes
- ✅ RLS (Row Level Security) configurado

### 2. **Envio de Mídias (Frontend)**
- ✅ Upload otimizado (não usa Base64)
- ✅ Barra de progresso
- ✅ Preview de imagens
- ✅ Validação de tamanho e tipo
- ✅ Suporte a legendas

### 3. **Recebimento de Mídias (Webhook)**
- ✅ Download automático de mídias da Evolution API
- ✅ Armazenamento no Supabase Storage
- ✅ URLs permanentes (não expiram)
- ✅ Suporte a todos os tipos de mídia

### 4. **Visualização (MessageBubble)**
- ✅ Player de áudio nativo HTML5
- ✅ Player de vídeo nativo
- ✅ Visualização de imagens (clique para ampliar)
- ✅ Download de arquivos
- ✅ Lazy loading para performance

---

## 🚀 COMO USAR

### **Enviar Mídia**

1. **No Chat:**
   - Clique no ícone 📎 (clipe)
   - Selecione o arquivo (máx 50MB)
   - Adicione legenda (opcional)
   - Clique em "Enviar"

2. **Tipos Suportados:**
   - **Imagens:** JPEG, PNG, GIF, WebP
   - **Vídeos:** MP4, WebM, QuickTime
   - **Áudios:** MP3, OGG, WAV, WebM
   - **Documentos:** PDF, Word, Excel

### **Receber Mídia**

1. Quando alguém envia mídia pelo WhatsApp:
   - ✅ Webhook detecta automaticamente
   - ✅ Faz download da mídia
   - ✅ Armazena no Supabase Storage
   - ✅ Salva URL permanente no banco

2. **Visualização:**
   - Imagens: Clique para ampliar
   - Vídeos: Player embutido
   - Áudios: Player com controles
   - Documentos: Botão para abrir/baixar

---

## 📂 ESTRUTURA DE ARMAZENAMENTO

```
message-media/
├── {company_id}/
│   ├── {conversation_id}/
│   │   ├── 1734567890_abc123_image.jpg
│   │   ├── 1734567891_def456_video.mp4
│   │   ├── 1734567892_ghi789_audio.ogg
│   └── {contact_number}/
│       └── 1734567893_jkl012_sticker.webp
```

**Organização:**
- Por empresa (`company_id`)
- Por conversa ou contato
- Nome único: `timestamp_random_filename.ext`

---

## 🔧 TECNOLOGIAS USADAS

### **Backend (Edge Functions)**
```typescript
// supabase/functions/evolution-webhook/index.ts
- Download de mídias remotas
- Upload para Supabase Storage
- Geração de URLs públicas
```

### **Frontend (React)**
```typescript
// src/services/mediaStorage.ts
- Upload otimizado de arquivos
- Validação de tipo e tamanho
- Progress tracking
```

### **Database (Supabase)**
```sql
-- Bucket público para fácil acesso
CREATE BUCKET message-media (public=true)

-- RLS para segurança
- Company members podem fazer upload
- Service role (webhooks) pode fazer upload
- Qualquer um pode visualizar (bucket público)
```

---

## 🎯 MELHOR PRÁTICA: HOSPEDAGEM DE ARQUIVOS

### **Por que Supabase Storage é a melhor opção?**

#### ✅ **Vantagens:**

1. **Integrado ao seu stack:**
   - Mesma infraestrutura do banco
   - Autenticação unificada
   - Sem necessidade de API keys extras

2. **Custo-benefício:**
   - **Plano Free:** 1GB grátis
   - **Plano Pro ($25/mês):** 100GB inclusos
   - Adicional: $0.021/GB/mês
   - CDN global incluído

3. **Performance:**
   - CDN global (EdgeBit)
   - Compressão automática
   - Cache inteligente
   - Lazy loading

4. **Segurança:**
   - RLS (Row Level Security)
   - Autenticação JWT
   - CORS configurável
   - Policies granulares

5. **Simplicidade:**
   - API simples e consistente
   - SDK JavaScript/TypeScript
   - URLs públicas diretas
   - Sem complexidade de configuração

#### ⚖️ **Comparação com outras opções:**

| Serviço | Custo | Pros | Contras |
|---------|-------|------|---------|
| **Supabase Storage** | $0.021/GB | Integrado, CDN, RLS | Limite 50MB/arquivo |
| **AWS S3** | $0.023/GB | Escalável, confiável | Complexo, requer AWS CLI |
| **Cloudflare R2** | $0.015/GB | Mais barato | Sem CDN nativo, setup manual |
| **Google Cloud Storage** | $0.020/GB | Confiável | Complexo, custos variáveis |
| **Azure Blob** | $0.018/GB | Integração Microsoft | Interface complicada |

#### 🚫 **Evite:**

1. **Base64 em mensagens:**
   - ❌ Aumenta tamanho em 33%
   - ❌ Sobrecarga no banco
   - ❌ Lento para carregar
   - ❌ Limite de tamanho do Postgres

2. **URLs externas não confiáveis:**
   - ❌ Evolution API: URLs expiram em 24h
   - ❌ WhatsApp CDN: Pode ser bloqueado
   - ❌ Links temporários

3. **Storage local (servidor):**
   - ❌ Não escala
   - ❌ Backup manual
   - ❌ Sem CDN

---

## 📊 ESTIMATIVA DE CUSTOS

### **Cenário: 1000 mensagens/dia com mídia**

```
Mídias por dia: 1000
Tamanho médio: 2MB
Storage mensal: 60GB

Custo Supabase Pro:
- Plano base: $25/mês (100GB inclusos)
- Storage usado: 60GB (dentro do limite)
- Total: $25/mês ✅

Custo AWS S3 (comparação):
- Storage: 60GB × $0.023 = $1.38/mês
- Requests: $0.05/mês
- Transferência: ~100GB × $0.09 = $9/mês
- Total: ~$10.43/mês
- Mas requer: EC2 instance (~$30/mês) = $40/mês total ❌
```

**Conclusão:** Supabase é mais econômico e simples!

---

## 🐛 TROUBLESHOOTING

### **Problema: Upload falha**
```
Erro: "Arquivo muito grande"
Solução: Máximo 50MB. Para arquivos maiores:
1. Comprimir antes de enviar
2. Ou aumentar limite no bucket:
   ALTER BUCKET message-media SET file_size_limit = 104857600; -- 100MB
```

### **Problema: Mídia não aparece**
```
Verificar:
1. Bucket existe? SELECT * FROM storage.buckets WHERE id = 'message-media';
2. RLS policies? SELECT * FROM pg_policies WHERE tablename = 'objects';
3. URL pública? Deve começar com: https://[projeto].supabase.co/storage/v1/object/public/
```

### **Problema: Webhook não baixa mídia**
```
Logs da Edge Function:
npx supabase functions logs evolution-webhook --tail

Verificar:
- ✅ Evolution API retornou URL?
- ✅ Fetch funcionou? (status 200)
- ✅ Upload no storage funcionou?
- ✅ mediaStoragePath foi salvo no banco?
```

---

## 🔄 MIGRAÇÃO DE DADOS ANTIGOS (Se necessário)

Se você tem mensagens antigas com URLs temporárias:

```sql
-- 1. Identificar mensagens com URLs externas
SELECT id, media_url
FROM messages
WHERE media_url IS NOT NULL
  AND media_url NOT LIKE '%supabase.co%'
LIMIT 10;

-- 2. Re-download e upload (via script ou função)
-- Execute via Edge Function ou script Node.js
```

---

## 📝 PRÓXIMOS PASSOS (Melhorias Futuras)

### **Curto Prazo:**
- [ ] Compressão automática de imagens (WebP)
- [ ] Thumbnails para vídeos
- [ ] Preview de PDFs inline

### **Médio Prazo:**
- [ ] Detecção de duplicatas (hash de arquivo)
- [ ] Limpeza automática de arquivos antigos (> 1 ano)
- [ ] Analytics de storage (uso por empresa)

### **Longo Prazo:**
- [ ] CDN personalizado (Cloudflare)
- [ ] Backup automático (S3 Glacier)
- [ ] Watermark em imagens

---

## 🎓 REFERÊNCIAS

- [Supabase Storage Docs](https://supabase.com/docs/guides/storage)
- [Evolution API Docs](https://doc.evolution-api.com/)
- [HTML5 Media Elements](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/audio)

---

## ✨ RESUMO

**Antes:**
- ❌ Base64 pesado
- ❌ URLs temporárias
- ❌ Sem preview
- ❌ Limite de 16MB

**Agora:**
- ✅ Supabase Storage otimizado
- ✅ URLs permanentes
- ✅ Players nativos funcionais
- ✅ Até 50MB por arquivo
- ✅ CDN global
- ✅ Custo baixo
- ✅ Seguro e escalável

**🎉 Todas as funcionalidades de mídia estão 100% operacionais!**
