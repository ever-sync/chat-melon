# Automações do CRM - Guia de Uso

## O que foi implementado

O sistema de automações permite executar ações automaticamente quando um negócio é movido para uma nova etapa do pipeline.

---

## Tipos de Automações Disponíveis

### 1. **Criar Tarefa Automática** (`create_task`)
Cria uma tarefa automaticamente quando o deal entra em determinado stage.

**Exemplo de configuração:**
```json
{
  "type": "create_task",
  "config": {
    "title": "Enviar proposta comercial",
    "description": "Elaborar e enviar proposta detalhada ao cliente"
  }
}
```

### 2. **Enviar Notificação** (`send_notification`)
Envia uma notificação ao responsável pelo negócio.

**Exemplo de configuração:**
```json
{
  "type": "send_notification",
  "config": {
    "message": "Novo negócio em fase de negociação! Entre em contato com o cliente."
  }
}
```

### 3. **Atualizar Probabilidade** (`update_probability`)
Atualiza automaticamente a probabilidade de fechamento.

**Exemplo de configuração:**
```json
{
  "type": "update_probability",
  "config": {
    "probability": 75
  }
}
```

### 4. **Enviar Email** (`send_email`)
*(Em desenvolvimento)* - Enviará email automático.

**Exemplo de configuração:**
```json
{
  "type": "send_email",
  "config": {
    "subject": "Próximos passos",
    "body": "Template de email aqui..."
  }
}
```

---

## Como Configurar Automações

### Via Supabase (Direto no banco de dados)

1. Acesse a tabela `pipeline_stages`
2. Localize o stage desejado
3. Edite a coluna `automation_rules` (tipo JSONB)
4. Adicione um array de regras:

```json
[
  {
    "type": "create_task",
    "config": {
      "title": "Fazer follow-up",
      "description": "Entrar em contato com o cliente em 48h"
    }
  },
  {
    "type": "update_probability",
    "config": {
      "probability": 60
    }
  },
  {
    "type": "send_notification",
    "config": {
      "message": "Negócio movido para proposta! Atenção redobrada."
    }
  }
]
```

---

## Exemplos de Configuração por Stage

### Stage: "Qualificação"
```json
[
  {
    "type": "create_task",
    "config": {
      "title": "Identificar BANT",
      "description": "Validar Budget, Authority, Need e Timeline"
    }
  },
  {
    "type": "update_probability",
    "config": {
      "probability": 25
    }
  }
]
```

### Stage: "Proposta"
```json
[
  {
    "type": "create_task",
    "config": {
      "title": "Criar proposta comercial",
      "description": "Elaborar proposta detalhada com pricing e escopo"
    }
  },
  {
    "type": "update_probability",
    "config": {
      "probability": 60
    }
  },
  {
    "type": "send_notification",
    "config": {
      "message": "Negócio em fase de proposta! Prazo: 3 dias úteis"
    }
  }
]
```

### Stage: "Negociação"
```json
[
  {
    "type": "update_probability",
    "config": {
      "probability": 80
    }
  },
  {
    "type": "send_notification",
    "config": {
      "message": "Cliente em negociação! Fique atento às objeções."
    }
  }
]
```

---

## Como Funciona Tecnicamente

1. **Quando um deal é movido** (função `moveDeal` em `useDeals.ts`):
   - O sistema busca o novo stage
   - Verifica se existe `automation_rules` configurado
   - Se existir, chama `executeAutomations(dealId, automation_rules)`

2. **Execução das automações** (arquivo `src/lib/automations.ts`):
   - Itera sobre cada regra
   - Executa a ação correspondente ao `type`
   - Falhas individuais não bloqueiam outras automações

3. **Real-time** (subscription em `useDeals.ts`):
   - Escuta mudanças na tabela `deals`
   - Atualiza automaticamente a UI quando outro usuário faz alterações
   - Funciona para: criar, editar, mover, deletar deals

---

## Logs e Debugging

Para ver as automações sendo executadas, abra o console do navegador:

```javascript
// Você verá logs como:
"Executando automações para deal: abc123"
"Tarefa criada automaticamente!"
"Probabilidade atualizada para 75%"
```

---

## Próximos Passos (Features Futuras)

- ✅ Criar tarefa automática
- ✅ Enviar notificação
- ✅ Atualizar probabilidade
- ⏳ Enviar email (requer integração com serviço de email)
- ⏳ Webhook para sistemas externos
- ⏳ Delay/agendamento de ações
- ⏳ Condições (executar apenas se X = Y)
- ⏳ UI para configurar automações (sem precisar editar JSON)

---

## Exemplo Completo de Pipeline Configurado

**Pipeline: "Vendas B2B"**

| Stage | Probability | Automações |
|-------|-------------|------------|
| **Lead** | 10% | Criar tarefa "Qualificar lead" |
| **Qualificação** | 25% | Atualizar probabilidade para 25% |
| **Proposta** | 60% | Criar tarefa "Enviar proposta" + Notificar responsável |
| **Negociação** | 80% | Atualizar probabilidade para 80% + Notificar gerente |
| **Fechamento** | 95% | Criar tarefa "Preparar contrato" |

---

## Arquivo de Implementação

As automações estão implementadas em:
- **Hook principal:** `src/hooks/crm/useDeals.ts`
- **Executor de automações:** `src/lib/automations.ts`

Para adicionar novos tipos de automação, edite `src/lib/automations.ts` e adicione um novo `case` no `switch`.

---

## Suporte

Se tiver dúvidas ou precisar de novos tipos de automação, entre em contato com a equipe de desenvolvimento.
