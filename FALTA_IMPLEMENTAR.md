# 📋 O QUE FALTA IMPLEMENTAR

## ✅ JÁ IMPLEMENTADO (CRÍTICOS):
1. ✅ **Webhook Handler Evolution API** - FEITO
2. ✅ **Realtime Subscriptions** - FEITO
3. ✅ **Chat Interno Entre Usuários** - FEITO

---

## 🔄 PENDENTE - NECESSÁRIO PARA DEPLOY

### A. Aplicar Migrations no Banco
```bash
supabase db push
```
**Migrations a aplicar:**
- `20251202000001_add_message_external_id.sql`
- `20251202000002_create_internal_chat.sql`

### B. Deploy Edge Function
```bash
supabase functions deploy handle-evolution-webhook
```

### C. Configurar Webhook na Evolution API
**Endpoint:** `https://seu-projeto.supabase.co/functions/v1/handle-evolution-webhook`

**Events:**
- MESSAGES_UPSERT
- MESSAGES_UPDATE
- CONNECTION_UPDATE
- QRCODE_UPDATED

### D. Habilitar Realtime no Supabase
Dashboard > Database > Replication

Habilitar para:
- ✅ messages
- ✅ conversations
- ✅ internal_messages

---

## 🚀 FUNCIONALIDADES FALTANDO (Por Prioridade)

### 🔥 PRIORIDADE ALTA (Próximos Passos)

#### 1. **Integração CRM ↔ Chat** ⏳ 2-3 horas
**Falta:**
- Botão "Criar Negócio" no ContactDetailPanel
- Botão "Enviar WhatsApp" no DealCard
- Ver histórico de conversas no deal
- Sincronizar status do lead (respondeu/não respondeu)

**Impacto:** Equipe precisa alternar entre Chat e CRM manualmente

---

#### 2. **Notificações Desktop** ⏳ 1-2 horas
**Falta:**
- Notificação quando nova mensagem chega
- Som de notificação
- Badge de contador de não lidas no título da página
- Permissão de notificações

**Impacto:** Usuário não sabe quando recebe mensagem sem olhar tela

**Implementação:**
```typescript
// src/hooks/useDesktopNotifications.ts
export function useDesktopNotifications() {
  useEffect(() => {
    if ('Notification' in window) {
      Notification.requestPermission();
    }
  }, []);

  const notify = (title: string, body: string, icon?: string) => {
    if (Notification.permission === 'granted') {
      new Notification(title, { body, icon, tag: 'chat' });

      // Som
      const audio = new Audio('/notification.mp3');
      audio.play();
    }
  };

  return { notify };
}
```

---

#### 3. **Templates com Atalhos** ⏳ 2 horas
**Falta:**
- Detectar "/" no input
- Mostrar dropdown com templates
- Autocompletar ao selecionar
- Categorias de templates

**Implementação:**
```typescript
// No MessageArea.tsx
const [showTemplates, setShowTemplates] = useState(false);

useEffect(() => {
  if (newMessage.startsWith('/')) {
    setShowTemplates(true);
    const command = newMessage.slice(1);
    // Filter templates by command
  } else {
    setShowTemplates(false);
  }
}, [newMessage]);
```

---

### ⚡ PRIORIDADE MÉDIA (Esta Semana)

#### 4. **Busca Dentro das Mensagens** ⏳ 1 hora
**Falta:**
- Input de busca no MessageArea
- Highlight de mensagens encontradas
- Scroll para mensagem encontrada

---

#### 5. **Badge de Não Lidas Global** ⏳ 30 minutos
**Falta:**
- Contador no ícone do Chat na sidebar
- Atualizar em tempo real
- Limpar ao abrir conversa

---

#### 6. **Exportação de Conversas** ⏳ 2 horas
**Falta:**
- Botão "Exportar" no ContactDetailPanel
- Gerar PDF com histórico
- Gerar TXT com histórico
- Download de anexos (ZIP)

---

### 🎯 PRIORIDADE BAIXA (Features Avançadas)

#### 7. **Mensagens Agendadas** ⏳ 4-6 horas
**Falta:**
- Botão "Agendar" no input
- Modal com date/time picker
- Tabela `scheduled_messages`
- Cron job para enviar

**Implementação:**
```sql
CREATE TABLE scheduled_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES conversations(id),
  content TEXT NOT NULL,
  scheduled_for TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending'
);
```

---

