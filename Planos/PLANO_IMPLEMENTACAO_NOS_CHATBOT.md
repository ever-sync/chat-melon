# Plano de Implementação - Nós do Chatbot

## Status Atual
- ✅ **10 nós funcionais**: start, message, input, condition, set_variable, api_request, transfer_agent, end_conversation, tag, notification
- ❌ **~37 nós não implementados**: Apenas interface visual, sem lógica de execução

---

## 📋 FASE 1: CONTROLE DE FLUXO (Prioridade Alta)

### 1.1 Delay (Simular Digitação)
**Arquivos a modificar:**
- `supabase/functions/execute-chatbot/index.ts`

**Implementação:**
```typescript
case 'delay':
  const delayMs = node.config?.duration || 1000;
  await new Promise(resolve => setTimeout(resolve, delayMs));

  // Opcional: enviar status "digitando..." via Evolution API
  if (node.config?.showTyping) {
    await sendTypingStatus(conversationData.external_id);
  }

  nextNodeId = node.connections?.default;
  break;
```

**Campos no NodeEditor:**
- `duration`: Tempo em ms (padrão 1000)
- `showTyping`: Boolean para mostrar status digitando

**Estimativa:** 2 horas

---

### 1.2 Goto (Salto para Outro Nó)
**Implementação:**
```typescript
case 'goto':
  const targetNodeId = node.config?.targetNodeId;
  if (!targetNodeId) {
    throw new Error('Goto node missing targetNodeId');
  }
  nextNodeId = targetNodeId;
  break;
```

**Campos no NodeEditor:**
- `targetNodeId`: Select com lista de todos os nós do fluxo

**Estimativa:** 2 horas

---

### 1.3 Split (Divisão de Fluxo - Premium)
**Implementação:**
```typescript
case 'split':
  const splitType = node.config?.type || 'percentage';

  if (splitType === 'percentage') {
    const random = Math.random() * 100;
    const paths = node.config?.paths || [];

    let accumulated = 0;
    for (const path of paths) {
      accumulated += path.percentage;
      if (random <= accumulated) {
        nextNodeId = path.nodeId;
        break;
      }
    }
  }
  break;
```

**Campos no NodeEditor:**
- `type`: 'percentage' | 'round_robin' | 'custom'
- `paths`: Array de { percentage, nodeId, label }

**Estimativa:** 4 horas

---

### 1.4 Random (Escolha Aleatória)
**Implementação:**
```typescript
case 'random':
  const options = node.connections || {};
  const keys = Object.keys(options);
  const randomKey = keys[Math.floor(Math.random() * keys.length)];
  nextNodeId = options[randomKey];
  break;
```

**Campos no NodeEditor:**
- Múltiplas conexões de saída

**Estimativa:** 1 hora

---

## 📋 FASE 2: MULTIMÍDIA (Prioridade Alta)

### 2.1 Image (Enviar Imagem)
**Implementação:**
```typescript
case 'image':
  const imageUrl = replaceVariables(node.config?.url, variables);
  const caption = replaceVariables(node.config?.caption || '', variables);

  await sendEvolutionMessage(conversationData.external_id, {
    mediaMessage: {
      mediatype: 'image',
      media: imageUrl,
      caption: caption
    }
  });

  nextNodeId = node.connections?.default;
  break;
```

**Campos no NodeEditor:**
- `url`: URL da imagem ou upload para Supabase Storage
- `caption`: Legenda (opcional)
- Botão de upload de arquivo

**Estimativa:** 4 horas

---

### 2.2 Video (Enviar Vídeo)
**Implementação:** Similar ao image, mudando `mediatype: 'video'`

**Estimativa:** 2 horas

---

### 2.3 Audio (Enviar Áudio)
**Implementação:** Similar ao image, mudando `mediatype: 'audio'`

**Estimativa:** 2 horas

---

### 2.4 Document (Enviar Documento)
**Implementação:** Similar ao image, mudando `mediatype: 'document'`

**Campos adicionais:**
- `fileName`: Nome do arquivo

**Estimativa:** 2 horas

---

### 2.5 Sticker (Enviar Figurinha)
**Implementação:** Similar ao image, mudando `mediatype: 'sticker'`

**Estimativa:** 2 horas

---

## 📋 FASE 3: INTERAÇÃO AVANÇADA (Prioridade Média)

