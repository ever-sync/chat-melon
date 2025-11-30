/**
 * React hooks for Evolution API
 * Provides easy-to-use hooks for all Evolution API operations
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { evolutionApi } from '@/services/evolutionApi';
import { useCompany } from '@/contexts/CompanyContext';
import { toast } from 'sonner';
import type {
  SendTextMessageRequest,
  SendMediaMessageRequest,
  SendAudioMessageRequest,
  SendLocationMessageRequest,
  SendContactMessageRequest,
  SendReactionMessageRequest,
  SendPollMessageRequest,
  SendListMessageRequest,
  FetchProfilePictureRequest,
  FindContactsRequest,
  Contact,
} from '@/services/evolutionApi';

// ============================================
// INSTANCE MANAGEMENT HOOKS
// ============================================

/**
 * Hook to initialize Evolution API with company credentials
 */
export function useEvolutionInit() {
  const { currentCompany } = useCompany();

  return useQuery({
    queryKey: ['evolution-init', currentCompany?.id],
    queryFn: async () => {
      if (!currentCompany?.id) {
        throw new Error('No company selected');
      }
      await evolutionApi.initialize(currentCompany.id);
      return true;
    },
    enabled: !!currentCompany?.id,
    staleTime: Infinity, // Only initialize once per session
  });
}

/**
 * Hook to fetch all instances
 */
export function useInstances() {
  const { data: initialized } = useEvolutionInit();

  return useQuery({
    queryKey: ['evolution-instances'],
    queryFn: () => evolutionApi.fetchInstances(),
    enabled: !!initialized,
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}

/**
 * Hook to create new instance
 */
export function useCreateInstance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ instanceName, qrcode = true }: { instanceName: string; qrcode?: boolean }) =>
      evolutionApi.createInstance(instanceName, qrcode),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evolution-instances'] });
      toast.success('Instância criada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao criar instância');
    },
  });
}

/**
 * Hook to connect instance
 */
export function useConnectInstance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (instanceName: string) => evolutionApi.connectInstance(instanceName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evolution-instances'] });
      toast.success('Conectando instância...');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao conectar instância');
    },
  });
}

/**
 * Hook to delete instance
 */
export function useDeleteInstance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (instanceName: string) => evolutionApi.deleteInstance(instanceName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evolution-instances'] });
      toast.success('Instância deletada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao deletar instância');
    },
  });
}

/**
 * Hook to logout instance
 */
export function useLogoutInstance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (instanceName: string) => evolutionApi.logoutInstance(instanceName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evolution-instances'] });
      toast.success('Logout realizado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao realizar logout');
    },
  });
}

// ============================================
// MESSAGE SENDING HOOKS
// ============================================

/**
 * Hook to send text message
 */
export function useSendTextMessage(instanceName: string) {
  return useMutation({
    mutationFn: (data: SendTextMessageRequest) =>
      evolutionApi.sendTextMessage(instanceName, data),
    onSuccess: () => {
      toast.success('Mensagem enviada!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao enviar mensagem');
    },
  });
}

/**
 * Hook to send media message
 */
export function useSendMediaMessage(instanceName: string) {
  return useMutation({
    mutationFn: (data: SendMediaMessageRequest) =>
      evolutionApi.sendMediaMessage(instanceName, data),
    onSuccess: () => {
      toast.success('Mídia enviada!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao enviar mídia');
    },
  });
}

/**
 * Hook to send audio message
 */
export function useSendAudioMessage(instanceName: string) {
  return useMutation({
    mutationFn: (data: SendAudioMessageRequest) =>
      evolutionApi.sendAudioMessage(instanceName, data),
    onSuccess: () => {
      toast.success('Áudio enviado!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao enviar áudio');
    },
  });
}

/**
 * Hook to send location message
 */
export function useSendLocationMessage(instanceName: string) {
  return useMutation({
    mutationFn: (data: SendLocationMessageRequest) =>
      evolutionApi.sendLocationMessage(instanceName, data),
    onSuccess: () => {
      toast.success('Localização enviada!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao enviar localização');
    },
  });
}

/**
 * Hook to send contact message
 */
