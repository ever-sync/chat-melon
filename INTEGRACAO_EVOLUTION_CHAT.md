# 🔗 Integração Evolution API com Chat - Guia Completo

## ❌ Problema Atual

O chat está funcionando apenas com o banco de dados Supabase, mas **NÃO está usando a Evolution API** para:
- ✅ Enviar mensagens de texto de verdade
- ✅ Enviar áudio
- ✅ Fazer chamadas de voz/vídeo
- ✅ Enviar enquetes (polls)
- ✅ Enviar listas
- ✅ Enviar localização
- ✅ Enviar contatos
- ✅ Mostrar fotos de perfil

## ✅ Solução: Integrar os Hooks da Evolution API

Todos os hooks já foram criados em `src/hooks/useEvolutionApi.ts`. Agora precisamos usá-los no chat.

---

## 📦 Parte 1: MessageArea.tsx - Envio de Mensagens

### 1.1 Adicionar Imports

**Arquivo**: `src/components/chat/MessageArea.tsx`

**Linha 2**: Adicionar ícones de chamada:
```typescript
import { ArrowLeft, Send, Info, RotateCcw, Tag, ArrowRightLeft, EyeOff, Bot, Phone, Video } from "lucide-react";
```

**Linha 26**: Adicionar hooks da Evolution API:
```typescript
import { useSendTextMessage, useStartCall } from "@/hooks/useEvolutionApi";
import { useCompany } from "@/contexts/CompanyContext";
```

### 1.2 Usar os Hooks

**Linha 59**: Adicionar após `const { markAsRead } = useMarkAsRead();`:

```typescript
const { currentCompany } = useCompany();
const sendTextMessage = useSendTextMessage();
const startCall = useStartCall();
```

### 1.3 Substituir handleSendMessage

**Substituir a função handleSendMessage (linhas 218-302)** por esta nova versão:

```typescript
const handleSendMessage = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!newMessage.trim() || !conversation || isSending) return;

  setIsSending(true);
  const processedMessage = replaceVariables(newMessage);
  const messageToSend = processedMessage;
  setNewMessage("");
  setSelectedTemplateId(null);

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Usuário não autenticado");

    // Se for nota interna, salvar direto no banco
    if (isInternalNote) {
      const { data: companyUser } = await supabase
        .from("company_users")
        .select("company_id")
        .eq("user_id", user.id)
        .eq("is_default", true)
        .maybeSingle();

      const { error } = await supabase.from("messages").insert({
        conversation_id: conversation.id,
        user_id: user.id,
        company_id: companyUser?.company_id || null,
        content: messageToSend,
        is_from_me: true,
        message_type: "internal_note",
        status: "sent",
      });

      if (error) throw error;

      toast.success("Nota interna adicionada", {
        description: "Sua nota foi salva e só é visível para a equipe"
      });

      setIsInternalNote(false);
      return;
    }

    // Mensagem normal via Evolution API
    if (!currentCompany?.evolution_instance_name) {
      throw new Error("Evolution API não configurada. Configure em Configurações");
    }

    // Mensagem temporária (otimista)
    const tempMessage: Message = {
      id: `temp-${Date.now()}`,
      content: messageToSend,
      is_from_me: true,
      timestamp: new Date().toISOString(),
      status: "sending",
    };

    setMessages((prev) => [...prev, tempMessage]);

    // Enviar via Evolution API
    await sendTextMessage.mutateAsync({
      instanceName: currentCompany.evolution_instance_name,
      data: {
        number: conversation.contact_number,
        text: messageToSend,
      },
    });

    // Salvar no banco de dados
    const { data: companyUser } = await supabase
      .from("company_users")
      .select("company_id")
      .eq("user_id", user.id)
      .eq("is_default", true)
      .maybeSingle();

    await supabase.from("messages").insert({
      conversation_id: conversation.id,
      user_id: user.id,
      company_id: companyUser?.company_id || null,
      content: messageToSend,
      is_from_me: true,
      message_type: "text",
      status: "sent",
    });

    // Atualizar última mensagem da conversa
    await supabase
      .from("conversations")
      .update({
        last_message: messageToSend,
        last_message_time: new Date().toISOString(),
      })
      .eq("id", conversation.id);

    // Remover mensagem temporária
    setMessages((prev) => prev.filter((m) => !m.id.startsWith("temp-")));

    toast.success("Mensagem enviada!");
  } catch (error) {
    console.error("Erro ao enviar mensagem:", error);
    setNewMessage(messageToSend);

    setMessages((prev) =>
      prev.filter((m) => !m.id.startsWith("temp-"))
    );

    toast.error(error instanceof Error ? error.message : "Não foi possível enviar a mensagem");
  } finally {
    setIsSending(false);
  }
};
```