### 3.1 Quick Reply (Botões de Resposta Rápida)
**Implementação:**
```typescript
case 'quick_reply':
  const text = replaceVariables(node.config?.text, variables);
  const buttons = (node.config?.buttons || []).map(btn => ({
    buttonId: btn.id,
    buttonText: { displayText: btn.text }
  }));

  await sendEvolutionMessage(conversationData.external_id, {
    buttonsMessage: {
      text: text,
      buttons: buttons
    }
  });

  // Armazenar mapeamento de botão -> próximo nó
  const buttonMap = {};
  node.config?.buttons.forEach(btn => {
    buttonMap[btn.id] = btn.nextNodeId;
  });

  // Aguardar resposta do usuário
  nextNodeId = await waitForButtonResponse(conversationData.id, buttonMap);
  break;
```

**Campos no NodeEditor:**
- `text`: Mensagem
- `buttons`: Array de { id, text, nextNodeId }

**Estimativa:** 6 horas

---

### 3.2 List (Menu de Lista)
**Implementação:**
```typescript
case 'list':
  const listMessage = {
    text: replaceVariables(node.config?.text, variables),
    buttonText: node.config?.buttonText || 'Ver opções',
    sections: node.config?.sections || []
  };

  await sendEvolutionMessage(conversationData.external_id, {
    listMessage: listMessage
  });

  // Aguardar seleção
  nextNodeId = await waitForListResponse(conversationData.id, node.config?.sections);
  break;
```

**Campos no NodeEditor:**
- `text`: Mensagem
- `buttonText`: Texto do botão
- `sections`: Array de { title, rows: [{ id, title, description, nextNodeId }] }

**Estimativa:** 8 horas

---

### 3.3 Carousel (Carrossel de Produtos)
**Implementação:**
```typescript
case 'carousel':
  const cards = node.config?.cards || [];

  for (const card of cards) {
    await sendEvolutionMessage(conversationData.external_id, {
      mediaMessage: {
        mediatype: 'image',
        media: card.image,
        caption: `*${card.title}*\n${card.description}\n\n${card.price}`
      }
    });

    // Delay entre cards
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  nextNodeId = node.connections?.default;
  break;
```

**Campos no NodeEditor:**
- `cards`: Array de { image, title, description, price, buttonText, nextNodeId }

**Estimativa:** 6 horas

---

### 3.4 File Upload (Receber Arquivo do Usuário)
**Implementação:**
```typescript
case 'file_upload':
  const prompt = replaceVariables(node.config?.prompt, variables);
  const allowedTypes = node.config?.allowedTypes || ['image', 'video', 'audio', 'document'];

  await sendEvolutionMessage(conversationData.external_id, {
    text: prompt
  });

  // Aguardar upload
  const fileData = await waitForFileUpload(conversationData.id, allowedTypes);

  // Salvar URL do arquivo em variável
  variables[node.config?.variableName || 'uploaded_file'] = fileData.url;

  nextNodeId = node.connections?.default;
  break;
```

**Estimativa:** 8 horas

---

### 3.5 Location (Solicitar/Enviar Localização)
**Implementação:**
```typescript
case 'location':
  if (node.config?.mode === 'request') {
    // Solicitar localização
    await sendEvolutionMessage(conversationData.external_id, {
      text: node.config?.prompt || 'Por favor, compartilhe sua localização'
    });

    const location = await waitForLocation(conversationData.id);
    variables['location_lat'] = location.latitude;
    variables['location_lng'] = location.longitude;
  } else {
    // Enviar localização
    await sendEvolutionMessage(conversationData.external_id, {
      locationMessage: {
        latitude: node.config?.latitude,
        longitude: node.config?.longitude,
        name: node.config?.name,
        address: node.config?.address
      }
    });
  }

  nextNodeId = node.connections?.default;
  break;
```

**Estimativa:** 6 horas

---

### 3.6 Contact Card (Enviar Cartão de Contato)
**Implementação:**
```typescript
case 'contact_card':
  await sendEvolutionMessage(conversationData.external_id, {
    contactMessage: {
      fullName: node.config?.name,
      organization: node.config?.company,
      phoneNumber: node.config?.phone,
      email: node.config?.email
    }
  });

  nextNodeId = node.connections?.default;
  break;
```

**Estimativa:** 3 horas

---

