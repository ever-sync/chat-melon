# Integração Evolution API - Documentação Completa

## Visão Geral

Esta documentação descreve a integração completa da Evolution API no EvoTalk Gateway, incluindo todas as funcionalidades, fotos de perfil de contatos, envio de mensagens, gerenciamento de grupos e muito mais.

## 📋 Índice

1. [Arquivos Criados](#arquivos-criados)
2. [Funcionalidades Implementadas](#funcionalidades-implementadas)
3. [Configuração](#configuração)
4. [Uso dos Hooks](#uso-dos-hooks)
5. [Componentes](#componentes)
6. [Exemplos de Código](#exemplos-de-código)
7. [Troubleshooting](#troubleshooting)

---

## Arquivos Criados

### 1. **src/services/evolutionApi.ts**
Serviço completo com todas as chamadas da Evolution API v2:
- Gerenciamento de instâncias
- Envio de mensagens (texto, mídia, áudio, localização, contato, reação, enquete, lista)
- Gerenciamento de chat
- **Busca de fotos de perfil** (FEATURE PRIORITÁRIA)
- Configuração de webhooks
- Configurações de instância
- Gerenciamento de perfil
- Gerenciamento de grupos

### 2. **src/hooks/useEvolutionApi.ts**
React hooks para todas as operações da Evolution API:
- `useEvolutionInit()` - Inicializa API com credenciais da empresa
- `useInstances()` - Lista todas as instâncias
- `useCreateInstance()` - Cria nova instância
- `useConnectInstance()` - Conecta instância
- `useDeleteInstance()` - Deleta instância
- `useLogoutInstance()` - Desconecta instância
- `useSendTextMessage()` - Envia mensagem de texto
- `useSendMediaMessage()` - Envia mídia (imagem, vídeo, documento, áudio)
- `useSendAudioMessage()` - Envia áudio do WhatsApp
- `useSendLocationMessage()` - Envia localização
- `useSendContactMessage()` - Envia cartão de contato
- `useSendReactionMessage()` - Envia reação
- `useSendPollMessage()` - Envia enquete
- `useSendListMessage()` - Envia lista
- `useMarkAsRead()` - Marca mensagem como lida
- `useArchiveChat()` - Arquiva conversa
- `useDeleteMessage()` - Deleta mensagem
- `useSendPresence()` - Envia status de presença (digitando, gravando)
- **`useFetchProfilePicture()`** - Busca foto de perfil de um contato
- **`useContactProfilePicture()`** - Hook com cache para foto de perfil
- **`useSyncContactPhotos()`** - Sincroniza fotos de todos os contatos
- `useFindContacts()` - Busca contatos
- `useInstanceSettings()` - Busca configurações da instância
- `useUpdateInstanceSettings()` - Atualiza configurações
- `useWebhookConfig()` - Busca configuração de webhook
- `useUpdateWebhook()` - Atualiza webhook
- `useGroups()` - Lista grupos
- `useCreateGroup()` - Cria grupo
- `useUpdateGroupParticipants()` - Gerencia participantes de grupo

### 3. **src/components/ContactAvatar.tsx**
Componente de avatar de contato com foto de perfil:
- **Busca automática de foto de perfil** da Evolution API
- Estados de loading
- Fallback para iniciais do nome
- Suporte para diferentes tamanhos (sm, md, lg, xl)
- Indicador de status online
- Cache de fotos (24 horas)
- `ContactAvatarGroup` - Componente para grupo de avatares

### 4. **src/components/settings/EvolutionApiConfig.tsx**
Painel de configuração da Evolution API:
- Formulário para URL, API Key e Nome da Instância
- Gerenciamento de instância (criar, conectar, desconectar, deletar)
- Display de QR Code para conexão
- Botão para sincronizar fotos de perfil
- Status da conexão em tempo real
- Link para documentação oficial

### 5. **supabase/migrations/20251128000005_add_evolution_api_config.sql**
Migration para adicionar campos no banco:
- `evolution_api_url` - URL base da API
- `evolution_api_key` - Chave de autenticação
- `evolution_instance_name` - Nome da instância
- `evolution_connected` - Status de conexão
- `evolution_qr_code` - QR Code base64 (temporário)
- `evolution_last_sync` - Última sincronização

---

## Funcionalidades Implementadas

### ✅ Fotos de Perfil (PRIORIDADE)

A funcionalidade de fotos de perfil foi completamente implementada:

**Backend:**
- Endpoint `/chat/fetchProfilePictureUrl/{instance}` integrado
- Cache de fotos no React Query (24 horas)
- Armazenamento de URLs nas queries do cliente

**Frontend:**
- Componente `ContactAvatar` com busca automática
- Busca assíncrona de fotos ao renderizar contatos
- Loading states e fallback para iniciais
- Sincronização em massa com botão dedicado

**Onde as fotos aparecem:**
- ✅ Lista de contatos (`src/pages/Contacts.tsx`)
- ✅ Painel de detalhes do contato (`src/components/chat/ContactDetailPanel.tsx`)
- ✅ Qualquer lugar que use `ContactAvatar`

### ✅ Envio de Mensagens

Todos os tipos de mensagens suportados:
- Texto simples com preview de link
- Mídia (imagem, vídeo, áudio, documento)
- Áudio do WhatsApp
- Localização com nome e endereço
- Cartão de contato
- Reações
- Enquetes
- Listas interativas
- Templates do WhatsApp Business

### ✅ Gerenciamento de Chat

- Verificar números do WhatsApp
- Marcar mensagens como lidas
- Arquivar/desarquivar conversas
- Deletar mensagens
- Enviar status de presença (digitando, gravando, pausado)
- Buscar contatos
- Buscar mensagens

### ✅ Gerenciamento de Instância

- Criar nova instância
- Conectar instância (com QR Code)
- Desconectar/logout
- Deletar instância
- Reiniciar instância
- Listar instâncias

### ✅ Configurações

- Configurações de instância (rejeitar chamadas, sempre online, ler mensagens, etc.)
- Configurações de privacidade
- Webhooks
- Atualizar nome/status/foto de perfil

### ✅ Grupos

- Criar grupo
- Atualizar foto/nome/descrição do grupo
- Listar grupos
- Adicionar/remover participantes
- Promover/rebaixar admin
- Buscar informações do grupo
- Código de convite
- Configurações de grupo (mensagens, edição)
- Mensagens efêmeras

---

## Configuração

### 1. Rodar Migration

```bash
# Aplicar migration para adicionar campos Evolution API
supabase db push
```

### 2. Configurar Evolution API no Painel

1. Acesse o painel de configurações (onde `EvolutionApiConfig` está renderizado)
2. Preencha os campos:
   - **URL da API**: Ex: `https://api.evolutionapi.com`
   - **API Key**: Sua chave de autenticação
   - **Nome da Instância**: Nome único (ex: `minha-empresa`)
3. Clique em "Salvar Configuração"

### 3. Criar e Conectar Instância

1. Clique em "Criar Instância"
2. Escaneie o QR Code que aparecerá
3. Aguarde a conexão ser estabelecida
4. Status mudará para "Conectado" 🟢

### 4. Sincronizar Fotos de Perfil

1. Com a instância conectada, clique em "Sincronizar Fotos de Perfil"
2. O sistema irá:
   - Buscar todos os contatos da instância
   - Buscar a foto de perfil de cada contato
   - Cachear as fotos no React Query
3. As fotos aparecerão automaticamente nos avatares

---

## Uso dos Hooks

### Inicializar Evolution API

```tsx
import { useEvolutionInit } from '@/hooks/useEvolutionApi';

function MyComponent() {
  const { data: initialized, isLoading, error } = useEvolutionInit();

  if (isLoading) return <div>Inicializando...</div>;
  if (error) return <div>Erro ao inicializar</div>;
  if (!initialized) return <div>Não inicializado</div>;

  return <div>Evolution API pronta!</div>;
}
```

### Buscar Foto de Perfil

```tsx
import { useContactProfilePicture } from '@/hooks/useEvolutionApi';

function ContactPhoto({ phoneNumber }: { phoneNumber: string }) {
  const { currentCompany } = useCompany();
  const { data: photoUrl, isLoading } = useContactProfilePicture(
    currentCompany?.evolution_instance_name || '',
    phoneNumber
  );

  if (isLoading) return <div>Carregando foto...</div>;

  return (
    <img
      src={photoUrl || '/default-avatar.png'}
      alt="Contact"
    />
  );
}
```

### Enviar Mensagem de Texto

```tsx
import { useSendTextMessage } from '@/hooks/useEvolutionApi';

function SendMessage() {
  const { currentCompany } = useCompany();
  const sendMessage = useSendTextMessage(
    currentCompany?.evolution_instance_name || ''
  );

  const handleSend = () => {
    sendMessage.mutate({
      number: '5511999999999',
      text: 'Olá! Esta é uma mensagem de teste.',
      linkPreview: true,
    });
  };

  return (
    <button onClick={handleSend} disabled={sendMessage.isPending}>
      {sendMessage.isPending ? 'Enviando...' : 'Enviar Mensagem'}
    </button>
  );
}
```

### Sincronizar Fotos de Todos os Contatos

```tsx
import { useSyncContactPhotos } from '@/hooks/useEvolutionApi';

function SyncPhotosButton() {
  const { currentCompany } = useCompany();
  const syncPhotos = useSyncContactPhotos(
    currentCompany?.evolution_instance_name || ''
  );

  const handleSync = () => {
    syncPhotos.mutate();
  };

  return (
    <button onClick={handleSync} disabled={syncPhotos.isPending}>
      {syncPhotos.isPending ? 'Sincronizando...' : 'Sincronizar Fotos'}
    </button>
  );
}
```

### Enviar Mídia

```tsx
import { useSendMediaMessage } from '@/hooks/useEvolutionApi';

function SendImage() {
  const { currentCompany } = useCompany();
  const sendMedia = useSendMediaMessage(
    currentCompany?.evolution_instance_name || ''
  );

  const handleSend = () => {
    sendMedia.mutate({
      number: '5511999999999',
      mediatype: 'image',
      media: 'https://example.com/image.jpg', // ou base64
      caption: 'Confira esta imagem!',
    });
  };

  return (
    <button onClick={handleSend}>
      Enviar Imagem
    </button>
  );
}
```

### Gerenciar Grupo

```tsx
import {
  useCreateGroup,
  useUpdateGroupParticipants
} from '@/hooks/useEvolutionApi';

function GroupManager() {
  const { currentCompany } = useCompany();
  const instanceName = currentCompany?.evolution_instance_name || '';

  const createGroup = useCreateGroup(instanceName);
  const updateParticipants = useUpdateGroupParticipants(instanceName);

  const handleCreateGroup = () => {
    createGroup.mutate({
      subject: 'Meu Grupo',
      description: 'Descrição do grupo',
      participants: ['5511999999999', '5511888888888'],
    });
  };

  const handleAddParticipant = (groupJid: string) => {
    updateParticipants.mutate({
      groupJid,
      action: 'add',
      participants: ['5511777777777'],
    });
  };

  return (
    <div>
      <button onClick={handleCreateGroup}>Criar Grupo</button>
    </div>
  );
}
```

---

## Componentes

### ContactAvatar

Componente para exibir avatar de contato com foto de perfil.

**Props:**

```tsx
interface ContactAvatarProps {
  phoneNumber: string;           // Número do contato
  name?: string;                 // Nome (para fallback de iniciais)
  instanceName: string;          // Nome da instância Evolution API
  profilePictureUrl?: string | null;  // URL pré-carregada (opcional)
  size?: 'sm' | 'md' | 'lg' | 'xl';   // Tamanho do avatar
  className?: string;            // Classes CSS adicionais
  showOnline?: boolean;          // Mostrar indicador online
  isOnline?: boolean;            // Status online
}
```

**Exemplo de uso:**

```tsx
import { ContactAvatar } from '@/components/ContactAvatar';

function ContactCard({ contact }: { contact: Contact }) {
  const { currentCompany } = useCompany();

  return (
    <div className="flex items-center gap-3">
      <ContactAvatar
        phoneNumber={contact.phone_number}
        name={contact.name}
        instanceName={currentCompany?.evolution_instance_name || ''}
        size="md"
        showOnline={true}
        isOnline={contact.is_online}
      />
      <div>
        <p className="font-medium">{contact.name}</p>
        <p className="text-sm text-muted-foreground">{contact.phone_number}</p>
      </div>
    </div>
  );
}
```

### ContactAvatarGroup

Componente para exibir grupo de avatares sobrepostos.

**Props:**

```tsx
interface ContactAvatarGroupProps {
  contacts: Array<{
    phoneNumber: string;
    name?: string;
    profilePictureUrl?: string | null;
  }>;
  instanceName: string;
  maxVisible?: number;  // Máximo de avatares visíveis
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}
```

**Exemplo:**

```tsx
import { ContactAvatarGroup } from '@/components/ContactAvatar';

function GroupMembers({ members }: { members: Contact[] }) {
  const { currentCompany } = useCompany();

  return (
    <ContactAvatarGroup
      contacts={members.map(m => ({
        phoneNumber: m.phone_number,
        name: m.name,
      }))}
      instanceName={currentCompany?.evolution_instance_name || ''}
      maxVisible={3}
      size="sm"
    />
  );
}
```

### EvolutionApiConfig

Painel de configuração completo da Evolution API.

**Onde adicionar:**

```tsx
// Em um página de configurações
import { EvolutionApiConfig } from '@/components/settings/EvolutionApiConfig';

export default function Settings() {
  return (
    <div>
      <h1>Configurações</h1>
      <EvolutionApiConfig />
    </div>
  );
}
```

---

## Exemplos de Código

### Exemplo Completo: Enviar Diferentes Tipos de Mensagens

```tsx
import {
  useSendTextMessage,
  useSendMediaMessage,
  useSendLocationMessage,
  useSendPollMessage,
} from '@/hooks/useEvolutionApi';

function MessageSender({ phoneNumber }: { phoneNumber: string }) {
  const { currentCompany } = useCompany();
  const instanceName = currentCompany?.evolution_instance_name || '';

  const sendText = useSendTextMessage(instanceName);
  const sendMedia = useSendMediaMessage(instanceName);
  const sendLocation = useSendLocationMessage(instanceName);
  const sendPoll = useSendPollMessage(instanceName);

  const handleSendText = () => {
    sendText.mutate({
      number: phoneNumber,
      text: 'Olá! Como posso ajudar?',
      linkPreview: true,
    });
  };

  const handleSendImage = () => {
    sendMedia.mutate({
      number: phoneNumber,
      mediatype: 'image',
      media: 'https://example.com/promo.jpg',
      caption: 'Confira nossa promoção!',
    });
  };

  const handleSendLocation = () => {
    sendLocation.mutate({
      number: phoneNumber,
      latitude: -23.550520,
      longitude: -46.633308,
      name: 'Nossa Loja',
      address: 'Av. Paulista, 1000 - São Paulo',
    });
  };

  const handleSendPoll = () => {
    sendPoll.mutate({
      number: phoneNumber,
      name: 'Qual produto você prefere?',
      selectableCount: 1,
      values: ['Produto A', 'Produto B', 'Produto C'],
    });
  };

  return (
    <div className="flex gap-2">
      <button onClick={handleSendText}>Texto</button>
      <button onClick={handleSendImage}>Imagem</button>
      <button onClick={handleSendLocation}>Localização</button>
      <button onClick={handleSendPoll}>Enquete</button>
    </div>
  );
}
```

### Exemplo Completo: Componente de Chat com Fotos

```tsx
import { ContactAvatar } from '@/components/ContactAvatar';
import { useSendTextMessage, useMarkAsRead } from '@/hooks/useEvolutionApi';

function ChatWindow({ conversation }: { conversation: Conversation }) {
  const { currentCompany } = useCompany();
  const instanceName = currentCompany?.evolution_instance_name || '';

  const sendMessage = useSendTextMessage(instanceName);
  const markAsRead = useMarkAsRead(instanceName);

  useEffect(() => {
    // Marcar como lida ao abrir
    markAsRead.mutate(conversation.contact_number);
  }, [conversation.id]);

  return (
    <div className="flex flex-col h-full">
      {/* Header com avatar */}
      <div className="flex items-center gap-3 p-4 border-b">
        <ContactAvatar
          phoneNumber={conversation.contact_number}
          name={conversation.contact_name}
          instanceName={instanceName}
          size="md"
          showOnline={true}
          isOnline={conversation.is_online}
        />
        <div>
          <h3 className="font-semibold">{conversation.contact_name}</h3>
          <p className="text-sm text-muted-foreground">
            {conversation.is_online ? 'Online' : 'Offline'}
          </p>
        </div>
      </div>

      {/* Mensagens */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* ... lista de mensagens ... */}
      </div>

      {/* Input */}
      <div className="p-4 border-t">
        {/* ... input de mensagem ... */}
      </div>
    </div>
  );
}
```

---

## Troubleshooting

### Fotos de perfil não aparecem

**Possíveis causas:**

1. **Instância não conectada**
   - Verifique se o status está "Conectado" no painel
   - Tente reconectar a instância

2. **instanceName não configurado**
   - Verifique se `currentCompany.evolution_instance_name` está preenchido
   - Configure no painel de Evolution API

3. **Número de telefone inválido**
   - Verifique o formato: `5511999999999` (código do país + DDD + número)
   - Não use caracteres especiais

4. **Contato não tem foto**
   - Alguns contatos podem não ter foto de perfil
   - O componente mostrará as iniciais como fallback

### Erro ao enviar mensagens

**Possíveis causas:**

1. **API Key inválida**
   - Verifique a chave no painel de configurações
   - Gere uma nova chave se necessário

2. **Instância desconectada**
   - Reconecte a instância
   - Aguarde o QR Code e escaneie novamente

3. **Número inválido**
   - Use formato internacional: `5511999999999`
   - Verifique se o número existe no WhatsApp com `whatsappNumbers` endpoint

### Sincronização de fotos lenta

**Causas e soluções:**

1. **Muitos contatos**
   - A sincronização é assíncrona e pode demorar
   - O progresso é exibido em toast

2. **Rate limiting da API**
   - A Evolution API pode ter limites de requisições
   - As fotos são cacheadas por 24 horas

3. **Erros em alguns contatos**
   - Alguns contatos podem falhar (sem foto, bloqueados, etc.)
   - O sistema continua com os próximos

### Instância não conecta

**Soluções:**

1. Verifique o QR Code:
   - O QR Code expira após alguns minutos
   - Clique em "Conectar" novamente para gerar novo QR

2. WhatsApp Web/Desktop:
   - Desconecte outros dispositivos se atingir o limite
   - Tente novamente após alguns minutos

3. Rede/Firewall:
   - Verifique se a URL da Evolution API está acessível
   - Teste com cURL ou Postman

---

## Estrutura de Dados

### Banco de Dados (companies table)

```sql
evolution_api_url VARCHAR       -- URL base da Evolution API
evolution_api_key VARCHAR       -- Chave de autenticação
evolution_instance_name VARCHAR -- Nome da instância
evolution_connected BOOLEAN     -- Status de conexão
evolution_qr_code TEXT         -- QR Code base64 (temporário)
evolution_last_sync TIMESTAMP  -- Última sincronização
```

### Cache do React Query

```typescript
// Foto de perfil de contato (TTL: 24h, GC: 7 dias)
['contact-profile-picture', instanceName, phoneNumber]

// Lista de contatos (TTL: 5min)
['evolution-contacts', instanceName, filter?]

// Lista de instâncias (Refetch: 30s)
['evolution-instances']

// Configurações (TTL: 5min)
['evolution-settings', instanceName]
['evolution-webhook', instanceName]

// Grupos (TTL: 5min)
['evolution-groups', instanceName]
```

---

## Próximos Passos

### Funcionalidades Futuras

1. **Webhook Listener**
   - Receber eventos em tempo real (mensagens, status, etc.)
   - Atualizar conversas automaticamente

2. **Templates do WhatsApp Business**
   - Interface para criar e enviar templates
   - Gestão de variáveis dinâmicas

3. **Estatísticas e Analytics**
   - Métricas de mensagens enviadas/recebidas
   - Taxa de resposta
   - Horários de pico

4. **Atualização Automática de Fotos**
   - Job para atualizar fotos periodicamente
   - Detectar quando contato muda foto

5. **Multi-instâncias**
   - Suporte para múltiplas instâncias por empresa
   - Seleção de instância por contexto

---

## Suporte

Para mais informações:

- **Documentação Evolution API**: https://doc.evolution-api.com
- **GitHub do Projeto**: [Link do seu repositório]
- **Issues e Bugs**: [Link para issues]

---

**Última atualização**: 28/11/2025
**Versão da Evolution API**: v2
**Autor**: Claude (Anthropic)