### 1.4 Adicionar Funções de Chamada

**Adicionar após handleSendMessage (linha 303)**:

```typescript
const handleVoiceCall = async () => {
  if (!currentCompany?.evolution_instance_name) {
    toast.error("Evolution API não configurada");
    return;
  }

  try {
    await startCall.mutateAsync({
      instanceName: currentCompany.evolution_instance_name,
      data: {
        number: conversation!.contact_number,
        isVideo: false,
      },
    });

    toast.success("Chamada de voz iniciada!");
  } catch (error) {
    console.error("Erro ao iniciar chamada:", error);
    toast.error("Não foi possível iniciar a chamada de voz");
  }
};

const handleVideoCall = async () => {
  if (!currentCompany?.evolution_instance_name) {
    toast.error("Evolution API não configurada");
    return;
  }

  try {
    await startCall.mutateAsync({
      instanceName: currentCompany.evolution_instance_name,
      data: {
        number: conversation!.contact_number,
        isVideo: true,
      },
    });

    toast.success("Chamada de vídeo iniciada!");
  } catch (error) {
    console.error("Erro ao iniciar chamada:", error);
    toast.error("Não foi possível iniciar a chamada de vídeo");
  }
};
```

### 1.5 Adicionar Botões de Chamada

**Encontrar a linha 443** (onde está `<InteractiveMessageSender>`) e adicionar ANTES dela:

```typescript
<div className="flex gap-2">
  <Button
    type="button"
    size="icon"
    variant="ghost"
    onClick={handleVoiceCall}
    title="Chamada de voz"
    className="rounded-full hover:bg-green-100 dark:hover:bg-green-900"
    disabled={!currentCompany?.evolution_instance_name}
  >
    <Phone className="w-5 h-5 text-green-600 dark:text-green-400" />
  </Button>
  <Button
    type="button"
    size="icon"
    variant="ghost"
    onClick={handleVideoCall}
    title="Chamada de vídeo"
    className="rounded-full hover:bg-blue-100 dark:hover:bg-blue-900"
    disabled={!currentCompany?.evolution_instance_name}
  >
    <Video className="w-5 h-5 text-blue-600 dark:text-blue-400" />
  </Button>
</div>
```

---

## 📦 Parte 2: AudioRecorder.tsx - Envio de Áudio

### 2.1 Modificar AudioRecorder

**Arquivo**: `src/components/chat/AudioRecorder.tsx`

**Adicionar imports**:
```typescript
import { useSendAudioMessage } from "@/hooks/useEvolutionApi";
import { useCompany } from "@/contexts/CompanyContext";
```

**Adicionar hooks no início do componente**:
```typescript
const { currentCompany } = useCompany();
const sendAudioMessage = useSendAudioMessage();
```

**Modificar a função que envia o áudio** para usar Evolution API:

```typescript
const sendAudio = async (audioBlob: Blob) => {
  if (!currentCompany?.evolution_instance_name) {
    toast.error("Evolution API não configurada");
    return;
  }

  try {
    // Converter Blob para Base64
    const reader = new FileReader();
    reader.readAsDataURL(audioBlob);

    await new Promise((resolve, reject) => {
      reader.onloadend = async () => {
        try {
          const base64Audio = (reader.result as string).split(',')[1];

          // Enviar via Evolution API
          await sendAudioMessage.mutateAsync({
            instanceName: currentCompany.evolution_instance_name!,
            data: {
              number: contactNumber,
              audio: base64Audio,
            },
          });

          toast.success("Áudio enviado!");
          onSent?.();
          resolve(true);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
    });
  } catch (error) {
    console.error("Erro ao enviar áudio:", error);
    toast.error("Não foi possível enviar o áudio");
  }
};
```

---

## 📦 Parte 3: InteractiveMessageSender.tsx - Enquetes e Listas

### 3.1 Modificar InteractiveMessageSender

**Arquivo**: `src/components/chat/InteractiveMessageSender.tsx`

**Adicionar imports**:
```typescript
import { useSendPoll, useSendList } from "@/hooks/useEvolutionApi";
import { useCompany } from "@/contexts/CompanyContext";
```

**Adicionar hooks**:
```typescript
const { currentCompany } = useCompany();
const sendPoll = useSendPoll();
const sendList = useSendList();
```

**Adicionar função para enviar enquete**:
```typescript
const handleSendPoll = async (pollData: {
  name: string;
  options: string[];
  selectableCount?: number;
}) => {
  if (!currentCompany?.evolution_instance_name || !conversationNumber) {
    toast.error("Evolution API não configurada");
    return;
  }

  try {
    await sendPoll.mutateAsync({
      instanceName: currentCompany.evolution_instance_name,
      data: {
        number: conversationNumber,
        name: pollData.name,
        selectableCount: pollData.selectableCount || 1,
        values: pollData.options,
      },
    });

    toast.success("Enquete enviada!");
  } catch (error) {
    console.error("Erro ao enviar enquete:", error);
    toast.error("Não foi possível enviar a enquete");
  }
};
```