### 3.7 Rating (Avaliação por Estrelas)
**Implementação:**
```typescript
case 'rating':
  const ratingText = node.config?.text || 'Como você avalia nosso atendimento?';
  const maxStars = node.config?.maxStars || 5;

  const buttons = [];
  for (let i = 1; i <= maxStars; i++) {
    buttons.push({
      buttonId: `rating_${i}`,
      buttonText: { displayText: '⭐'.repeat(i) }
    });
  }

  await sendEvolutionMessage(conversationData.external_id, {
    buttonsMessage: { text: ratingText, buttons }
  });

  const rating = await waitForRating(conversationData.id, maxStars);
  variables['rating'] = rating;

  // Salvar no banco
  await saveRating(conversationData.id, rating);

  nextNodeId = node.connections?.default;
  break;
```

**Estimativa:** 5 horas

---

### 3.8 NPS (Net Promoter Score - Premium)
**Implementação:** Similar ao rating, mas escala 0-10 e classificação em Detratores/Neutros/Promotores

**Estimativa:** 6 horas

---

### 3.9 Calendar (Agendamento - Premium)
**Implementação:**
```typescript
case 'calendar':
  // Integrar com biblioteca de calendário
  // Mostrar slots disponíveis
  // Permitir seleção de data/hora
  // Confirmar agendamento

  const appointment = await handleCalendarBooking(node.config, variables);
  variables['appointment_date'] = appointment.date;
  variables['appointment_time'] = appointment.time;

  nextNodeId = node.connections?.default;
  break;
```

**Estimativa:** 16 horas (complexo)

---

## 📋 FASE 4: LÓGICA (Prioridade Média)

### 4.1 Switch (Múltiplas Condições)
**Implementação:**
```typescript
case 'switch':
  const variable = variables[node.config?.variable];
  const cases = node.config?.cases || [];

  let matched = false;
  for (const caseItem of cases) {
    if (evaluateCondition(variable, caseItem.operator, caseItem.value)) {
      nextNodeId = caseItem.nextNodeId;
      matched = true;
      break;
    }
  }

  if (!matched) {
    nextNodeId = node.connections?.default;
  }
  break;
```

**Campos no NodeEditor:**
- `variable`: Nome da variável
- `cases`: Array de { operator, value, nextNodeId }
- Conexão default para casos não cobertos

**Estimativa:** 4 horas

---

### 4.2 A/B Test (Teste A/B - Premium)
**Implementação:**
```typescript
case 'ab_test':
  const testId = node.config?.testId;
  const variants = node.config?.variants || []; // [{ name, percentage, nodeId }]

  // Verificar se usuário já participou deste teste
  let variant = await getABTestVariant(conversationData.contact_id, testId);

  if (!variant) {
    // Atribuir variante baseado em porcentagem
    const random = Math.random() * 100;
    let accumulated = 0;

    for (const v of variants) {
      accumulated += v.percentage;
      if (random <= accumulated) {
        variant = v.name;
        await saveABTestVariant(conversationData.contact_id, testId, variant);
        break;
      }
    }
  }

  // Registrar evento
  await logABTestEvent(testId, variant, 'impression');

  // Ir para o nó da variante
  const selectedVariant = variants.find(v => v.name === variant);
  nextNodeId = selectedVariant?.nodeId;
  break;
```

**Estimativa:** 8 horas

---

## 📋 FASE 5: INTELIGÊNCIA ARTIFICIAL (Prioridade Alta)

### 5.1 AI Response (Resposta com IA)
**Implementação:**
```typescript
case 'ai_response':
  const prompt = replaceVariables(node.config?.prompt, variables);
  const context = replaceVariables(node.config?.context || '', variables);
  const model = node.config?.model || 'gpt-3.5-turbo';

  // Buscar API key da empresa
  const apiKey = await getCompanyAIKey(conversationData.company_id, 'openai');

  if (!apiKey) {
    throw new Error('OpenAI API key not configured');
  }

  // Chamar OpenAI
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: model,
      messages: [
        { role: 'system', content: context },
        { role: 'user', content: prompt }
      ],
      temperature: node.config?.temperature || 0.7,
      max_tokens: node.config?.maxTokens || 500
    })
  });

  const data = await response.json();
  const aiMessage = data.choices[0]?.message?.content;

  // Enviar resposta
  await sendEvolutionMessage(conversationData.external_id, {
    text: aiMessage
  });

  // Salvar em variável
  variables['ai_response'] = aiMessage;

  nextNodeId = node.connections?.default;
  break;
```

**Campos no NodeEditor:**
- `model`: Select (gpt-3.5-turbo, gpt-4, claude-3, etc)
- `prompt`: Template do prompt
- `context`: Instruções do sistema
- `temperature`: Slider 0-1
- `maxTokens`: Number

