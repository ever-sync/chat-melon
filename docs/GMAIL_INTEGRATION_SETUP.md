# Configuração da Integração Gmail

Este guia explica como configurar a integração do Gmail no MelonChat para receber e enviar emails como conversas.

## Pré-requisitos

- Conta Google Cloud Platform
- Projeto no Supabase configurado
- Variáveis de ambiente configuradas

## Passo 1: Criar Projeto no Google Cloud Console

1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto ou selecione um existente
3. Vá para "APIs & Services" > "Library"
4. Habilite as seguintes APIs:
   - **Gmail API**
   - **Google+ API** (para informações do usuário)

## Passo 2: Criar Credenciais OAuth 2.0

1. No Console, vá para "APIs & Services" > "Credentials"
2. Clique em "Create Credentials" > "OAuth client ID"
3. Configure a tela de consentimento OAuth:
   - Tipo de aplicação: **Externo**
   - Nome do app: **MelonChat**
   - Email de suporte: seu email
   - Domínios autorizados: adicione seu domínio
   - Escopos: adicione os escopos do Gmail
4. Tipo de aplicação: **Web application**
5. Nome: **MelonChat Gmail Integration**
6. URIs de redirecionamento autorizados:
   ```
   http://localhost:5173/oauth/gmail-callback
   https://seudominio.com/oauth/gmail-callback
   ```
7. Clique em "Create"
8. **Copie o Client ID e Client Secret**

## Passo 3: Configurar Variáveis de Ambiente

### Frontend (.env)

```bash
# Google OAuth
VITE_GOOGLE_CLIENT_ID=seu-client-id.apps.googleusercontent.com
VITE_GOOGLE_CLIENT_SECRET=seu-client-secret
```

### Supabase Edge Functions

1. Acesse seu projeto no Supabase
2. Vá para "Project Settings" > "Edge Functions" > "Secrets"
3. Adicione as seguintes variáveis:

```bash
GOOGLE_CLIENT_ID=seu-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=seu-client-secret
```

## Passo 4: Aplicar Migração do Banco de Dados

Execute a migração para criar a tabela de credenciais:

```bash
cd supabase
supabase db push
```

Ou aplique manualmente via Dashboard do Supabase:
- Vá para "SQL Editor"
- Execute o conteúdo do arquivo: `supabase/migrations/20251228000001_gmail_credentials.sql`

## Passo 5: Deploy das Edge Functions

```bash
# Fazer deploy da função de OAuth
supabase functions deploy gmail-oauth

# Fazer deploy da função de sincronização
supabase functions deploy gmail-sync
```

## Passo 6: Testar a Integração

1. Acesse a aplicação
2. Vá para **Canais** no menu lateral
3. Clique em "Adicionar Canal"
4. Selecione **Email**
5. Clique em "Conectar com Google"
6. Autorize o acesso na janela do Google
7. Aguarde a confirmação de conexão

## Passo 7: Configurar Sincronização Automática (Opcional)

Para sincronizar emails automaticamente a cada X minutos:

### Opção A: Cron Job do Supabase

Crie uma função de banco de dados:

```sql
CREATE OR REPLACE FUNCTION sync_gmail_for_all_companies()
RETURNS void AS $$
DECLARE
  cred RECORD;
BEGIN
  FOR cred IN
    SELECT company_id, user_id
    FROM gmail_credentials
    WHERE is_active = true
  LOOP
    PERFORM net.http_post(
      url := 'https://your-project-id.supabase.co/functions/v1/gmail-sync',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.jwt_token', true)
      ),
      body := jsonb_build_object(
        'action', 'sync_messages',
        'companyId', cred.company_id,
        'userId', cred.user_id
      )
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

Depois configure o cron:

```sql
SELECT cron.schedule(
  'sync-gmail',
  '*/15 * * * *', -- A cada 15 minutos
  $$SELECT sync_gmail_for_all_companies()$$
);
```

### Opção B: Webhook/Timer Externo

Configure um serviço externo (Vercel Cron, GitHub Actions, etc.) para chamar a Edge Function periodicamente.

## Fluxo de Funcionamento

### Recebimento de Emails

1. Edge Function `gmail-sync` é chamada periodicamente
2. Busca emails não lidos via Gmail API
3. Para cada email:
   - Cria ou localiza o contato pelo email
   - Cria ou localiza a conversa
   - Cria a mensagem no chat
   - Marca email como lido no Gmail

### Envio de Emails

1. Usuário responde no chat
2. Sistema detecta que é um canal de email
3. Chama Edge Function `gmail-sync` com action `send_email`
4. Email é enviado via Gmail API
5. Thread é mantida para respostas

## Permissões Necessárias

As seguintes permissões OAuth são solicitadas:

- `gmail.readonly` - Ler emails
- `gmail.send` - Enviar emails
- `gmail.modify` - Marcar como lido/não lido
- `userinfo.email` - Obter email do usuário

## Troubleshooting

### Erro: "Gmail credentials not found"
- Verifique se a integração foi conectada corretamente
- Confirme que o registro existe na tabela `gmail_credentials`
- Verifique se `is_active = true`

### Erro: "Failed to refresh access token"
- O refresh token pode ter expirado
- Reconecte a conta Gmail
- Verifique as credenciais do Google Cloud

### Emails não sincronizam
- Verifique se o cron job está rodando
- Confirme que a Edge Function está ativa
- Verifique logs no Supabase Dashboard

### Token expirado
- Os access tokens expiram em 1 hora
- O refresh token é usado automaticamente para renovar
- Se o refresh falhar, reconecte a conta

## Segurança

### RLS (Row Level Security)

A tabela `gmail_credentials` possui políticas RLS que garantem:
- Usuários só veem credenciais da sua empresa
- Apenas usuários autenticados podem inserir/atualizar
- Tokens são criptografados no banco (recomendado usar `pg_crypto`)

### Boas Práticas

1. **Nunca** exponha Client Secret no frontend
2. Use HTTPS em produção
3. Rotacione credenciais periodicamente
4. Monitore uso da API do Gmail (quotas)
5. Implemente rate limiting nas Edge Functions

## Quotas do Gmail API

- **1 bilhão** de requisições por dia (padrão)
- **250** requisições por segundo por usuário
- **25** requisições concorrentes por usuário

Para aumentar: solicite no Google Cloud Console

## Suporte

Para problemas ou dúvidas:
- Abra uma issue no GitHub
- Consulte a [documentação oficial do Gmail API](https://developers.google.com/gmail/api)
- Entre em contato com o suporte do MelonChat
