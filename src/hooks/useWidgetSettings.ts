import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyQuery } from './useCompanyQuery';
import { toast } from 'sonner';

export interface WidgetSettings {
  id: string;
  company_id: string;
  enabled: boolean;

  // Appearance
  primary_color: string;
  secondary_color: string;
  position: 'bottom-right' | 'bottom-left';
  button_size: 'small' | 'medium' | 'large';
  button_icon: string;
  border_radius: number;

  // Branding
  show_branding: boolean;
  logo_url?: string;
  company_name?: string;

  // Texts
  greeting_title: string;
  greeting_message: string;
  offline_message: string;
  input_placeholder: string;

  // Pre-chat form
  require_name: boolean;
  require_email: boolean;
  require_phone: boolean;
  custom_fields: CustomField[];

  // Behavior
  auto_open_delay?: number;
  show_agent_photo: boolean;
  show_agent_name: boolean;
  play_sound: boolean;
  show_typing_indicator: boolean;

  // Business hours
  business_hours_only: boolean;
  business_hours: Record<string, { start: string; end: string }>;
  timezone: string;

  // Domains
  allowed_domains: string[];

  // Triggers
  triggers: WidgetTrigger[];

  // Analytics
  total_conversations: number;
  total_messages: number;

  created_at: string;
  updated_at: string;
}

export interface CustomField {
  id: string;
  label: string;
  type: 'text' | 'email' | 'phone' | 'select' | 'textarea';
  required: boolean;
  options?: string[]; // For select type
}

export interface WidgetTrigger {
  type: 'time' | 'scroll' | 'exit_intent' | 'page_views';
  value: number;
  enabled: boolean;
}

export const useWidgetSettings = () => {
  const { companyId } = useCompanyQuery();
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['widget-settings', companyId],
    queryFn: async () => {
      if (!companyId) return null;

      const { data, error } = await supabase
        .from('widget_settings')
        .select('*')
        .eq('company_id', companyId)
        .maybeSingle();

      if (error) throw error;
      return data as WidgetSettings | null;
    },
    enabled: !!companyId,
  });

  const createSettings = useMutation({
    mutationFn: async (settings: Partial<WidgetSettings>) => {
      if (!companyId) throw new Error('No company selected');

      const { data, error } = await supabase
        .from('widget_settings')
        .insert({
          company_id: companyId,
          ...settings,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['widget-settings'] });
      toast.success('Widget configurado!');
    },
    onError: (error) => {
      toast.error('Erro ao configurar widget: ' + error.message);
    },
  });

  const updateSettings = useMutation({
    mutationFn: async (updates: Partial<WidgetSettings>) => {
      if (!companyId || !settings?.id) throw new Error('No settings to update');

      const { data, error } = await supabase
        .from('widget_settings')
        .update(updates)
        .eq('id', settings.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['widget-settings'] });
      toast.success('Widget atualizado!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar widget: ' + error.message);
    },
  });

  const generateEmbedCode = (): string => {
    if (!companyId) return '';

    return `<!-- MelonChat Widget -->
<script>
  (function(w,d,s,c){
    w.MelonChatConfig = c;
    var f=d.getElementsByTagName(s)[0],
        j=d.createElement(s);
    j.async=true;
    j.src='${window.location.origin}/widget/v1/widget.js';
    f.parentNode.insertBefore(j,f);
  })(window,document,'script',{
    companyId: '${companyId}',
    primaryColor: '${settings?.primary_color || '#22C55E'}'
  });
</script>`;
  };

  return {
    settings,
    isLoading,
    createSettings,
    updateSettings,
    generateEmbedCode,
    hasSettings: !!settings,
  };
};