export function useSendContactMessage(instanceName: string) {
  return useMutation({
    mutationFn: (data: SendContactMessageRequest) =>
      evolutionApi.sendContactMessage(instanceName, data),
    onSuccess: () => {
      toast.success('Contato enviado!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao enviar contato');
    },
  });
}

/**
 * Hook to send reaction message
 */
export function useSendReactionMessage(instanceName: string) {
  return useMutation({
    mutationFn: (data: SendReactionMessageRequest) =>
      evolutionApi.sendReactionMessage(instanceName, data),
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao enviar reação');
    },
  });
}

/**
 * Hook to send poll message
 */
export function useSendPollMessage(instanceName: string) {
  return useMutation({
    mutationFn: (data: SendPollMessageRequest) =>
      evolutionApi.sendPollMessage(instanceName, data),
    onSuccess: () => {
      toast.success('Enquete enviada!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao enviar enquete');
    },
  });
}

/**
 * Hook to send list message
 */
export function useSendListMessage(instanceName: string) {
  return useMutation({
    mutationFn: (data: SendListMessageRequest) =>
      evolutionApi.sendListMessage(instanceName, data),
    onSuccess: () => {
      toast.success('Lista enviada!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao enviar lista');
    },
  });
}

// ============================================
// CHAT MANAGEMENT HOOKS
// ============================================

/**
 * Hook to mark message as read
 */
export function useMarkAsRead(instanceName: string) {
  return useMutation({
    mutationFn: (remoteJid: string) =>
      evolutionApi.markAsRead(instanceName, remoteJid),
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao marcar como lida');
    },
  });
}

/**
 * Hook to archive chat
 */
export function useArchiveChat(instanceName: string) {
  return useMutation({
    mutationFn: ({ remoteJid, archive }: { remoteJid: string; archive: boolean }) =>
      evolutionApi.archiveChat(instanceName, remoteJid, archive),
    onSuccess: (_, variables) => {
      toast.success(variables.archive ? 'Conversa arquivada!' : 'Conversa desarquivada!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao arquivar conversa');
    },
  });
}

/**
 * Hook to delete message
 */
export function useDeleteMessage(instanceName: string) {
  return useMutation({
    mutationFn: ({ remoteJid, messageId, fromMe }: { remoteJid: string; messageId: string; fromMe: boolean }) =>
      evolutionApi.deleteMessage(instanceName, remoteJid, messageId, fromMe),
    onSuccess: () => {
      toast.success('Mensagem deletada!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao deletar mensagem');
    },
  });
}

/**
 * Hook to send presence (typing, recording, etc.)
 */
export function useSendPresence(instanceName: string) {
  return useMutation({
    mutationFn: ({ remoteJid, presence }: { remoteJid: string; presence: 'available' | 'composing' | 'recording' | 'paused' }) =>
      evolutionApi.sendPresence(instanceName, remoteJid, presence),
    onError: (error: Error) => {
      console.error('Erro ao enviar presença:', error);
    },
  });
}

// ============================================
// CONTACT & PROFILE PICTURE HOOKS (PRIORITY)
// ============================================

/**
 * Hook to fetch profile picture URL for a contact
 * This is a PRIORITY feature requested by the user
 */
export function useFetchProfilePicture(instanceName: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: FetchProfilePictureRequest) =>
      evolutionApi.fetchProfilePicture(instanceName, data),
    onSuccess: (response, variables) => {
      // Update contact cache with profile picture
      queryClient.setQueryData(
        ['contact-profile-picture', instanceName, variables.number],
        response.profilePictureUrl
      );
    },
    onError: (error: Error) => {
      console.error('Erro ao buscar foto de perfil:', error);
    },
  });
}

/**
 * Hook to get cached profile picture URL
 */
export function useContactProfilePicture(instanceName: string, phoneNumber: string) {
  return useQuery({
    queryKey: ['contact-profile-picture', instanceName, phoneNumber],
    queryFn: async () => {
      const response = await evolutionApi.fetchProfilePicture(instanceName, {
        number: phoneNumber,
      });
      return response.profilePictureUrl || null;
    },
    enabled: !!instanceName && !!phoneNumber,
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
    gcTime: 1000 * 60 * 60 * 24 * 7, // 7 days
  });
}

