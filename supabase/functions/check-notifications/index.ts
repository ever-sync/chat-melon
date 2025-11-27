import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Checking for overdue tasks and inactive deals...');

    // Verificar tarefas atrasadas
    const { error: tasksError } = await supabase.rpc('notify_overdue_tasks');
    
    if (tasksError) {
      console.error('Error checking overdue tasks:', tasksError);
    } else {
      console.log('Overdue tasks checked successfully');
    }

    // Verificar deals inativos
    const { error: dealsError } = await supabase.rpc('notify_inactive_deals');
    
    if (dealsError) {
      console.error('Error checking inactive deals:', dealsError);
    } else {
      console.log('Inactive deals checked successfully');
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Notifications checked successfully'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
