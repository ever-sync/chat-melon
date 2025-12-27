# Migrations Temporárias e Fixes

Esta pasta contém migrations temporárias, scripts de fix e correções que não fazem parte do fluxo principal de migrations.

## ⚠️ Importante

**Estes arquivos NÃO devem ser executados automaticamente pelo Supabase CLI.**

Eles são scripts manuais que devem ser executados apenas quando necessário, diretamente no SQL Editor do Supabase.

## Categorias

### Fixes (FIX_*.sql)
Scripts de correção para problemas específicos:
- `FIX_NULL_CONTACT_NAMES.sql` - Corrige conversas com contact_name NULL
- `FIX_RLS_CONVITES.sql` - Corrige políticas RLS de convites
- `fix_deal_system.sql` - Corrige sistema de deals
- `fix_trigger_error.sql` - Corrige erros de triggers
- `fix_messages_*.sql` - Correções relacionadas a mensagens
- `fix_images_*.sql` - Correções relacionadas a imagens
- `fix_chat_*.sql` - Correções relacionadas ao chat
- `fix_all_errors.sql` - Correção geral de erros

### Aplicações Manuais (APPLY_*.sql)
Scripts que devem ser aplicados manualmente:
- `APPLY_CONTACT_NAME_SYNC.sql` - Sincroniza nomes de contatos
- `APPLY_USER_AVATARS.sql` - Aplica avatares de usuários
- `APPLY_EMAIL_SYNC.sql` - Sincroniza emails
- `APPLY_STORAGE_POLICIES.sql` - Aplica políticas de storage
- `APPLY_AI_ASSISTANT_TABLES.sql` - Aplica tabelas do assistente IA

### Diagnósticos (SQL_*.sql)
Scripts de diagnóstico e verificação:
- `SQL_CHECK_*.sql` - Scripts de verificação
- `SQL_DIAGNOSTICO*.sql` - Scripts de diagnóstico
- `SQL_FIX_*.sql` - Scripts de correção SQL
- `SQL_STEP*.sql` - Scripts em etapas

### Temporários
Scripts temporários que podem ser removidos após uso:
- `disable-*.sql` - Scripts para desabilitar funcionalidades
- `final-*.sql` - Scripts finais
- `test_*.sql` - Scripts de teste
- `temp_*.sql` - Scripts temporários

## Como Usar

1. **Identifique o problema** que precisa ser corrigido
2. **Encontre o script apropriado** nesta pasta
3. **Revise o script** antes de executar
4. **Execute no SQL Editor** do Supabase Dashboard
5. **Verifique os resultados** após a execução

## Consolidação Futura

Estes scripts devem ser eventualmente:
- Consolidados em migrations oficiais (se aplicável)
- Removidos (se não forem mais necessários)
- Documentados melhor (se forem críticos)

## Nota

Se você encontrar um problema que requer um fix, considere:
1. Criar uma migration oficial com timestamp
2. Documentar o problema e a solução
3. Adicionar testes para prevenir regressões