/**
 * Hook to find contacts
 */
export function useFindContacts(instanceName: string, filter?: FindContactsRequest) {
  return useQuery({
    queryKey: ['evolution-contacts', instanceName, filter],
    queryFn: () => evolutionApi.findContacts(instanceName, filter),
    enabled: !!instanceName,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to sync all contacts with profile pictures
 * This will fetch profile pictures for all contacts
 */
export function useSyncContactPhotos(instanceName: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      // First, get all contacts
      const contacts = await evolutionApi.findContacts(instanceName);

      // Then fetch profile pictures for each contact
      const results = await Promise.allSettled(
        contacts.map(async (contact) => {
          if (!contact.id) return null;

          try {
            const response = await evolutionApi.fetchProfilePicture(instanceName, {
              number: contact.id,
            });

            // Cache the profile picture URL
            queryClient.setQueryData(
              ['contact-profile-picture', instanceName, contact.id],
              response.profilePictureUrl
            );

            return {
              contactId: contact.id,
              profilePictureUrl: response.profilePictureUrl,
            };
          } catch (error) {
            console.error(`Erro ao buscar foto do contato ${contact.id}:`, error);
            return null;
          }
        })
      );

      const successful = results.filter(
        (r) => r.status === 'fulfilled' && r.value !== null
      ).length;

      return {
        total: contacts.length,
        successful,
        failed: contacts.length - successful,
      };
    },
    onSuccess: (data) => {
      toast.success(`${data.successful} fotos de perfil sincronizadas!`);
      queryClient.invalidateQueries({ queryKey: ['evolution-contacts'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao sincronizar fotos');
    },
  });
}

// ============================================
// SETTINGS HOOKS
// ============================================

/**
 * Hook to get instance settings
 */
export function useInstanceSettings(instanceName: string) {
  return useQuery({
    queryKey: ['evolution-settings', instanceName],
    queryFn: () => evolutionApi.findSettings(instanceName),
    enabled: !!instanceName,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to update instance settings
 */
export function useUpdateInstanceSettings(instanceName: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (settings: any) => evolutionApi.setSettings(instanceName, settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evolution-settings', instanceName] });
      toast.success('Configurações atualizadas!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao atualizar configurações');
    },
  });
}

// ============================================
// WEBHOOK HOOKS
// ============================================

/**
 * Hook to get webhook configuration
 */
export function useWebhookConfig(instanceName: string) {
  return useQuery({
    queryKey: ['evolution-webhook', instanceName],
    queryFn: () => evolutionApi.findWebhook(instanceName),
    enabled: !!instanceName,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to update webhook configuration
 */
export function useUpdateWebhook(instanceName: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (config: any) => evolutionApi.setWebhook(instanceName, config),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evolution-webhook', instanceName] });
      toast.success('Webhook configurado!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao configurar webhook');
    },
  });
}

// ============================================
// GROUP HOOKS
// ============================================

/**
 * Hook to fetch all groups
 */
export function useGroups(instanceName: string) {
  return useQuery({
    queryKey: ['evolution-groups', instanceName],
    queryFn: () => evolutionApi.fetchAllGroups(instanceName),
    enabled: !!instanceName,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to create group
 */
export function useCreateGroup(instanceName: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => evolutionApi.createGroup(instanceName, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evolution-groups'] });
      toast.success('Grupo criado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao criar grupo');
    },
  });
}

/**
 * Hook to update group participants
 */
export function useUpdateGroupParticipants(instanceName: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ groupJid, action, participants }: { groupJid: string; action: 'add' | 'remove' | 'promote' | 'demote'; participants: string[] }) =>
      evolutionApi.updateParticipant(instanceName, groupJid, action, participants),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['evolution-groups'] });

      const actionMessages = {
        add: 'Participante(s) adicionado(s)!',
        remove: 'Participante(s) removido(s)!',
        promote: 'Participante(s) promovido(s) a admin!',
        demote: 'Participante(s) removido(s) como admin!',
      };

      toast.success(actionMessages[variables.action]);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao atualizar participantes');
    },
  });
}
