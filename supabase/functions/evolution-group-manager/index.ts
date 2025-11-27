import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { action, companyId, ...params } = await req.json();

    console.log('Group manager action:', action, params);

    // Usar segredos globais
    const apiUrl = Deno.env.get('EVOLUTION_API_URL');
    const apiKey = Deno.env.get('EVOLUTION_API_KEY');

    if (!apiUrl || !apiKey) {
      throw new Error('Evolution API não configurada no backend');
    }

    const { data: evolutionSettings, error: settingsError } = await supabase
      .from('evolution_settings')
      .select('*')
      .eq('company_id', companyId)
      .maybeSingle();

    if (!evolutionSettings || settingsError) {
      throw new Error('Evolution API not configured');
    }

    let result;
    let endpoint = '';
    let method = 'POST';
    let body = {};

    switch (action) {
      case 'create':
        endpoint = `/group/create/${evolutionSettings.instance_name}`;
        body = {
          subject: params.name,
          description: params.description,
          participants: params.participants
        };
        break;

      case 'updateName':
        endpoint = `/group/updateGroupSubject/${evolutionSettings.instance_name}`;
        body = {
          groupJid: params.groupId,
          subject: params.name
        };
        break;

      case 'updateDescription':
        endpoint = `/group/updateGroupDescription/${evolutionSettings.instance_name}`;
        body = {
          groupJid: params.groupId,
          description: params.description
        };
        break;

      case 'addParticipant':
        endpoint = `/group/updateParticipant/${evolutionSettings.instance_name}`;
        body = {
          groupJid: params.groupId,
          action: 'add',
          participants: [params.participant]
        };
        break;

      case 'removeParticipant':
        endpoint = `/group/updateParticipant/${evolutionSettings.instance_name}`;
        body = {
          groupJid: params.groupId,
          action: 'remove',
          participants: [params.participant]
        };
        break;

      case 'promoteParticipant':
        endpoint = `/group/updateParticipant/${evolutionSettings.instance_name}`;
        body = {
          groupJid: params.groupId,
          action: 'promote',
          participants: [params.participant]
        };
        break;

      case 'demoteParticipant':
        endpoint = `/group/updateParticipant/${evolutionSettings.instance_name}`;
        body = {
          groupJid: params.groupId,
          action: 'demote',
          participants: [params.participant]
        };
        break;

      case 'getInviteCode':
        endpoint = `/group/inviteCode/${evolutionSettings.instance_name}`;
        method = 'GET';
        endpoint += `?groupJid=${params.groupId}`;
        break;

      case 'revokeInviteCode':
        endpoint = `/group/revokeInviteCode/${evolutionSettings.instance_name}`;
        body = {
          groupJid: params.groupId
        };
        break;

      case 'updateSettings':
        endpoint = `/group/updateSetting/${evolutionSettings.instance_name}`;
        body = {
          groupJid: params.groupId,
          action: params.setting,
          value: params.value
        };
        break;

      default:
        throw new Error('Invalid action');
    }

    const response = await fetch(
      `${apiUrl}${endpoint}`,
      {
        method,
        headers: {
          'Content-Type': 'application/json',
          'apikey': apiKey,
        },
        ...(method === 'POST' && { body: JSON.stringify(body) })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Evolution API error:', errorText);
      throw new Error(`Failed to ${action}: ${response.statusText}`);
    }

    result = await response.json();
    console.log('Group action result:', result);

    return new Response(JSON.stringify({ success: true, result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in group manager:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});