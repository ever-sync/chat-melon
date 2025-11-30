/**
 * Evolution API Service
 * Complete integration with Evolution API v2
 * Provides all endpoints for WhatsApp Business automation
 */

import { supabase } from '@/integrations/supabase/client';

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface EvolutionInstance {
  instanceName: string;
  status?: 'open' | 'close' | 'connecting';
  serverUrl?: string;
  apikey?: string;
  qrcode?: {
    code?: string;
    base64?: string;
  };
}

export interface SendTextMessageRequest {
  number: string;
  text: string;
  delay?: number;
  linkPreview?: boolean;
}

export interface SendMediaMessageRequest {
  number: string;
  mediatype: 'image' | 'video' | 'audio' | 'document';
  media: string; // URL or base64
  caption?: string;
  fileName?: string;
  delay?: number;
}

export interface SendAudioMessageRequest {
  number: string;
  audio: string; // URL or base64
  delay?: number;
  encoding?: boolean;
}

export interface SendLocationMessageRequest {
  number: string;
  latitude: number;
  longitude: number;
  name?: string;
  address?: string;
}

export interface SendContactMessageRequest {
  number: string;
  contact: Array<{
    fullName: string;
    wuid: string;
    phoneNumber: string;
    organization?: string;
    email?: string;
    url?: string;
  }>;
}

export interface SendReactionMessageRequest {
  reactionMessage: {
    key: {
      remoteJid: string;
      fromMe: boolean;
      id: string;
    };
    reaction: string; // Emoji
  };
}

export interface SendPollMessageRequest {
  number: string;
  name: string;
  selectableCount: number;
  values: string[];
}

export interface SendListMessageRequest {
  number: string;
  title: string;
  description: string;
  buttonText: string;
  footerText?: string;
  sections: Array<{
    title: string;
    rows: Array<{
      title: string;
      description: string;
      rowId: string;
    }>;
  }>;
}

export interface FetchProfilePictureRequest {
  number: string;
}

export interface FetchProfilePictureResponse {
  profilePictureUrl?: string;
}

export interface FindContactsRequest {
  where?: {
    owner?: string;
    pushName?: string;
  };
}

export interface Contact {
  id: string;
  profilePictureUrl?: string;
  pushName?: string;
  owner?: string;
}

export interface FindMessagesRequest {
  where?: {
    key?: {
      remoteJid?: string;
      fromMe?: boolean;
      id?: string;
    };
  };
  limit?: number;
}

export interface WebhookConfig {
  url: string;
  webhook_by_events?: boolean;
  webhook_base64?: boolean;
  events?: string[];
}

export interface InstanceSettings {
  reject_call?: boolean;
  msg_call?: string;
  groups_ignore?: boolean;
  always_online?: boolean;
  read_messages?: boolean;
  read_status?: boolean;
  sync_full_history?: boolean;
}

export interface CreateGroupRequest {
  subject: string;
  description?: string;
  participants: string[];
}

export interface UpdateGroupRequest {
  subject?: string;
  description?: string;
}

export interface GroupParticipantsRequest {
  participants: string[];
}

// ============================================
// EVOLUTION API CLIENT
// ============================================

