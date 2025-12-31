import { useState, useEffect, useCallback } from 'react';
import { MainLayout } from '@/components/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  MessageSquare,
  Instagram,
  Facebook,
  Mail,
  Globe,
  Plus,
  Settings,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Trash2,
  ExternalLink,
  QrCode,
  Loader2,
} from 'lucide-react';
import { useCompany } from '@/contexts/CompanyContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Channel {
  id: string;
  type: 'whatsapp' | 'instagram' | 'messenger' | 'email' | 'webchat';
  name: string;
  is_active: boolean;
  status: 'connected' | 'disconnected' | 'error';
  credentials: Record<string, any>;
  settings: Record<string, any>;
  total_conversations: number;
  total_messages_in: number;
  total_messages_out: number;
  last_activity_at: string | null;
  created_at: string;
}

const channelConfig = {
  whatsapp: {
    name: 'WhatsApp',
    icon: MessageSquare,
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
    description: 'Conecte via Evolution API ou WhatsApp Business API',
  },
  instagram: {
    name: 'Instagram DM',
    icon: Instagram,
    color: 'text-pink-500',
    bgColor: 'bg-pink-500/10',
    description: 'Receba e responda mensagens do Instagram Direct',
  },
  messenger: {
    name: 'Facebook Messenger',
    icon: Facebook,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    description: 'Integre com sua página do Facebook',
  },
  email: {
    name: 'Email',
    icon: Mail,
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
    description: 'Receba emails como conversas no chat',
  },
  webchat: {
    name: 'Widget Web',
    icon: Globe,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
    description: 'Chat widget para seu site',
  },
};