**Estimativa:** 8 horas

---

### 5.2 AI Classifier (Classificação por IA)
**Implementação:**
```typescript
case 'ai_classifier':
  const textToClassify = replaceVariables(node.config?.text, variables);
  const categories = node.config?.categories || [];

  const prompt = `Classifique o seguinte texto em uma das categorias: ${categories.join(', ')}

Texto: "${textToClassify}"

Responda apenas com o nome da categoria.`;

  const classification = await callAI(prompt, conversationData.company_id);

  // Encontrar próximo nó baseado na classificação
  const category = categories.find(c =>
    classification.toLowerCase().includes(c.toLowerCase())
  );

  nextNodeId = node.config?.categoryMap[category] || node.connections?.default;
  break;
```

**Estimativa:** 6 horas

---

### 5.3 Sentiment Analysis (Análise de Sentimento)
**Implementação:**
```typescript
case 'sentiment_analysis':
  const text = replaceVariables(node.config?.text, variables);

  const sentiment = await analyzeSentiment(text, conversationData.company_id);
  // Retorna: 'positive', 'neutral', 'negative'

  variables['sentiment'] = sentiment;
  variables['sentiment_score'] = sentiment.score;

  // Rotear baseado no sentimento
  if (sentiment === 'negative') {
    nextNodeId = node.connections?.negative;
  } else if (sentiment === 'positive') {
    nextNodeId = node.connections?.positive;
  } else {
    nextNodeId = node.connections?.neutral || node.connections?.default;
  }
  break;
```

**Estimativa:** 6 horas

---

### 5.4 Extract Data (Extrair Dados com IA)
**Implementação:**
```typescript
case 'extract_data':
  const sourceText = replaceVariables(node.config?.sourceText, variables);
  const fields = node.config?.fields || []; // [{ name, description }]

  const prompt = `Extraia as seguintes informações do texto:

${fields.map(f => `- ${f.name}: ${f.description}`).join('\n')}

Texto: "${sourceText}"

Retorne no formato JSON.`;

  const extracted = await callAI(prompt, conversationData.company_id);
  const data = JSON.parse(extracted);

  // Salvar cada campo em variável
  for (const field of fields) {
    variables[field.name] = data[field.name];
  }

  nextNodeId = node.connections?.default;
  break;
```

**Estimativa:** 6 horas

---

### 5.5 Summarize (Resumir Texto)
**Implementação:**
```typescript
case 'summarize':
  const longText = replaceVariables(node.config?.text, variables);
  const maxLength = node.config?.maxLength || 100;

  const summary = await callAI(
    `Resuma o seguinte texto em no máximo ${maxLength} palavras:\n\n${longText}`,
    conversationData.company_id
  );

  variables['summary'] = summary;

  if (node.config?.sendMessage) {
    await sendEvolutionMessage(conversationData.external_id, { text: summary });
  }

  nextNodeId = node.connections?.default;
  break;
```

**Estimativa:** 4 horas

---

### 5.6 Translate (Traduzir Texto)
**Implementação:**
```typescript
case 'translate':
  const textToTranslate = replaceVariables(node.config?.text, variables);
  const targetLang = node.config?.targetLanguage || 'en';

  const translated = await callAI(
    `Traduza o seguinte texto para ${targetLang}:\n\n${textToTranslate}`,
    conversationData.company_id
  );

  variables['translated_text'] = translated;

  if (node.config?.sendMessage) {
    await sendEvolutionMessage(conversationData.external_id, { text: translated });
  }

  nextNodeId = node.connections?.default;
  break;
```

**Estimativa:** 4 horas

---

## 📋 FASE 6: INTEGRAÇÕES (Prioridade Média)

### 6.1 HTTP Request (Já implementado como api_request)
✅ Já funcional

---

### 6.2 Google Sheets (Ler/Escrever)
**Implementação:**
```typescript
case 'google_sheets':
  const action = node.config?.action; // 'read' | 'append' | 'update'
  const spreadsheetId = node.config?.spreadsheetId;
  const range = node.config?.range;

  const credentials = await getCompanyIntegration(
    conversationData.company_id,
    'google_sheets'
  );

  if (action === 'append') {
    const values = node.config?.values.map(v => replaceVariables(v, variables));
    await appendToSheet(spreadsheetId, range, values, credentials);
  } else if (action === 'read') {
    const data = await readFromSheet(spreadsheetId, range, credentials);
    variables['sheet_data'] = data;
  }

  nextNodeId = node.connections?.default;
  break;
```