**Adicionar função para enviar lista**:
```typescript
const handleSendList = async (listData: {
  title: string;
  description?: string;
  buttonText: string;
  footerText?: string;
  sections: Array<{
    title: string;
    rows: Array<{ title: string; description?: string; rowId: string }>;
  }>;
}) => {
  if (!currentCompany?.evolution_instance_name || !conversationNumber) {
    toast.error("Evolution API não configurada");
    return;
  }

  try {
    await sendList.mutateAsync({
      instanceName: currentCompany.evolution_instance_name,
      data: {
        number: conversationNumber,
        title: listData.title,
        description: listData.description,
        buttonText: listData.buttonText,
        footerText: listData.footerText,
        sections: listData.sections,
      },
    });

    toast.success("Lista enviada!");
  } catch (error) {
    console.error("Erro ao enviar lista:", error);
    toast.error("Não foi possível enviar a lista");
  }
};
```

---

## 📦 Parte 4: MediaUpload.tsx - Envio de Imagens/Vídeos

### 4.1 Modificar MediaUpload

**Arquivo**: `src/components/chat/MediaUpload.tsx`

**Adicionar imports**:
```typescript
import { useSendMediaMessage } from "@/hooks/useEvolutionApi";
import { useCompany } from "@/contexts/CompanyContext";
```

**Adicionar hooks**:
```typescript
const { currentCompany } = useCompany();
const sendMediaMessage = useSendMediaMessage();
```

**Modificar upload para usar Evolution API**:
```typescript
const handleFileUpload = async (file: File) => {
  if (!currentCompany?.evolution_instance_name || !conversationNumber) {
    toast.error("Evolution API não configurada");
    return;
  }

  try {
    // Converter arquivo para Base64
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = (reader.result as string).split(',')[1];
        resolve(base64String);
      };
      reader.onerror = reject;
    });

    // Detectar tipo de mídia
    const mediaType = file.type.startsWith('image/') ? 'image' :
                     file.type.startsWith('video/') ? 'video' :
                     file.type.startsWith('audio/') ? 'audio' : 'document';

    // Enviar via Evolution API
    await sendMediaMessage.mutateAsync({
      instanceName: currentCompany.evolution_instance_name,
      data: {
        number: conversationNumber,
        mediatype: mediaType,
        media: base64,
        fileName: file.name,
        caption: caption || undefined,
      },
    });

    toast.success(`${mediaType} enviado(a)!`);
    onMediaSent?.();
  } catch (error) {
    console.error("Erro ao enviar mídia:", error);
    toast.error("Não foi possível enviar o arquivo");
  }
};
```

---

## 📦 Parte 5: ContactAvatar - Mostrar Fotos

### 5.1 Já está implementado!

O componente `ContactAvatar` já foi criado e usa automaticamente a Evolution API para buscar fotos.

**Onde usar**:
- ✅ Já usado em `Contacts.tsx`
- ✅ Já usado em `ContactDetailPanel.tsx`
- ⚠️ **Falta usar em `ConversationList.tsx`**

### 5.2 Modificar ConversationList

**Arquivo**: `src/components/chat/ConversationList.tsx`

**Adicionar import**:
```typescript
import { ContactAvatar } from "@/components/ContactAvatar";
import { useCompany } from "@/contexts/CompanyContext";
```

**Adicionar hook**:
```typescript
const { currentCompany } = useCompany();
```

**Substituir o Avatar atual** por ContactAvatar:

**ANTES**:
```typescript
<Avatar className="w-12 h-12">
  <AvatarImage src={conv.profile_pic_url} />
  <AvatarFallback>
    {conv.contact_name.slice(0, 2).toUpperCase()}
  </AvatarFallback>
</Avatar>
```

**DEPOIS**:
```typescript
<ContactAvatar
  phoneNumber={conv.contact_number}
  name={conv.contact_name}
  instanceName={currentCompany?.evolution_instance_name || ''}
  profilePictureUrl={conv.profile_pic_url}
  size="md"
  showOnline={true}
  isOnline={conv.is_online}
/>
```

---

## 📦 Parte 6: MessageBubble - Exibir Diferentes Tipos de Mensagem

### 6.1 Modificar MessageBubble

**Arquivo**: `src/components/chat/MessageBubble.tsx`

Adicionar suporte para exibir:
- ✅ Áudio
- ✅ Imagens
- ✅ Vídeos
- ✅ Documentos
- ✅ Localização
- ✅ Contatos
- ✅ Enquetes
- ✅ Listas