const statusConfig = {
  connected: { label: 'Conectado', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  disconnected: { label: 'Desconectado', color: 'bg-gray-100 text-gray-700', icon: XCircle },
  error: { label: 'Erro', color: 'bg-red-100 text-red-700', icon: AlertCircle },
};

export default function Channels() {
  const { currentCompany } = useCompany();
  const queryClient = useQueryClient();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [configData, setConfigData] = useState<Record<string, any>>({});
  const [testingConnection, setTestingConnection] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [qrCodeData, setQRCodeData] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [showWebhookConfig, setShowWebhookConfig] = useState(false);
  const [configuringWebhook, setConfiguringWebhook] = useState(false);
  const [webhookStatus, setWebhookStatus] = useState<any>(null);

  // Função para verificar status na Evolution API e atualizar o canal
  const checkAndUpdateChannelStatus = useCallback(async (showToast = false) => {
    if (!currentCompany?.id) return;

    const evolutionApiUrl = import.meta.env.VITE_EVOLUTION_API_URL || import.meta.env.VITE_WHATSAPP_API_URL;
    const evolutionApiKey = import.meta.env.VITE_EVOLUTION_API_KEY || import.meta.env.VITE_WHATSAPP_API_KEY;

    if (!evolutionApiUrl || !evolutionApiKey) return;

    const instanceName = currentCompany.cnpj?.replace(/\D/g, '');
    if (!instanceName) return;

    setCheckingStatus(true);

    try {
      // Verificar status na Evolution API
      console.log('🔍 Verificando status da instância:', instanceName);
      console.log('📍 URL:', `${evolutionApiUrl}/instance/connectionState/${instanceName}`);

      const response = await fetch(`${evolutionApiUrl}/instance/connectionState/${instanceName}`, {
        headers: {
          'apikey': evolutionApiKey,
        },
      });

      if (!response.ok) {
        console.error('❌ Erro ao verificar status da instância:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('📄 Resposta:', errorText);

        if (showToast) {
          toast.error('Erro ao verificar status do WhatsApp');
        }
        return;
      }

      const data = await response.json();
      console.log('📦 Dados recebidos da Evolution:', data);

      // Verificar se state existe
      if (!data.state) {
        console.warn('⚠️ Estado não encontrado na resposta:', data);
      }

      const isConnected = data.state === 'open';
      const newStatus = isConnected ? 'connected' : 'disconnected';

      console.log('📊 Status da Evolution:', data.state, '-> novo status:', newStatus);

      // Buscar o canal WhatsApp da empresa
      const { data: channelData } = await (supabase.from('channels' as any) as any)
        .select('id, status')
        .eq('company_id', currentCompany.id)
        .eq('type', 'whatsapp')
        .single();

      // Verificar se acabou de conectar (mudou de disconnected para connected)
      const justConnected = channelData && channelData.status !== 'connected' && isConnected;

      if (channelData && channelData.status !== newStatus) {
        // Atualiza o status do canal
        const { error } = await (supabase.from('channels' as any) as any)
          .update({ status: newStatus } as any)
          .eq('id', channelData.id);

        if (!error) {
          console.log('✅ Status do canal atualizado para:', newStatus);
          queryClient.invalidateQueries({ queryKey: ['channels'] });

          if (isConnected && showToast) {
            toast.success('WhatsApp conectado com sucesso!');
            setShowQRCode(false);
            setQRCodeData(null);
          }
        }
      }

      // Também atualizar evolution_settings
      await supabase
        .from('evolution_settings')
        .update({
          is_connected: isConnected,
          instance_status: isConnected ? 'connected' : 'disconnected'
        })
        .eq('company_id', currentCompany.id);

      // 🔥 SE ACABOU DE CONECTAR: Reconfigurar webhook e settings
      if (justConnected) {
        console.log('🎉 WhatsApp acabou de conectar! Configurando webhook e settings...');

        // 1. Reconfigurar WEBHOOK
        try {
          const webhookUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/evolution-webhook`;
          console.log('🔧 Reconfigurando webhook:', webhookUrl);

          const webhookResponse = await fetch(`${evolutionApiUrl}/webhook/set/${instanceName}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': evolutionApiKey,
            },
            body: JSON.stringify({
              url: webhookUrl,
              webhook_by_events: true,
              webhook_base64: true,
              events: [
                'APPLICATION_STARTUP',
                'QRCODE_UPDATED',
                'MESSAGES_SET',
                'MESSAGES_UPSERT',
                'MESSAGES_UPDATE',
                'MESSAGES_DELETE',
                'SEND_MESSAGE',
                'CONTACTS_SET',
                'CONTACTS_UPSERT',
                'CONTACTS_UPDATE',
                'PRESENCE_UPDATE',
                'CHATS_SET',
                'CHATS_UPSERT',
                'CHATS_UPDATE',
                'CHATS_DELETE',
                'CONNECTION_UPDATE',
                'GROUPS_UPSERT',
                'GROUP_UPDATE',
                'GROUP_PARTICIPANTS_UPDATE',
                'CALL',
                'NEW_JWT_TOKEN',
              ],
            }),
          });

          if (webhookResponse.ok) {
            console.log('✅ Webhook reconfigurado com sucesso!');
            toast.success('✅ Webhook configurado automaticamente!');
          } else {
            const errorText = await webhookResponse.text();
            console.error('⚠️ Erro ao reconfigurar webhook:', errorText);
            toast.warning('⚠️ Erro ao configurar webhook. Configure manualmente.');
          }
        } catch (webhookError) {
          console.error('⚠️ Erro ao reconfigurar webhook:', webhookError);
        }

        // 2. Configurar SETTINGS da instância
        try {
          console.log('⚙️ Configurando settings da instância...');

          const settingsResponse = await fetch(`${evolutionApiUrl}/settings/set/${instanceName}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': evolutionApiKey,
            },
            body: JSON.stringify({
              reject_call: false,
              msg_call: 'Desculpe, não posso atender chamadas no momento.',
              groups_ignore: true,
              always_online: true,
              read_messages: true,
              read_status: false,
              sync_full_history: false,
            }),
          });

          if (settingsResponse.ok) {
            console.log('✅ Settings configurados com sucesso!');
            toast.success('✅ Configurações aplicadas automaticamente!');
          } else {
            const errorText = await settingsResponse.text();
            console.error('⚠️ Erro ao configurar settings:', errorText);
          }
        } catch (settingsError) {
          console.error('⚠️ Erro ao configurar settings:', settingsError);
        }
      }

    } catch (error) {
      console.error('Erro ao verificar status:', error);
    } finally {
      setCheckingStatus(false);
    }
  }, [currentCompany, queryClient]);

  // Função para reconectar WhatsApp (buscar novo QR Code)
  const handleReconnectWhatsApp = async () => {
    if (!currentCompany?.cnpj) {
      toast.error('CNPJ da empresa não configurado');
      return;
    }

    const evolutionApiUrl = import.meta.env.VITE_EVOLUTION_API_URL || import.meta.env.VITE_WHATSAPP_API_URL;
    const evolutionApiKey = import.meta.env.VITE_EVOLUTION_API_KEY || import.meta.env.VITE_WHATSAPP_API_KEY;

    if (!evolutionApiUrl || !evolutionApiKey) {
      toast.error('Configuração da Evolution API não encontrada');
      return;
    }

    setConnecting(true);

    try {
      const instanceName = currentCompany.cnpj.replace(/\D/g, '');
      console.log('🔄 Reconectando WhatsApp, buscando QR Code...');

      // Tentar fazer logout primeiro para limpar a sessão
      try {
        await fetch(`${evolutionApiUrl}/instance/logout/${instanceName}`, {
          method: 'DELETE',
          headers: {
            'apikey': evolutionApiKey,
          },
        });
        console.log('✅ Logout realizado');
      } catch (logoutError) {
        console.warn('⚠️ Erro ao fazer logout (não crítico):', logoutError);
      }

      // Buscar o QR Code da instância
      const connectResponse = await fetch(`${evolutionApiUrl}/instance/connect/${instanceName}`, {
        method: 'GET',
        headers: {
          'apikey': evolutionApiKey,
        },
      });

      if (!connectResponse.ok) {
        throw new Error('Erro ao buscar QR Code');
      }

      const connectData = await connectResponse.json();
      console.log('📦 Dados de reconexão:', connectData);

      if (connectData.qrcode?.base64) {
        setQRCodeData(connectData.qrcode.base64);
        setShowQRCode(true);
        toast.success('QR Code gerado! Escaneie com seu WhatsApp');
      } else {
        toast.error('QR Code não disponível. Tente novamente em alguns segundos.');
      }

    } catch (error: any) {
      console.error('❌ Erro ao reconectar WhatsApp:', error);
      toast.error(error.message || 'Erro ao reconectar WhatsApp');
    } finally {
      setConnecting(false);
    }
  };

  // Função para verificar webhook atual
  const handleCheckWebhook = async () => {
    if (!currentCompany?.cnpj) {
      toast.error('CNPJ da empresa não configurado');
      return;
    }

    const evolutionApiUrl = import.meta.env.VITE_EVOLUTION_API_URL || import.meta.env.VITE_WHATSAPP_API_URL;
    const evolutionApiKey = import.meta.env.VITE_EVOLUTION_API_KEY || import.meta.env.VITE_WHATSAPP_API_KEY;

    if (!evolutionApiUrl || !evolutionApiKey) {
      toast.error('Configuração da Evolution API não encontrada');
      return;
    }

    try {
      const instanceName = currentCompany.cnpj.replace(/\D/g, '');
      console.log('🔍 Verificando webhook atual...');
      console.log('📍 URL:', `${evolutionApiUrl}/webhook/find/${instanceName}`);

      const response = await fetch(`${evolutionApiUrl}/webhook/find/${instanceName}`, {
        method: 'GET',
        headers: {
          'apikey': evolutionApiKey,
        },
      });

      console.log('📊 Status da resposta:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Erro na resposta:', errorText);
        throw new Error(`Webhook não configurado (${response.status})`);
      }

      const data = await response.json();
      console.log('📦 Webhook atual (dados brutos):', data);
      console.log('📦 Tipo de dados:', typeof data, Array.isArray(data) ? 'Array' : 'Object');

      // Verificar se data é null, undefined, ou objeto vazio
      if (!data || (typeof data === 'object' && Object.keys(data).length === 0)) {
        console.warn('⚠️ Webhook retornou vazio ou null');
        setWebhookStatus(null);
        toast.warning('Webhook não configurado. Configure agora!');
        return;
      }

      // Verificar se tem a propriedade url (indicando webhook configurado)
      if (data.url) {
        console.log('✅ Webhook encontrado!');
        console.log('📍 URL do webhook:', data.url);
        console.log('📋 Eventos:', data.events?.length || 0);
        setWebhookStatus(data);
        toast.success('Webhook verificado com sucesso!');
      } else {
        console.warn('⚠️ Webhook sem URL configurada');
        setWebhookStatus(null);
        toast.warning('Webhook não tem URL configurada. Configure agora!');
      }

    } catch (error: any) {
      console.error('❌ Erro ao verificar webhook:', error);
      console.error('📄 Detalhes do erro:', error.message);
      setWebhookStatus(null);
      toast.warning('Webhook não configurado. Configure agora!');
    }
  };

  // Função para configurar webhook manualmente
  const handleConfigureWebhook = async () => {
    if (!currentCompany?.cnpj) {
      toast.error('CNPJ da empresa não configurado');
      return;
    }

    const evolutionApiUrl = import.meta.env.VITE_EVOLUTION_API_URL || import.meta.env.VITE_WHATSAPP_API_URL;
    const evolutionApiKey = import.meta.env.VITE_EVOLUTION_API_KEY || import.meta.env.VITE_WHATSAPP_API_KEY;
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

    if (!evolutionApiUrl || !evolutionApiKey || !supabaseUrl) {
      toast.error('Configurações necessárias não encontradas');
      return;
    }

    setConfiguringWebhook(true);

    try {
      const instanceName = currentCompany.cnpj.replace(/\D/g, '');
      const webhookUrl = `${supabaseUrl}/functions/v1/evolution-webhook`;

      console.log('🔧 Configurando webhook...');
      console.log('📍 URL:', webhookUrl);
      console.log('📱 Instância:', instanceName);

      // 1. Configurar WEBHOOK
      const webhookResponse = await fetch(`${evolutionApiUrl}/webhook/set/${instanceName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': evolutionApiKey,
        },
        body: JSON.stringify({
          webhook: {
            url: webhookUrl,
            enabled: true,
            byEvents: true,
            base64: true,
            events: [
              'APPLICATION_STARTUP',
              'QRCODE_UPDATED',
              'MESSAGES_SET',
              'MESSAGES_UPSERT',
              'MESSAGES_UPDATE',
              'MESSAGES_DELETE',
              'SEND_MESSAGE',
              'CONTACTS_SET',
              'CONTACTS_UPSERT',
              'CONTACTS_UPDATE',
              'PRESENCE_UPDATE',
              'CHATS_SET',
              'CHATS_UPSERT',
              'CHATS_UPDATE',
              'CHATS_DELETE',
              'CONNECTION_UPDATE',
              'GROUPS_UPSERT',
              'GROUP_UPDATE',
              'GROUP_PARTICIPANTS_UPDATE',
              'CALL',
            ],
          },
        }),
      });

      if (!webhookResponse.ok) {
        const errorText = await webhookResponse.text();
        console.error('❌ Erro na resposta do webhook:', errorText);
        throw new Error('Erro ao configurar webhook');
      }

      console.log('✅ Webhook configurado com sucesso!');

      // 2. Configurar SETTINGS da instância
      const settingsResponse = await fetch(`${evolutionApiUrl}/settings/set/${instanceName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': evolutionApiKey,
        },
        body: JSON.stringify({
          reject_call: false,
          msg_call: 'Desculpe, não posso atender chamadas no momento.',
          groups_ignore: true,
          always_online: true,
          read_messages: true,
          read_status: false,
          sync_full_history: false,
        }),
      });

      if (!settingsResponse.ok) {
        console.warn('⚠️ Erro ao configurar settings (não crítico)');
      } else {
        console.log('✅ Settings configurados com sucesso!');
      }

      // Verificar webhook configurado
      await handleCheckWebhook();

      toast.success('✅ Webhook e configurações aplicados com sucesso!', {
        description: 'Mensagens serão recebidas em tempo real',
      });

      setShowWebhookConfig(false);

    } catch (error: any) {
      console.error('❌ Erro ao configurar webhook:', error);
      toast.error(error.message || 'Erro ao configurar webhook');
    } finally {
      setConfiguringWebhook(false);
    }
  };

  // Verificar status periodicamente quando QR Code está aberto
  useEffect(() => {
    if (!showQRCode) return;

    // Verificar a cada 5 segundos
    const interval = setInterval(() => {
      checkAndUpdateChannelStatus(true);
    }, 5000);

    return () => clearInterval(interval);
  }, [showQRCode, checkAndUpdateChannelStatus]);

  // Verificar status ao carregar a página
  useEffect(() => {
    if (currentCompany?.id) {
      checkAndUpdateChannelStatus(false);
    }
  }, [currentCompany?.id, checkAndUpdateChannelStatus]);

  // Fetch channels
  const { data: channels = [], isLoading } = useQuery({
    queryKey: ['channels', currentCompany?.id],
    queryFn: async () => {
      if (!currentCompany?.id) return [];

      const { data, error } = await (supabase.from('channels' as any) as any)
        .select('*')
        .eq('company_id', currentCompany.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Channel[];
    },
    enabled: !!currentCompany?.id,
  });

  // Create channel mutation
  const createChannel = useMutation({
    mutationFn: async ({
      type,
      name,
      credentials,
    }: {
      type: string;
      name: string;
      credentials: Record<string, any>;
    }) => {
      const { data, error } = await (supabase.from('channels' as any) as any)
        .insert({
          company_id: currentCompany?.id,
          type,
          name,
          credentials,
          is_active: true,
          status: 'disconnected',
        } as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channels'] });
      toast.success('Canal criado com sucesso!');
      setShowAddDialog(false);
      setSelectedType(null);
      setConfigData({});
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao criar canal');
    },
  });

  // Delete channel mutation
  const deleteChannel = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.from('channels' as any) as any).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channels'] });
      toast.success('Canal removido');
    },
  });

  // Toggle channel mutation
  const toggleChannel = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await (supabase.from('channels' as any) as any)
        .update({ is_active } as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channels'] });
    },
  });

  const handleConnectWhatsApp = async () => {
    if (!currentCompany?.cnpj) {
      toast.error('CNPJ da empresa não configurado');
      return;
    }

    // Buscar credenciais da Evolution das variáveis de ambiente
    const evolutionApiUrl = import.meta.env.VITE_EVOLUTION_API_URL || import.meta.env.VITE_WHATSAPP_API_URL;
    const evolutionApiKey = import.meta.env.VITE_EVOLUTION_API_KEY || import.meta.env.VITE_WHATSAPP_API_KEY;

    if (!evolutionApiUrl || !evolutionApiKey) {
      toast.error('Configuração da Evolution API não encontrada. Entre em contato com o suporte.');
      return;
    }

    setConnecting(true);
    try {
      // Usar o CNPJ (somente números) como nome da instância
      const instanceName = currentCompany.cnpj.replace(/\D/g, '');

      // Verificar se já existe configuração para esta empresa
      const { data: existing } = await supabase
        .from('evolution_settings')
        .select('id')
        .eq('company_id', currentCompany?.id)
        .single();

      let evolutionError;

      if (existing) {
        // Atualizar existente
        const { error } = await supabase
          .from('evolution_settings')
          .update({
            instance_name: instanceName,
            api_url: evolutionApiUrl,
            api_key: evolutionApiKey,
            is_connected: false,
            instance_status: 'connecting',
          })
          .eq('company_id', currentCompany?.id);
        evolutionError = error;
      } else {
        // Criar novo
        const { error } = await supabase
          .from('evolution_settings')
          .insert({
            company_id: currentCompany?.id,
            user_id: (await supabase.auth.getUser()).data.user?.id,
            instance_name: instanceName,
            api_url: evolutionApiUrl,
            api_key: evolutionApiKey,
            is_connected: false,
            instance_status: 'connecting',
          });
        evolutionError = error;
      }

      if (evolutionError) throw evolutionError;

      // Primeiro, tentar deletar instância existente (se houver)
      console.log('🗑️ Tentando deletar instância existente:', instanceName);
      try {
        await fetch(`${evolutionApiUrl}/instance/delete/${instanceName}`, {
          method: 'DELETE',
          headers: {
            'apikey': evolutionApiKey,
          },
        });
        console.log('✅ Instância antiga deletada (se existia)');
        // Aguardar um pouco para garantir que foi deletada
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (deleteError) {
        console.log('ℹ️ Nenhuma instância para deletar ou erro ao deletar:', deleteError);
      }

      // Criar nova instância na Evolution API
      console.log('🔄 Criando nova instância:', instanceName);
      console.log('📍 URL:', `${evolutionApiUrl}/instance/create`);
      console.log('🔑 API Key:', evolutionApiKey.substring(0, 10) + '...');

      // Primeiro criar a instância SEM configurar webhook
      // O webhook será configurado depois automaticamente
      const response = await fetch(`${evolutionApiUrl}/instance/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': evolutionApiKey,
        },
        body: JSON.stringify({
          instanceName: instanceName,
          qrcode: true,
          integration: 'WHATSAPP-BAILEYS',
        }),
      });

      console.log('📊 Response status:', response.status);

      let data;
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Resposta completa:', errorText);

        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { message: errorText };
        }

        console.error('❌ Erro da Evolution API:', errorData);

        // Mensagens de erro mais claras
        if (response.status === 403) {
          throw new Error('API Key inválida ou sem permissão. Verifique a chave da Evolution API.');
        } else if (response.status === 400 && errorData.message?.includes('already exists')) {
          // Se ainda assim já existe, tentar buscar o QR Code
          console.log('⚠️ Instância já existe, buscando informações...');
          const fetchResponse = await fetch(`${evolutionApiUrl}/instance/fetchInstances`, {
            method: 'GET',
            headers: {
              'apikey': evolutionApiKey,
            },
          });

          if (fetchResponse.ok) {
            const instances = await fetchResponse.json();
            const existing = instances.find((i: any) => i.instanceName === instanceName);
            if (existing && existing.qrcode?.base64) {
              data = existing;
            } else {
              throw new Error('Instância existe mas não tem QR Code disponível. Tente fazer logout primeiro.');
            }
          } else {
            throw new Error('Erro ao buscar instância existente');
          }
        } else {
          throw new Error(errorData.message || `Erro ${response.status}: ${errorData.error || response.statusText}`);
        }
      } else {
        data = await response.json();
      }

      console.log('✅ Resposta da Evolution API:', data);

      // Exibir QR Code PRIMEIRO (para não bloquear a UI)
      if (data.qrcode?.base64) {
        setQRCodeData(data.qrcode.base64);
        setShowQRCode(true);
        setShowAddDialog(false);

        // Criar canal no banco de dados
        const credentials = {
          instance_name: instanceName,
          api_url: evolutionApiUrl,
        };
        const name = `WhatsApp - ${currentCompany.name}`;

        createChannel.mutate({ type: 'whatsapp', name, credentials });

        toast.success('✅ Instância criada! Escaneie o QR Code com seu WhatsApp!');

        // Configurar webhook e settings em background (não bloqueia a UI)
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        if (supabaseUrl) {
          const webhookUrl = `${supabaseUrl}/functions/v1/evolution-webhook`;

          // Configurar webhook em background
          fetch(`${evolutionApiUrl}/webhook/set/${instanceName}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': evolutionApiKey,
            },
            body: JSON.stringify({
              webhook: {
                url: webhookUrl,
                enabled: true,
                byEvents: true,
                base64: true,
                events: [
                  'APPLICATION_STARTUP',
                  'QRCODE_UPDATED',
                  'MESSAGES_SET',
                  'MESSAGES_UPSERT',
                  'MESSAGES_UPDATE',
                  'MESSAGES_DELETE',
                  'SEND_MESSAGE',
                  'CONTACTS_SET',
                  'CONTACTS_UPSERT',
                  'CONTACTS_UPDATE',
                  'PRESENCE_UPDATE',
                  'CHATS_SET',
                  'CHATS_UPSERT',
                  'CHATS_UPDATE',
                  'CHATS_DELETE',
                  'CONNECTION_UPDATE',
                  'GROUPS_UPSERT',
                  'GROUP_UPDATE',
                  'GROUP_PARTICIPANTS_UPDATE',
                  'CALL',
                ],
              },
            }),
          })
            .then(res => {
              if (res.ok) {
                console.log('✅ Webhook configurado com sucesso!');
              } else {
                res.text().then(text => console.warn('⚠️ Falha ao configurar webhook:', text));
              }
            })
            .catch(err => console.warn('⚠️ Erro ao configurar webhook:', err));

          // Configurar settings em background
          fetch(`${evolutionApiUrl}/settings/set/${instanceName}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': evolutionApiKey,
            },
            body: JSON.stringify({
              rejectCall: false,
              msgCall: 'Desculpe, não posso atender chamadas no momento.',
              groupsIgnore: true,
              alwaysOnline: true,
              readMessages: true,
              readStatus: false,
              syncFullHistory: false,
            }),
          })
            .then(res => {
              if (res.ok) {
                console.log('✅ Settings configurados com sucesso!');
              } else {
                res.text().then(text => console.warn('⚠️ Falha ao configurar settings:', text));
              }
            })
            .catch(err => console.warn('⚠️ Erro ao configurar settings:', err));
        }
      } else {
        toast.info('Instância já conectada ou aguardando conexão');
      }
    } catch (error: any) {
      console.error('Error connecting WhatsApp:', error);
      toast.error(error.message || 'Erro ao conectar WhatsApp');
    } finally {
      setConnecting(false);
    }
  };

  const handleAddChannel = async () => {
    if (!selectedType) return;

    let credentials: Record<string, any> = {};
    let name = channelConfig[selectedType as keyof typeof channelConfig]?.name || selectedType;

    if (selectedType === 'whatsapp') {
      // Para WhatsApp, usar a função específica
      handleConnectWhatsApp();
      return;
    } else if (selectedType === 'instagram') {
      credentials = {
        instagram_id: configData.instagram_id,
        access_token: configData.access_token,
        page_id: configData.page_id,
      };
      name = configData.channel_name || 'Instagram DM';
    } else if (selectedType === 'messenger') {
      credentials = {
        page_id: configData.page_id,
        access_token: configData.access_token,
        page_name: configData.page_name,
      };
      name = configData.page_name || 'Facebook Messenger';
    }

    createChannel.mutate({ type: selectedType, name, credentials });
  };

  const testWhatsAppConnection = async () => {
    if (!configData.instance_name || !configData.api_url || !configData.api_key) {
      toast.error('Preencha todos os campos obrigatórios primeiro');
      return;
    }

    setTestingConnection(true);
    try {
      // Testar conexão com a Evolution API
      const response = await fetch(`${configData.api_url}/instance/connectionState/${configData.instance_name}`, {
        headers: {
          'apikey': configData.api_key,
        },
      });

      if (!response.ok) {
        throw new Error('Não foi possível conectar à Evolution API');
      }

      const data = await response.json();

      if (data.state === 'open') {
        toast.success('✅ Conexão estabelecida! WhatsApp está conectado.');
      } else if (data.state === 'close') {
        toast.warning('⚠️ Instância existe mas WhatsApp não está conectado. Escaneie o QR Code.');
      } else {
        toast.info(`Status: ${data.state}`);
      }
    } catch (error: any) {
      toast.error(error.message || 'Erro ao testar conexão');
    } finally {
      setTestingConnection(false);
    }
  };

  const handleOAuthConnect = async (type: string) => {
    // Meta OAuth flow via Edge Function
    try {
      const { data, error } = await supabase.functions.invoke('meta-oauth', {
        body: { action: 'get_auth_url', companyId: currentCompany?.id },
      });

      if (error) throw error;
      if (data?.authUrl) {
        const width = 600;
        const height = 700;
        const left = window.screen.width / 2 - width / 2;
        const top = window.screen.height / 2 - height / 2;

        const popup = window.open(
          data.authUrl,
          'Connect With Meta',
          `width=${width},height=${height},left=${left},top=${top}`
        );

        const handleMessage = (event: MessageEvent) => {
          if (event.data?.type === 'oauth-success' && event.data?.provider === 'meta') {
            toast.success('Conectado com sucesso!');
            popup?.close();
            window.removeEventListener('message', handleMessage);
            queryClient.invalidateQueries({ queryKey: ['channels'] });
            setShowAddDialog(false);
            setSelectedType(null);
          }
        };

        window.addEventListener('message', handleMessage);
      }
    } catch (error: any) {
      console.error('Meta OAuth Error:', error);
      toast.error('Erro ao iniciar conexão: ' + (error.message || 'Erro desconhecido'));
    }
  };

  const handleGmailOAuth = () => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

    if (!clientId) {
      toast.error('Google Client ID não configurado. Configure as variáveis de ambiente.');
      return;
    }

    const redirectUri = `${window.location.origin}/oauth/gmail-callback`;
    const scope = [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/gmail.modify',
      'https://www.googleapis.com/auth/userinfo.email',
    ].join(' ');

    const state = JSON.stringify({
      companyId: currentCompany?.id,
      type: 'gmail',
    });

    const oauthUrl = [
      'https://accounts.google.com/o/oauth2/v2/auth',
      `?client_id=${encodeURIComponent(clientId)}`,
      `&redirect_uri=${encodeURIComponent(redirectUri)}`,
      `&scope=${encodeURIComponent(scope)}`,
      '&response_type=code',
      '&access_type=offline',
      '&prompt=consent',
      `&state=${encodeURIComponent(state)}`,
    ].join('');

    // Abrir janela OAuth
    const width = 500;
    const height = 600;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;

    const authWindow = window.open(
      oauthUrl,
      'Google OAuth',
      `width=${width},height=${height},left=${left},top=${top}`
    );

    // Listener para mensagem de sucesso
    const messageHandler = async (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;

      if (event.data.type === 'gmail-oauth-success') {
        window.removeEventListener('message', messageHandler);
        authWindow?.close();

        const { code } = event.data;

        try {
          // Trocar código por tokens
          const { data: { user } } = await supabase.auth.getUser();

          const response = await supabase.functions.invoke('gmail-oauth', {
            body: {
              action: 'exchange_code',
              code: code,
              companyId: currentCompany?.id,
              userId: user?.id,
            },
          });

          if (response.error) throw response.error;

          // Criar canal
          const credentials = {
            email: response.data.email,
            connected_at: new Date().toISOString(),
          };

          createChannel.mutate({
            type: 'email',
            name: `Gmail - ${response.data.email}`,
            credentials,
          });

          toast.success('Gmail conectado com sucesso!');
          setShowAddDialog(false);
          setSelectedType(null);
        } catch (error: any) {
          console.error('Error exchanging OAuth code:', error);
          toast.error(error.message || 'Erro ao conectar Gmail');
        }
      }
    };

    window.addEventListener('message', messageHandler);

    toast.info('Complete a autenticação na janela que abriu', {
      description: 'Após autorizar, o Gmail será conectado automaticamente.',
    });
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-primary" />
              </div>
              <span className="text-2xl font-bold text-foreground">Canais</span>
            </div>
            <div className="h-10 w-px bg-border mx-2"></div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Canais de Comunicação</h1>
              <p className="text-muted-foreground">Conecte WhatsApp, Instagram, Messenger e mais</p>
            </div>
          </div>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Canal
          </Button>
        </div>

        {/* Connected Channels */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : channels.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold text-lg mb-2">Nenhum canal configurado</h3>
              <p className="text-muted-foreground mb-4">
                Adicione um canal para começar a receber mensagens.
              </p>
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Canal
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {channels.map((channel) => {
              const config = channelConfig[channel.type];
              const Icon = config?.icon || MessageSquare;
              const StatusIcon = statusConfig[channel.status]?.icon || XCircle;

              return (
                <Card key={channel.id} className="relative">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${config?.bgColor || 'bg-gray-100'}`}>
                          <Icon className={`h-5 w-5 ${config?.color || 'text-gray-500'}`} />
                        </div>
                        <div>
                          <CardTitle className="text-base">{channel.name}</CardTitle>
                          <p className="text-xs text-muted-foreground capitalize">
                            {config?.name || channel.type}
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={channel.is_active}
                        onCheckedChange={(checked) =>
                          toggleChannel.mutate({ id: channel.id, is_active: checked })
                        }
                      />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Badge className={statusConfig[channel.status]?.color}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {statusConfig[channel.status]?.label}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <div className="text-lg font-semibold">{channel.total_conversations}</div>
                        <div className="text-xs text-muted-foreground">Conversas</div>
                      </div>
                      <div>
                        <div className="text-lg font-semibold">{channel.total_messages_in}</div>
                        <div className="text-xs text-muted-foreground">Recebidas</div>
                      </div>
                      <div>
                        <div className="text-lg font-semibold">{channel.total_messages_out}</div>
                        <div className="text-xs text-muted-foreground">Enviadas</div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => {
                            if (channel.type === 'whatsapp') {
                              setShowWebhookConfig(true);
                            }
                          }}
                        >
                          <Settings className="h-4 w-4 mr-1" />
                          Configurar
                        </Button>
                        {channel.type === 'whatsapp' && (
                          <>
                            {channel.status === 'disconnected' ? (
                              <Button
                                variant="default"
                                size="sm"
                                onClick={handleReconnectWhatsApp}
                                disabled={connecting}
                                className="flex-1"
                              >
                                <QrCode className={`h-4 w-4 mr-1 ${connecting ? 'animate-pulse' : ''}`} />
                                {connecting ? 'Gerando...' : 'Reconectar'}
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => checkAndUpdateChannelStatus(true)}
                                disabled={checkingStatus}
                                className="flex-1"
                              >
                                <RefreshCw className={`h-4 w-4 mr-1 ${checkingStatus ? 'animate-spin' : ''}`} />
                                {checkingStatus ? 'Atualizando...' : 'Atualizar'}
                              </Button>
                            )}
                          </>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (confirm('Remover este canal?')) {
                              deleteChannel.mutate(channel.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Available Channels */}
        <Card>
          <CardHeader>
            <CardTitle>Canais Disponíveis</CardTitle>
            <CardDescription>Adicione novos canais para comunicação omnichannel</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Object.entries(channelConfig).map(([type, config]) => {
                const Icon = config.icon;
                const isConnected = channels.some((c) => c.type === type);

                return (
                  <div
                    key={type}
                    className={`p-4 border rounded-lg ${
                      isConnected ? 'opacity-60' : 'hover:border-primary cursor-pointer'
                    }`}
                    onClick={() => {
                      if (!isConnected) {
                        setSelectedType(type);
                        setShowAddDialog(true);
                      }
                    }}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`p-2 rounded-lg ${config.bgColor}`}>
                        <Icon className={`h-5 w-5 ${config.color}`} />
                      </div>
                      <div>
                        <h4 className="font-semibold">{config.name}</h4>
                        {isConnected && (
                          <Badge variant="secondary" className="text-xs">
                            Conectado
                          </Badge>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{config.description}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Channel Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {selectedType
                ? `Configurar ${channelConfig[selectedType as keyof typeof channelConfig]?.name}`
                : 'Adicionar Canal'}
            </DialogTitle>
            <DialogDescription>
              {selectedType
                ? 'Insira as credenciais para conectar este canal'
                : 'Escolha o tipo de canal que deseja adicionar'}
            </DialogDescription>
          </DialogHeader>

          {!selectedType ? (
            <div className="grid gap-3">
              {Object.entries(channelConfig).map(([type, config]) => {
                const Icon = config.icon;
                return (
                  <button
                    key={type}
                    className="flex items-center gap-3 p-4 border rounded-lg hover:border-primary text-left"
                    onClick={() => setSelectedType(type)}
                  >
                    <div className={`p-2 rounded-lg ${config.bgColor}`}>
                      <Icon className={`h-5 w-5 ${config.color}`} />
                    </div>
                    <div>
                      <div className="font-semibold">{config.name}</div>
                      <div className="text-sm text-muted-foreground">{config.description}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="space-y-4">
              {selectedType === 'instagram' && (
                <>
                  <div className="p-4 bg-pink-50 border border-pink-200 rounded-lg">
                    <p className="text-sm text-pink-800">
                      Para conectar o Instagram, você precisa de uma conta Business/Creator
                      conectada a uma Página do Facebook.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => handleOAuthConnect('instagram')}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Conectar com Facebook
                    </Button>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <Label>Nome do Canal</Label>
                      <Input
                        placeholder="Ex: Instagram Principal"
                        value={configData.channel_name || ''}
                        onChange={(e) =>
                          setConfigData({ ...configData, channel_name: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <Label>Instagram Business Account ID</Label>
                      <Input
                        placeholder="ID da conta Instagram Business"
                        value={configData.instagram_id || ''}
                        onChange={(e) =>
                          setConfigData({ ...configData, instagram_id: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <Label>Page ID (Facebook)</Label>
                      <Input
                        placeholder="ID da página do Facebook vinculada"
                        value={configData.page_id || ''}
                        onChange={(e) => setConfigData({ ...configData, page_id: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Access Token</Label>
                      <Input
                        type="password"
                        placeholder="Token de acesso da API"
                        value={configData.access_token || ''}
                        onChange={(e) =>
                          setConfigData({ ...configData, access_token: e.target.value })
                        }
                      />
                    </div>
                  </div>
                </>
              )}

              {selectedType === 'messenger' && (
                <>
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      Configure sua Página do Facebook para receber mensagens do Messenger.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => handleOAuthConnect('messenger')}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Conectar Página
                    </Button>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <Label>Nome da Página</Label>
                      <Input
                        placeholder="Nome da sua página no Facebook"
                        value={configData.page_name || ''}
                        onChange={(e) =>
                          setConfigData({ ...configData, page_name: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <Label>Page ID</Label>
                      <Input
                        placeholder="ID da página do Facebook"
                        value={configData.page_id || ''}
                        onChange={(e) => setConfigData({ ...configData, page_id: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Page Access Token</Label>
                      <Input
                        type="password"
                        placeholder="Token de acesso da página"
                        value={configData.access_token || ''}
                        onChange={(e) =>
                          setConfigData({ ...configData, access_token: e.target.value })
                        }
                      />
                    </div>
                  </div>
                </>
              )}

              {selectedType === 'whatsapp' && (
                <>
                  <div className="p-6 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center justify-center mb-4">
                      <MessageSquare className="h-16 w-16 text-green-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-green-900 text-center mb-2">
                      Conecte seu WhatsApp
                    </h3>
                    <p className="text-sm text-green-800 text-center mb-4">
                      Sua instância será criada automaticamente usando o CNPJ da empresa
                    </p>
                    <div className="bg-white rounded-lg p-4 border border-green-300">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">Instância:</span>
                        <span className="text-sm font-mono text-green-700">
                          {currentCompany?.cnpj?.replace(/\D/g, '') || 'Configure o CNPJ primeiro'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-sm font-medium text-gray-700">Empresa:</span>
                        <span className="text-sm text-gray-600">{currentCompany?.name}</span>
                      </div>
                    </div>
                    <p className="text-xs text-green-700 text-center mt-4">
                      Após clicar em conectar, você receberá um QR Code para escanear com seu WhatsApp
                    </p>
                  </div>
                </>
              )}

              {selectedType === 'webchat' && (
                <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <p className="text-sm text-purple-800">
                    O Widget de Chat já está disponível nas configurações.
                  </p>
                  <Button variant="outline" size="sm" className="mt-2" asChild>
                    <a href="/settings">
                      <Settings className="h-4 w-4 mr-2" />
                      Configurar Widget
                    </a>
                  </Button>
                </div>
              )}

              {selectedType === 'email' && (
                <>
                  <div className="p-6 bg-orange-50 border border-orange-200 rounded-lg">
                    <div className="flex items-center justify-center mb-4">
                      <Mail className="h-16 w-16 text-orange-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-orange-900 text-center mb-2">
                      Conecte seu Gmail
                    </h3>
                    <p className="text-sm text-orange-800 text-center mb-4">
                      Integre sua conta Gmail para receber e responder emails como conversas no chat
                    </p>
                    <div className="bg-white rounded-lg p-4 border border-orange-300 space-y-3">
                      <div className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-orange-600 mt-0.5" />
                        <span className="text-sm text-gray-700">Receba emails como mensagens</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-orange-600 mt-0.5" />
                        <span className="text-sm text-gray-700">Responda diretamente pelo chat</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-orange-600 mt-0.5" />
                        <span className="text-sm text-gray-700">Sincronização automática</span>
                      </div>
                    </div>
                    <div className="mt-4 text-center">
                      <Button
                        onClick={() => handleGmailOAuth()}
                        className="w-full bg-orange-600 hover:bg-orange-700"
                      >
                        <Mail className="h-4 w-4 mr-2" />
                        Conectar com Google
                      </Button>
                    </div>
                    <p className="text-xs text-orange-700 text-center mt-3">
                      Você será redirecionado para fazer login com sua conta Google
                    </p>
                  </div>
                </>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddDialog(false);
                setSelectedType(null);
                setConfigData({});
              }}
            >
              Cancelar
            </Button>
            {selectedType && ['instagram', 'messenger', 'whatsapp'].includes(selectedType) && (
              <Button onClick={handleAddChannel} disabled={connecting || createChannel.isPending}>
                {(connecting || createChannel.isPending) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {selectedType === 'whatsapp' ? 'Conectar WhatsApp' : 'Salvar Canal'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* QR Code Dialog */}
      <Dialog open={showQRCode} onOpenChange={setShowQRCode}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Escaneie o QR Code</DialogTitle>
            <DialogDescription>
              Abra o WhatsApp no seu celular e escaneie este código para conectar
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center justify-center p-6 space-y-4">
            {qrCodeData ? (
              <>
                <div className="p-4 bg-white rounded-lg border-2 border-green-500">
                  <img
                    src={qrCodeData}
                    alt="QR Code WhatsApp"
                    className="w-64 h-64"
                  />
                </div>
                <div className="text-center space-y-2">
                  <p className="text-sm font-medium">Como escanear:</p>
                  <ol className="text-xs text-muted-foreground space-y-1 text-left">
                    <li>1. Abra o WhatsApp no seu celular</li>
                    <li>2. Toque em Menu ou Configurações</li>
                    <li>3. Toque em Aparelhos conectados</li>
                    <li>4. Toque em Conectar um aparelho</li>
                    <li>5. Aponte seu celular para esta tela</li>
                  </ol>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowQRCode(false);
                setQRCodeData(null);
              }}
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Webhook Configuration Dialog */}
      <Dialog open={showWebhookConfig} onOpenChange={setShowWebhookConfig}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>⚙️ Configurar Webhook e Evolution API</DialogTitle>
            <DialogDescription>
              Configure o webhook para receber mensagens em tempo real e ative as configurações da instância
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Status do Webhook Atual */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Status do Webhook
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {webhookStatus ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium">Webhook configurado</span>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg space-y-1">
                      <p className="text-xs font-medium text-gray-700">URL:</p>
                      <p className="text-xs text-gray-600 break-all">{webhookStatus.url}</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <Badge variant="secondary">
                        {webhookStatus.events?.length || 0} eventos ativos
                      </Badge>
                      {webhookStatus.webhook_by_events && (
                        <Badge variant="secondary">Por eventos</Badge>
                      )}
                      {webhookStatus.webhook_base64 && (
                        <Badge variant="secondary">Base64</Badge>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-amber-600">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm">Webhook não configurado ou não verificado</span>
                  </div>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCheckWebhook}
                  className="w-full"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Verificar Webhook Atual
                </Button>
              </CardContent>
            </Card>

            {/* Informações sobre as Configurações */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">O que será configurado?</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium mb-2">1. Webhook URL:</p>
                    <code className="text-xs bg-gray-100 p-2 rounded block break-all">
                      {import.meta.env.VITE_SUPABASE_URL}/functions/v1/evolution-webhook
                    </code>
                  </div>

                  <div>
                    <p className="text-sm font-medium mb-2">2. Eventos Monitorados (19):</p>
                    <div className="grid grid-cols-2 gap-1 text-xs">
                      <Badge variant="outline" className="text-[10px]">MESSAGES_UPSERT</Badge>
                      <Badge variant="outline" className="text-[10px]">CONNECTION_UPDATE</Badge>
                      <Badge variant="outline" className="text-[10px]">CONTACTS_UPDATE</Badge>
                      <Badge variant="outline" className="text-[10px]">GROUPS_UPSERT</Badge>
                      <Badge variant="outline" className="text-[10px]">+ 15 outros eventos</Badge>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium mb-2">3. Configurações da Instância:</p>
                    <div className="space-y-1 text-xs text-gray-600">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-green-600" />
                        <span>Sempre online: Ativado</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-green-600" />
                        <span>Marcar mensagens como lidas: Ativado</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-green-600" />
                        <span>Ignorar grupos: Ativado</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <XCircle className="h-3 w-3 text-gray-400" />
                        <span>Sincronizar histórico: Desativado</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Aviso */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-blue-900">
                    Importante
                  </p>
                  <p className="text-xs text-blue-800">
                    Esta configuração irá sobrescrever qualquer webhook existente na instância.
                    Certifique-se de que o WhatsApp está conectado antes de configurar.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowWebhookConfig(false)}
              disabled={configuringWebhook}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfigureWebhook}
              disabled={configuringWebhook}
            >
              {configuringWebhook ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Configurando...
                </>
              ) : (
                <>
                  <Settings className="h-4 w-4 mr-2" />
                  Configurar Webhook
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
