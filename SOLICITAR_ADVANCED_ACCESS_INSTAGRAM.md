# 📋 Guia: Solicitar Advanced Access - Instagram Manage Messages

## 🎯 Objetivo

Obter aprovação do Facebook para acessar nomes e fotos de perfil dos usuários que enviam mensagens pelo Instagram DM.

---

## 📝 Passo a Passo

### 1. Acessar o Facebook App Dashboard

1. Acesse: https://developers.facebook.com/apps
2. Faça login com sua conta Facebook
3. Selecione seu app (o app usado para conectar o Instagram)

### 2. Ir para App Review

1. No menu lateral esquerdo, clique em **"App Review"**
2. Clique em **"Permissions and Features"**

### 3. Localizar a Permissão

1. Procure por: **`instagram_manage_messages`**
2. Você verá o status atual: **"Standard Access"** ou **"No Access"**
3. Clique no botão **"Request Advanced Access"**

### 4. Preencher o Formulário

O Facebook vai pedir informações sobre como você usa a permissão. Use as respostas abaixo:

---

## ✍️ Respostas Sugeridas para o Formulário

### **Pergunta 1: "Como você usa esta permissão?"**

**Resposta sugerida (em inglês):**

```
Our application is a customer service and messaging platform that helps businesses
manage conversations with their customers across multiple channels, including Instagram
Direct Messages.

We use the instagram_manage_messages permission to:

1. Receive and respond to customer messages sent via Instagram DM
2. Display customer profile information (name and profile picture) to our support agents
3. Provide a unified inbox for businesses to manage all customer communications

The permission is essential for our customer service representatives to:
- Identify who they are talking to (customer name)
- Provide personalized support
- Maintain conversation history with proper customer identification
```

**Tradução:**
```
Nossa aplicação é uma plataforma de atendimento ao cliente e mensagens que ajuda
empresas a gerenciar conversas com seus clientes através de múltiplos canais,
incluindo Instagram Direct Messages.

Usamos a permissão instagram_manage_messages para:

1. Receber e responder mensagens de clientes enviadas via Instagram DM
2. Exibir informações do perfil do cliente (nome e foto) para nossos agentes
3. Fornecer uma caixa de entrada unificada para empresas gerenciarem comunicações

A permissão é essencial para que nossos representantes de atendimento possam:
- Identificar com quem estão conversando (nome do cliente)
- Fornecer suporte personalizado
- Manter histórico de conversas com identificação correta do cliente
```

---

### **Pergunta 2: "Forneça instruções passo a passo de como usar esta funcionalidade"**

**Resposta sugerida (em inglês):**

```
Step-by-step user flow:

1. Business owner logs into our platform (https://[SEU_DOMINIO])
2. Goes to "Channels" section and clicks "Connect Instagram"
3. Authorizes our app via Facebook OAuth
4. Our app receives the page access token and Instagram account ID
5. When a customer sends a message to the business's Instagram account:
   - Our webhook receives the message (instagram-webhook endpoint)
   - We fetch the sender's profile (name, username, profile picture) using Instagram Graph API
   - We display the message in our unified inbox with customer's name and photo
   - Support agent can see who sent the message and respond appropriately
6. Agent types a response and sends it back via Instagram DM
7. Customer receives the response on Instagram

This permission is critical for step 5 - without it, we cannot display customer
names and profile pictures, which severely impacts the quality of customer service.
```

**Tradução:**
```
Fluxo passo a passo do usuário:

1. Dono da empresa faz login na nossa plataforma
2. Vai para seção "Canais" e clica em "Conectar Instagram"
3. Autoriza nosso app via OAuth do Facebook
4. Nosso app recebe o token de acesso e ID da conta Instagram
5. Quando um cliente envia mensagem para a conta Instagram da empresa:
   - Nosso webhook recebe a mensagem
   - Buscamos o perfil do remetente (nome, username, foto) via Instagram Graph API
   - Exibimos a mensagem na caixa de entrada com nome e foto do cliente
   - Agente pode ver quem enviou a mensagem e responder apropriadamente
6. Agente digita uma resposta e envia de volta via Instagram DM
7. Cliente recebe a resposta no Instagram

Esta permissão é crítica para o passo 5 - sem ela, não podemos exibir nomes
e fotos dos clientes, o que impacta severamente a qualidade do atendimento.
```

---

