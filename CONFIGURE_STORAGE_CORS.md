# Configurar CORS no Supabase Storage

## Opção 1: Via Dashboard (RECOMENDADO)

1. Acesse: https://supabase.com/dashboard/project/nmbiuebxhovmwxrbaxsz/storage/buckets/message-media

2. Clique em **"Bucket Settings"** ou **"Edit Bucket"**

3. Procure por **"CORS Configuration"** ou **"Allowed Origins"**

4. Adicione estas origens:
   ```
   *
   ```
   ou especificamente:
   ```
   http://localhost:5173
   https://seu-dominio.vercel.app
   ```

5. Salve as configurações

---

## Opção 2: Via Supabase CLI

Execute no terminal:

```bash
npx supabase storage update message-media \
  --public true \
  --cors-allowed-origins="*"
```

---

## Opção 3: Forçar via SQL (Temporário)

Se as opções acima não funcionarem, podemos desabilitar temporariamente a verificação de CORS executando:

```sql
-- ATENÇÃO: Isso torna o bucket TOTALMENTE público
-- Use apenas para testes

UPDATE storage.buckets
SET
  public = true,
  allowed_mime_types = NULL
WHERE id = 'message-media';
```

---

## Verificar se funcionou

1. Force refresh (Ctrl+Shift+R) no navegador
2. Abra a página do chat
3. Verifique se as imagens aparecem
4. Abra o console (F12) e veja se há erros de CORS

---

## Problema Comum: CORS vs RLS

O Supabase Storage tem **duas** camadas de segurança:

1. **CORS** - Controla de quais domínios o navegador pode carregar arquivos
2. **RLS (Row Level Security)** - Controla quem pode acessar os arquivos

Já resolvemos o RLS (buckets públicos + policies corretas).
Agora precisamos resolver o CORS.

---

## URL para configurar:

Dashboard do bucket:
https://supabase.com/dashboard/project/nmbiuebxhovmwxrbaxsz/storage/buckets/message-media

---

## Teste Rápido:

Após configurar CORS, teste esta URL no navegador:
https://nmbiuebxhovmwxrbaxsz.supabase.co/storage/v1/object/public/message-media/61215833-73aa-49c6-adcc-790b9d11fd30/5512997548852/1766123928462_2ndwnc_image.jpg

Se abrir, o CORS está OK! ✅