#### 8. **Analytics Avançado** ⏳ 6-8 horas
**Falta:**
- Tempo médio de primeira resposta
- Tempo médio de resolução
- Taxa de conversão (chat → deal)
- Gráfico de mensagens por hora
- Ranking de atendentes

**Queries necessárias:**
```sql
-- Tempo médio primeira resposta
SELECT AVG(
  EXTRACT(EPOCH FROM (m2.created_at - m1.created_at))
) / 60 as avg_minutes
FROM messages m1
JOIN messages m2 ON m2.conversation_id = m1.conversation_id
WHERE m1.is_from_me = false AND m2.is_from_me = true;

-- Taxa de conversão
SELECT
  COUNT(DISTINCT c.id) as total_conversations,
  COUNT(DISTINCT d.id) as total_deals,
  (COUNT(DISTINCT d.id)::float / COUNT(DISTINCT c.id) * 100) as conversion_rate
FROM conversations c
LEFT JOIN deals d ON d.contact_id = c.contact_id;
```

---

#### 9. **Chatbot com Fluxos** ⏳ 10-15 horas
**Falta:**
- Editor visual de fluxos
- Condições (if/else)
- Variáveis de contexto
- Integração com IA
- Ativar fora do horário

**Complexidade:** ALTA

---

#### 10. **WhatsApp Business Features** ⏳ 15-20 horas
**Falta:**
- Catálogo de produtos
- Carrinho de compras
- Pagamento via PIX
- Rastreamento de pedido

**Complexidade:** MUITO ALTA

---

## 📊 RESUMO POR TEMPO

### Implementação Rápida (1 dia):
- ✅ Notificações Desktop (2h)
- ✅ Templates com Atalhos (2h)
- ✅ Busca nas Mensagens (1h)
- ✅ Badge Global (30min)
- ✅ Integração CRM ↔ Chat (3h)
**Total: ~8 horas**

### Implementação Média (1 semana):
- ✅ Exportação de Conversas (2h)
- ✅ Analytics Básico (6h)
**Total: ~8 horas**

### Implementação Complexa (2-4 semanas):
- ✅ Mensagens Agendadas (6h)
- ✅ Chatbot (15h)
- ✅ WhatsApp Business (20h)
**Total: ~41 horas**

---

## 🎯 RECOMENDAÇÃO: PRÓXIMOS 3 DIAS

### DIA 1 (Hoje):
1. ✅ Aplicar migrations
2. ✅ Deploy edge function
3. ✅ Configurar webhook Evolution
4. ✅ Testar recebimento de mensagens
5. ✅ Notificações Desktop

### DIA 2:
1. ✅ Templates com Atalhos
2. ✅ Integração CRM ↔ Chat
3. ✅ Badge Global de Não Lidas
4. ✅ Busca nas Mensagens

### DIA 3:
1. ✅ Exportação de Conversas
2. ✅ Testes completos
3. ✅ Ajustes finais
4. ✅ Deploy em produção

---

## 📈 PROGRESSO ATUAL

**Implementado:** 70%
```
████████████████████████████░░░░░░░░░░░░ 70%
```

**Após Próximos 3 Dias:** 90%
```
████████████████████████████████████░░░░ 90%
```

**Produto Completo:** 100%
```
████████████████████████████████████████ 100%
```

---

## 🚨 BLOQUEADORES ATUAIS

### Nenhum! Tudo pronto para:
1. ✅ Aplicar migrations
2. ✅ Deploy de funções
3. ✅ Configurar webhooks
4. ✅ Começar a usar em produção

---

## 💡 SUGESTÕES EXTRAS (Opcional)

### A. Performance
- Virtualização da lista de conversas (react-window)
- Lazy loading de mensagens antigas
- Cache de fotos de perfil (IndexedDB)

### B. UX
- Indicador "digitando..." do outro lado
- Confirmação antes de deletar
- Arrastar & soltar arquivos
- Preview de links (Open Graph)

### C. Segurança
- Criptografia E2E (opcional)
- Logs de auditoria
- Rate limiting no webhook
- Validação de origin

---

## 📞 QUER QUE EU IMPLEMENTE ALGO AGORA?

Posso começar por qualquer um dos itens acima. Recomendo:

**Opção 1 (Rápida):** Notificações Desktop + Badge (2.5h total)
**Opção 2 (Impacto):** Integração CRM ↔ Chat (3h)
**Opção 3 (UX):** Templates com Atalhos (2h)

**Escolha um ou me diga o que prefere implementar primeiro!**