**Estimativa:** 12 horas (incluindo OAuth)

---

### 6.3 Zapier Webhook
**Implementação:**
```typescript
case 'zapier':
  const webhookUrl = node.config?.webhookUrl;
  const payload = {};

  node.config?.fields.forEach(field => {
    payload[field.key] = replaceVariables(field.value, variables);
  });

  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  nextNodeId = node.connections?.default;
  break;
```

**Estimativa:** 4 horas

---

### 6.4 Custom Code (JavaScript)
**Implementação:**
```typescript
case 'custom_code':
  const code = node.config?.code;

  // Criar sandbox seguro
  const sandbox = {
    variables: { ...variables },
    console: {
      log: (...args) => console.log('[Custom Code]', ...args)
    }
  };

  // Executar código
  const fn = new Function('context', code);
  const result = fn(sandbox);

  // Mesclar variáveis modificadas
  Object.assign(variables, sandbox.variables);

  if (result?.nextNodeId) {
    nextNodeId = result.nextNodeId;
  } else {
    nextNodeId = node.connections?.default;
  }
  break;
```

**Estimativa:** 8 horas (com segurança)

---

## 📋 FASE 7: E-COMMERCE (Prioridade Baixa)

### 7.1 Product Catalog (Catálogo de Produtos)
**Implementação:**
```typescript
case 'product_catalog':
  const products = await getProducts(conversationData.company_id, node.config?.filter);

  for (const product of products.slice(0, 10)) {
    await sendEvolutionMessage(conversationData.external_id, {
      mediaMessage: {
        mediatype: 'image',
        media: product.image,
        caption: `*${product.name}*\n${product.description}\n\nPreço: R$ ${product.price}\n\nPara adicionar ao carrinho, digite: ADD ${product.id}`
      }
    });
  }

  nextNodeId = node.connections?.default;
  break;
```

**Estimativa:** 12 horas

---

### 7.2 Cart (Carrinho de Compras)
**Implementação:**
```typescript
case 'cart':
  const action = node.config?.action; // 'add' | 'remove' | 'show' | 'clear'

  let cart = variables['cart'] || [];

  if (action === 'add') {
    const productId = replaceVariables(node.config?.productId, variables);
    const quantity = parseInt(replaceVariables(node.config?.quantity, variables)) || 1;

    cart.push({ productId, quantity });
    variables['cart'] = cart;

  } else if (action === 'show') {
    const total = await calculateCartTotal(cart);
    let message = '*🛒 Seu Carrinho*\n\n';

    for (const item of cart) {
      const product = await getProduct(item.productId);
      message += `${item.quantity}x ${product.name} - R$ ${product.price * item.quantity}\n`;
    }

    message += `\n*Total: R$ ${total}*`;

    await sendEvolutionMessage(conversationData.external_id, { text: message });
  }

  nextNodeId = node.connections?.default;
  break;
```

**Estimativa:** 16 horas

---

### 7.3 Payment (Pagamento)
**Implementação:**
```typescript
case 'payment':
  const cart = variables['cart'] || [];
  const total = await calculateCartTotal(cart);

  // Integrar com gateway de pagamento (Stripe, Mercado Pago, etc)
  const paymentLink = await createPaymentLink(
    conversationData.company_id,
    cart,
    total,
    conversationData.contact_id
  );

  await sendEvolutionMessage(conversationData.external_id, {
    text: `💳 *Pagamento*\n\nTotal: R$ ${total}\n\nClique no link para pagar:\n${paymentLink}`
  });

  variables['payment_link'] = paymentLink;

  nextNodeId = node.connections?.default;
  break;
```

**Estimativa:** 20 horas (integração com gateway)

---

### 7.4 Order Status (Status do Pedido)
**Implementação:**
```typescript
case 'order_status':
  const orderId = replaceVariables(node.config?.orderId, variables);

  const order = await getOrder(orderId);

  const message = `*📦 Pedido #${orderId}*\n\nStatus: ${order.status}\nData: ${order.date}\nTotal: R$ ${order.total}\n\n${order.tracking ? `Rastreio: ${order.tracking}` : ''}`;

  await sendEvolutionMessage(conversationData.external_id, { text: message });

  nextNodeId = node.connections?.default;
  break;