class EvolutionApiClient {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    // These will be set from company settings
    this.baseUrl = '';
    this.apiKey = '';
  }

  /**
   * Initialize client with company-specific Evolution API credentials
   */
  async initialize(companyId: string): Promise<void> {
    const { data: company, error } = await supabase
      .from('companies')
      .select('evolution_api_url, evolution_api_key')
      .eq('id', companyId)
      .single();

    if (error) throw new Error('Failed to load Evolution API credentials');
    if (!company?.evolution_api_url || !company?.evolution_api_key) {
      throw new Error('Evolution API credentials not configured for this company');
    }

    this.baseUrl = company.evolution_api_url;
    this.apiKey = company.evolution_api_key;
  }

  /**
   * Generic request method
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'apikey': this.apiKey,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(error.message || `Evolution API error: ${response.status}`);
    }

    return response.json();
  }

  // ============================================
  // INSTANCE MANAGEMENT
  // ============================================

  async createInstance(instanceName: string, qrcode = true): Promise<EvolutionInstance> {
    return this.request<EvolutionInstance>('/instance/create', {
      method: 'POST',
      body: JSON.stringify({
        instanceName,
        qrcode,
      }),
    });
  }

  async connectInstance(instanceName: string): Promise<EvolutionInstance> {
    return this.request<EvolutionInstance>('/instance/connect', {
      method: 'POST',
      body: JSON.stringify({ instanceName }),
    });
  }

  async fetchInstances(): Promise<EvolutionInstance[]> {
    return this.request<EvolutionInstance[]>('/instance/fetchInstances', {
      method: 'GET',
    });
  }

  async deleteInstance(instanceName: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/instance/delete/${instanceName}`, {
      method: 'DELETE',
    });
  }

  async logoutInstance(instanceName: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/instance/logout/${instanceName}`, {
      method: 'DELETE',
    });
  }

  async restartInstance(instanceName: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/instance/restart/${instanceName}`, {
      method: 'PUT',
    });
  }

  // ============================================
  // MESSAGE SENDING
  // ============================================

  async sendTextMessage(
    instanceName: string,
    data: SendTextMessageRequest
  ): Promise<any> {
    return this.request(`/message/sendText/${instanceName}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async sendMediaMessage(
    instanceName: string,
    data: SendMediaMessageRequest
  ): Promise<any> {
    return this.request(`/message/sendMedia/${instanceName}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async sendAudioMessage(
    instanceName: string,
    data: SendAudioMessageRequest
  ): Promise<any> {
    return this.request(`/message/sendWhatsAppAudio/${instanceName}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async sendLocationMessage(
    instanceName: string,
    data: SendLocationMessageRequest
  ): Promise<any> {
    return this.request(`/message/sendLocation/${instanceName}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async sendContactMessage(
    instanceName: string,
    data: SendContactMessageRequest
  ): Promise<any> {
    return this.request(`/message/sendContact/${instanceName}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async sendReactionMessage(
    instanceName: string,
    data: SendReactionMessageRequest
  ): Promise<any> {
    return this.request(`/message/sendReaction/${instanceName}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async sendPollMessage(
    instanceName: string,
    data: SendPollMessageRequest
  ): Promise<any> {
    return this.request(`/message/sendPoll/${instanceName}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async sendListMessage(
    instanceName: string,
    data: SendListMessageRequest
  ): Promise<any> {
    return this.request(`/message/sendList/${instanceName}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // ============================================
  // CHAT MANAGEMENT
  // ============================================

  async whatsappNumbers(
    instanceName: string,
    numbers: string[]
  ): Promise<any> {
    return this.request(`/chat/whatsappNumbers/${instanceName}`, {
      method: 'POST',
      body: JSON.stringify({ numbers }),
    });
  }

  async markAsRead(
    instanceName: string,
    remoteJid: string
  ): Promise<any> {
    return this.request(`/chat/markMessageAsRead/${instanceName}`, {
      method: 'PUT',
      body: JSON.stringify({
        read_messages: {
          keys: [{ remoteJid, fromMe: false }],
        },
      }),
    });
  }

  async archiveChat(
    instanceName: string,
    remoteJid: string,
    archive: boolean
  ): Promise<any> {
    return this.request(`/chat/archiveChat/${instanceName}`, {
      method: 'PUT',
      body: JSON.stringify({
        lastMessage: { remoteJid },
        archive,
      }),
    });
  }

  async deleteMessage(
    instanceName: string,
    remoteJid: string,
    messageId: string,
    fromMe: boolean
  ): Promise<any> {
    return this.request(`/chat/deleteMessage/${instanceName}`, {
      method: 'DELETE',
      body: JSON.stringify({
        key: { remoteJid, fromMe, id: messageId },
      }),
    });
  }

  async sendPresence(
    instanceName: string,
    remoteJid: string,
    presence: 'available' | 'composing' | 'recording' | 'paused'
  ): Promise<any> {
    return this.request(`/chat/sendPresence/${instanceName}`, {
      method: 'POST',
      body: JSON.stringify({
        number: remoteJid,
        delay: 1000,
        presence,
      }),
    });
  }

  /**
   * FETCH PROFILE PICTURE - Priority feature
   */
  async fetchProfilePicture(
    instanceName: string,
    data: FetchProfilePictureRequest
  ): Promise<FetchProfilePictureResponse> {
    return this.request<FetchProfilePictureResponse>(
      `/chat/fetchProfilePictureUrl/${instanceName}`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
  }

  async findContacts(
    instanceName: string,
    data?: FindContactsRequest
  ): Promise<Contact[]> {
    return this.request<Contact[]>(`/chat/findContacts/${instanceName}`, {
      method: 'POST',
      body: JSON.stringify(data || {}),
    });
  }

  async findMessages(
    instanceName: string,
    data?: FindMessagesRequest
  ): Promise<any[]> {
    return this.request<any[]>(`/chat/findMessages/${instanceName}`, {
      method: 'POST',
      body: JSON.stringify(data || {}),
    });
  }

  // ============================================
  // WEBHOOK CONFIGURATION
  // ============================================

  async setWebhook(
    instanceName: string,
    config: WebhookConfig
  ): Promise<any> {
    return this.request(`/webhook/set/${instanceName}`, {
      method: 'POST',
      body: JSON.stringify(config),
    });
  }

  async findWebhook(instanceName: string): Promise<WebhookConfig> {
    return this.request<WebhookConfig>(`/webhook/find/${instanceName}`, {
      method: 'GET',
    });
  }

  // ============================================
  // SETTINGS
  // ============================================

  async setSettings(
    instanceName: string,
    settings: InstanceSettings
  ): Promise<any> {
    return this.request(`/settings/set/${instanceName}`, {
      method: 'POST',
      body: JSON.stringify(settings),
    });
  }

  async findSettings(instanceName: string): Promise<InstanceSettings> {
    return this.request<InstanceSettings>(`/settings/find/${instanceName}`, {
      method: 'GET',
    });
  }

  // ============================================
  // PROFILE SETTINGS
  // ============================================

  async updateProfileName(
    instanceName: string,
    name: string
  ): Promise<any> {
    return this.request(`/chat/updateProfileName/${instanceName}`, {
      method: 'PUT',
      body: JSON.stringify({ name }),
    });
  }

  async updateProfileStatus(
    instanceName: string,
    status: string
  ): Promise<any> {
    return this.request(`/chat/updateProfileStatus/${instanceName}`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  async updateProfilePicture(
    instanceName: string,
    picture: string
  ): Promise<any> {
    return this.request(`/chat/updateProfilePicture/${instanceName}`, {
      method: 'PUT',
      body: JSON.stringify({ picture }),
    });
  }

  async removeProfilePicture(instanceName: string): Promise<any> {
    return this.request(`/chat/removeProfilePicture/${instanceName}`, {
      method: 'DELETE',
    });
  }

  async fetchPrivacySettings(instanceName: string): Promise<any> {
    return this.request(`/chat/fetchPrivacySettings/${instanceName}`, {
      method: 'GET',
    });
  }

  async updatePrivacySettings(
    instanceName: string,
    privacyKey: string,
    value: string
  ): Promise<any> {
    return this.request(`/chat/updatePrivacySettings/${instanceName}`, {
      method: 'PUT',
      body: JSON.stringify({
        privacySettings: { privacyKey, value },
      }),
    });
  }

  // ============================================
  // GROUP MANAGEMENT
  // ============================================

  async createGroup(
    instanceName: string,
    data: CreateGroupRequest
  ): Promise<any> {
    return this.request(`/group/create/${instanceName}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateGroupPicture(
    instanceName: string,
    groupJid: string,
    image: string
  ): Promise<any> {
    return this.request(`/group/updateGroupPicture/${instanceName}`, {
      method: 'PUT',
      body: JSON.stringify({ groupJid, image }),
    });
  }

  async updateGroupSubject(
    instanceName: string,
    groupJid: string,
    subject: string
  ): Promise<any> {
    return this.request(`/group/updateGroupSubject/${instanceName}`, {
      method: 'PUT',
      body: JSON.stringify({ groupJid, subject }),
    });
  }

  async updateGroupDescription(
    instanceName: string,
    groupJid: string,
    description: string
  ): Promise<any> {
    return this.request(`/group/updateGroupDescription/${instanceName}`, {
      method: 'PUT',
      body: JSON.stringify({ groupJid, description }),
    });
  }

  async findGroup(
    instanceName: string,
    groupJid: string
  ): Promise<any> {
    return this.request(`/group/findGroupInfos/${instanceName}`, {
      method: 'POST',
      body: JSON.stringify({ groupJid }),
    });
  }

  async fetchAllGroups(instanceName: string): Promise<any[]> {
    return this.request<any[]>(`/group/fetchAllGroups/${instanceName}`, {
      method: 'GET',
    });
  }

  async inviteCode(
    instanceName: string,
    groupJid: string
  ): Promise<any> {
    return this.request(`/group/inviteCode/${instanceName}`, {
      method: 'POST',
      body: JSON.stringify({ groupJid }),
    });
  }

  async revokeInviteCode(
    instanceName: string,
    groupJid: string
  ): Promise<any> {
    return this.request(`/group/revokeInviteCode/${instanceName}`, {
      method: 'PUT',
      body: JSON.stringify({ groupJid }),
    });
  }

  async findParticipants(
    instanceName: string,
    groupJid: string
  ): Promise<any[]> {
    return this.request<any[]>(`/group/findParticipants/${instanceName}`, {
      method: 'POST',
      body: JSON.stringify({ groupJid }),
    });
  }

  async updateParticipant(
    instanceName: string,
    groupJid: string,
    action: 'add' | 'remove' | 'promote' | 'demote',
    participants: string[]
  ): Promise<any> {
    return this.request(`/group/updateParticipant/${instanceName}`, {
      method: 'PUT',
      body: JSON.stringify({ groupJid, action, participants }),
    });
  }

  async updateGroupSetting(
    instanceName: string,
    groupJid: string,
    action: 'announcement' | 'not_announcement' | 'locked' | 'unlocked'
  ): Promise<any> {
    return this.request(`/group/updateSetting/${instanceName}`, {
      method: 'PUT',
      body: JSON.stringify({ groupJid, action }),
    });
  }

  async toggleEphemeral(
    instanceName: string,
    groupJid: string,
    expiration: number
  ): Promise<any> {
    return this.request(`/group/toggleEphemeral/${instanceName}`, {
      method: 'PUT',
      body: JSON.stringify({ groupJid, expiration }),
    });
  }

  async leaveGroup(
    instanceName: string,
    groupJid: string
  ): Promise<any> {
    return this.request(`/group/leaveGroup/${instanceName}`, {
      method: 'DELETE',
      body: JSON.stringify({ groupJid }),
    });
  }
}

// Export singleton instance
export const evolutionApi = new EvolutionApiClient();
