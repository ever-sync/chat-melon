# Guia de Otimização Supabase PRO

Como você possui o plano PRO, existem configurações cruciais que devem ser
ativadas no Painel do Supabase para garantir a máxima performance e segurança.
Como não tenho acesso ao seu painel, você deve realizar estas configurações
manualmente.

## 1. Segurança e Backup (CRÍTICO)

### Ativar PITR (Point in Time Recovery)

O PITR permite restaurar seu banco de dados para **qualquer segundo** dos
últimos 7 dias. Isso salva você de deletar dados acidentalmente.

1. Vá em **Database** > **Backups**.
2. Clique em **Point in Time Recovery**.
3. Ative a opção.

### Verificar Backups Diários

Confirme se os backups diários estão sendo feitos.

1. Vá em **Database** > **Backups**.
2. Verifique a lista de "Scheduled Backups".

## 2. Performance de Imagens (Storage)

### Ativar Smart CDN e Image Transformation

O Supabase PRO permite redimensionar imagens na nuvem, economizando dados e
carregando o chat muito mais rápido.

1. Vá em **Storage** > **Configuration** (ou Settings do Bucket).
2. Certifique-se de que **Image Transformation** está ativado.
3. Se houver opção de **Smart CDN**, ative-a.

_Nota: O código do MelonChat já está preparado para usar URLs otimizadas
automagicamente se esta função estiver ativa._

## 3. Performance de Banco de Dados

### Connection Pooling (Supavisor)

Para aguentar muitos usuários simultâneos sem travar o banco.

1. Vá em **Settings** > **Database**.
2. Procure por **Connection Pooling**.
3. Certifique-se de que está ativado (Porta 6543) e no modo `Transaction`.
4. _Seu código já usa a conexão direta, mas para serverless functions futuras, o
   pool é essencial._

### Compute Size (Recursos)

Se o sistema ficar lento, você pode aumentar a memória RAM.

1. Vá em **Settings** > **Compute**.
2. No plano PRO, você pode escalar para máquinas maiores (ex: 4GB RAM, 2 CPUs)
   se necessário. Por enquanto, o padrão deve servir bem com os novos índices
   que criamos.

## 4. Otimizações de Código Aplicadas

Eu já apliquei via código as seguintes melhorias que usam o poder do PRO:

- ✅ **GIN Indexes**: Índices ultra-rápidos para busca de texto em mensagens.
- ✅ **pg_trgm**: Extensão avançada para encontrar nomes e textos "parecidos"
  (fuzzy search).