```

**Estimativa:** 8 horas

---

## 📋 FASE 8: AGENDAMENTO

### 8.1 Schedule Message (Agendar Mensagem)
**Implementação:**
```typescript
case 'schedule_message':
  const scheduleDate = replaceVariables(node.config?.date, variables);
  const scheduleTime = replaceVariables(node.config?.time, variables);
  const message = replaceVariables(node.config?.message, variables);

  // Salvar mensagem agendada no banco
  await scheduleMessage({
    conversation_id: conversationData.id,
    scheduled_at: `${scheduleDate} ${scheduleTime}`,
    message: message,
    next_node_id: node.connections?.default
  });

  nextNodeId = node.connections?.default;
  break;
```

**Arquivos adicionais:**
- Criar Edge Function `process-scheduled-messages` com cron job

**Estimativa:** 10 horas

---

## 📊 RESUMO GERAL

| Fase | Nós | Estimativa | Prioridade |
|------|-----|-----------|-----------|
| 1. Controle de Fluxo | 4 | 9h | Alta |
| 2. Multimídia | 5 | 12h | Alta |
| 3. Interação Avançada | 9 | 54h | Média |
| 4. Lógica | 2 | 12h | Média |
| 5. Inteligência Artificial | 6 | 38h | Alta |
| 6. Integrações | 4 | 28h | Média |
| 7. E-commerce | 4 | 56h | Baixa |
| 8. Agendamento | 1 | 10h | Média |
| **TOTAL** | **35 nós** | **219 horas** | |

---

## 🎯 ESTRATÉGIA DE IMPLEMENTAÇÃO

### Semana 1-2: Fundação (Prioridade Alta)
1. ✅ Delay
2. ✅ Goto
3. ✅ Random
4. ✅ Image
5. ✅ Video
6. ✅ Audio
7. ✅ AI Response

### Semana 3-4: Interatividade
8. ✅ Quick Reply
9. ✅ List
10. ✅ Switch
11. ✅ AI Classifier
12. ✅ Sentiment Analysis

### Semana 5-6: Recursos Avançados
13. ✅ Carousel
14. ✅ File Upload
15. ✅ Rating
16. ✅ Extract Data
17. ✅ Custom Code

### Semana 7-8: Integrações
18. ✅ Google Sheets
19. ✅ Zapier
20. ✅ Schedule Message
21. ✅ A/B Test

### Semana 9-10: Premium Features
22. ✅ Split
23. ✅ NPS
24. ✅ Calendar
25. ✅ E-commerce (todos)

---

## 🔧 ARQUIVOS A MODIFICAR

### Backend
1. **`supabase/functions/execute-chatbot/index.ts`**
   - Adicionar todos os casos dos novos nós
   - Criar funções auxiliares para cada tipo

2. **`supabase/functions/evolution-webhook/index.ts`**
   - Capturar respostas de botões/listas
   - Processar uploads de arquivos

3. **Nova: `supabase/functions/process-scheduled-messages/index.ts`**
   - Cron job para mensagens agendadas

### Frontend
1. **`src/components/chatbot/NodeEditor.tsx`**
   - Adicionar formulários de configuração para cada nó
   - Componentes específicos (upload, seletor de data, etc)

2. **`src/types/chatbot.ts`**
   - Adicionar tipagens para configs de cada nó

### Database
1. **Nova tabela: `chatbot_ab_tests`**
   - Rastreamento de testes A/B

2. **Nova tabela: `chatbot_scheduled_messages`**
   - Mensagens agendadas

3. **Nova tabela: `chatbot_ratings`**
   - Avaliações e NPS

4. **Nova tabela: `ecommerce_products`** (se aplicável)
   - Catálogo de produtos

---

## 📝 CHECKLIST DE IMPLEMENTAÇÃO

Para cada nó:
- [ ] Implementar lógica no `execute-chatbot`
- [ ] Adicionar formulário de config no `NodeEditor`
- [ ] Adicionar tipos TypeScript
- [ ] Testar com Evolution API
- [ ] Documentar no README
- [ ] Adicionar testes unitários
- [ ] Validar com dados reais

---

## 🚀 PRÓXIMOS PASSOS

1. **Aprovação do plano** pelo cliente
2. **Priorização** de quais nós implementar primeiro
3. **Setup de ambiente** para testes com Evolution API
4. **Implementação incremental** seguindo as fases
5. **Testes contínuos** a cada nó implementado

---

## 💡 MELHORIAS FUTURAS

- Analytics de performance de cada nó
- A/B testing automático
- Templates prontos de fluxos
- Marketplace de integrações
- Simulador de conversas
- Logs detalhados de execução
- Versionamento de fluxos
- Rollback de mudanças