### **Pergunta 3: "Forneça um vídeo de demonstração" (se solicitado)**

**Opções:**

1. **Criar um vídeo screencast mostrando:**
   - Login na plataforma
   - Conectar Instagram
   - Receber uma mensagem
   - Ver o nome do cliente (use uma conta de teste)
   - Responder a mensagem

2. **Usar ferramentas:**
   - OBS Studio (gratuito): https://obsproject.com/
   - Loom (fácil de usar): https://loom.com/
   - ShareX (Windows): https://getsharex.com/

3. **Dicas para o vídeo:**
   - Duração: 2-3 minutos
   - Mostre o fluxo completo
   - Fale em inglês ou adicione legendas
   - Destaque onde o nome/foto do usuário aparece

---

### **Pergunta 4: "URL do site/aplicativo"**

```
https://[SEU_DOMINIO]
```

Se não tiver domínio em produção ainda:
```
https://nmbiuebxhovmwxrbaxsz.supabase.co
```

---

### **Pergunta 5: "URL da Política de Privacidade"**

**Você PRECISA ter uma política de privacidade pública!**

**Opção 1: Criar uma página simples**

Crie um arquivo `privacy-policy.html` e hospede em:
- Vercel (gratuito)
- Netlify (gratuito)
- GitHub Pages (gratuito)
- Seu próprio domínio

**Opção 2: Usar geradores online**
- https://www.termsfeed.com/privacy-policy-generator/
- https://www.freeprivacypolicy.com/

**Pontos importantes a incluir:**
- Que você coleta mensagens do Instagram
- Que você armazena nome e foto de perfil
- Como você usa esses dados (atendimento ao cliente)
- Que você não compartilha dados com terceiros
- Como usuários podem solicitar exclusão de dados

---

## 📸 Screenshots Necessários

O Facebook pode pedir screenshots. Prepare:

1. **Tela de login** da sua plataforma
2. **Página de canais** mostrando botão "Conectar Instagram"
3. **Fluxo OAuth** do Facebook
4. **Inbox com mensagens** do Instagram (mesmo que com nome genérico por enquanto)
5. **Mensagem sendo respondida**

---

## ⏱️ Tempo de Aprovação

- **Normal:** 1-3 dias úteis
- **Com problemas:** 1-2 semanas (se pedirem mais informações)
- **Rejeição:** Você pode reenviar com mais detalhes

---

## 🚨 Motivos Comuns de Rejeição

1. **Falta de política de privacidade**
2. **Descrição vaga de uso**
3. **App não funcional/testável**
4. **Vídeo de demonstração confuso**
5. **Não explicar claramente POR QUE precisa da permissão**

---

## ✅ Checklist Antes de Enviar

- [ ] Política de privacidade criada e URL válida
- [ ] Descrição clara do uso da permissão
- [ ] Fluxo passo a passo detalhado
- [ ] Screenshots preparados
- [ ] Vídeo de demonstração (se solicitado)
- [ ] App testável (pelo menos com usuários de teste)

---

## 🔄 Solução Temporária (Enquanto Aguarda Aprovação)

### Adicionar Usuários de Teste

1. Vá para: https://developers.facebook.com/apps/[SEU_APP_ID]/roles/roles/
2. Clique em **"Add Testers"**
3. Digite o Instagram username ou Facebook ID
4. A pessoa precisa aceitar o convite
5. Após aceitar, ela poderá enviar mensagens e você verá o nome real!

**Como a pessoa aceita:**
1. Acessa: https://developers.facebook.com/apps/
2. Clica em "Invitations" no topo
3. Aceita o convite

---

## 📞 Suporte

Se for rejeitado:
1. Leia atentamente o motivo da rejeição
2. Corrija os pontos mencionados
3. Reenvie a solicitação com mais detalhes
4. Você pode enviar quantas vezes precisar!

---

## 🎯 Resultado Esperado

Após aprovação:
- ✅ Nomes reais dos usuários aparecerão no chat
- ✅ Fotos de perfil serão exibidas
- ✅ Melhor experiência de atendimento
- ✅ Funciona para QUALQUER usuário do Instagram (não só testadores)

---

**Boa sorte! 🍀**

**Prazo estimado:** 1-3 dias úteis após envio

**Dúvidas?** Consulte a documentação oficial:
https://developers.facebook.com/docs/app-review