**Código exemplo**:

```typescript
// Renderizar diferentes tipos de mensagem
const renderMessageContent = () => {
  // Áudio
  if (message.message_type === 'audio' && message.media_url) {
    return (
      <audio controls className="w-full max-w-sm">
        <source src={message.media_url} type="audio/ogg" />
      </audio>
    );
  }

  // Imagem
  if (message.message_type === 'image' && message.media_url) {
    return (
      <img
        src={message.media_url}
        alt="Imagem"
        className="max-w-sm rounded-lg cursor-pointer hover:opacity-90"
        onClick={() => window.open(message.media_url, '_blank')}
      />
    );
  }

  // Vídeo
  if (message.message_type === 'video' && message.media_url) {
    return (
      <video controls className="max-w-sm rounded-lg">
        <source src={message.media_url} />
      </video>
    );
  }

  // Localização
  if (message.message_type === 'location' && message.location_data) {
    const { latitude, longitude, name, address } = message.location_data;
    return (
      <div className="space-y-2">
        <p className="font-semibold">{name || 'Localização'}</p>
        {address && <p className="text-sm">{address}</p>}
        <a
          href={`https://www.google.com/maps?q=${latitude},${longitude}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 underline text-sm"
        >
          Ver no Google Maps
        </a>
      </div>
    );
  }

  // Enquete
  if (message.message_type === 'poll' && message.poll_data) {
    const { name, options, selectableCount } = message.poll_data;
    return (
      <div className="space-y-2">
        <p className="font-semibold">{name}</p>
        <p className="text-sm text-muted-foreground">
          Selecione até {selectableCount} opç{selectableCount > 1 ? 'ões' : 'ão'}
        </p>
        <div className="space-y-1">
          {options.map((option: string, i: number) => (
            <div key={i} className="p-2 bg-muted rounded-md text-sm">
              {option}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Lista
  if (message.message_type === 'list' && message.list_data) {
    const { title, description, sections } = message.list_data;
    return (
      <div className="space-y-2">
        <p className="font-semibold">{title}</p>
        {description && <p className="text-sm">{description}</p>}
        <div className="space-y-3">
          {sections.map((section: any, i: number) => (
            <div key={i}>
              <p className="font-medium text-sm mb-1">{section.title}</p>
              <div className="space-y-1">
                {section.rows.map((row: any, j: number) => (
                  <div key={j} className="p-2 bg-muted rounded-md text-sm">
                    <p className="font-medium">{row.title}</p>
                    {row.description && (
                      <p className="text-xs text-muted-foreground">{row.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Texto padrão
  return <p className="whitespace-pre-wrap break-words">{message.content}</p>;
};

return (
  <div className={/* ... */}>
    {renderMessageContent()}
  </div>
);
```

---

## ✅ Checklist de Implementação

### MessageArea.tsx
- [ ] Adicionar imports (Phone, Video, hooks)
- [ ] Usar hooks da Evolution API
- [ ] Substituir handleSendMessage
- [ ] Adicionar handleVoiceCall e handleVideoCall
- [ ] Adicionar botões de chamada

### AudioRecorder.tsx
- [ ] Adicionar imports dos hooks
- [ ] Modificar função de envio para usar Evolution API

### InteractiveMessageSender.tsx
- [ ] Adicionar hooks de enquete e lista
- [ ] Implementar handleSendPoll
- [ ] Implementar handleSendList
- [ ] Criar UI para criar enquetes e listas

### MediaUpload.tsx
- [ ] Adicionar hook useSendMediaMessage
- [ ] Modificar upload para converter para Base64
- [ ] Enviar via Evolution API

### ConversationList.tsx
- [ ] Substituir Avatar por ContactAvatar

### MessageBubble.tsx
- [ ] Adicionar renderização de áudio
- [ ] Adicionar renderização de imagem
- [ ] Adicionar renderização de vídeo
- [ ] Adicionar renderização de localização
- [ ] Adicionar renderização de enquete
- [ ] Adicionar renderização de lista

---

## 🚀 Resultado Final

Após implementar tudo:

✅ **Mensagens de texto** enviadas via Evolution API
✅ **Áudio** gravado e enviado via WhatsApp
✅ **Fotos e vídeos** enviados via WhatsApp
✅ **Chamadas de voz e vídeo** iniciadas
✅ **Enquetes** enviadas
✅ **Listas interativas** enviadas
✅ **Fotos de perfil** carregadas automaticamente
✅ **Localização e contatos** suportados

Tudo funcionando com a **Evolution API de verdade**! 🎉

---

**Data**: 29/11/2025
**Autor**: Claude (Anthropic)
