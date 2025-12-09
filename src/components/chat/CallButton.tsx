import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Phone, Video, Loader2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";

interface CallButtonProps {
  contactNumber: string;
  contactName: string;
}

export function CallButton({ contactNumber, contactName }: CallButtonProps) {
  const [isInitiating, setIsInitiating] = useState(false);

  const initiateCall = async (type: 'audio' | 'video') => {
    setIsInitiating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Usuário não autenticado');
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://nmbiuebxhovmwxrbaxsz.supabase.co';

      const response = await fetch(`${supabaseUrl}/functions/v1/evolution-initiate-call`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          number: contactNumber,
          type: type === 'audio' ? 'voice' : 'video'
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || `Erro ${response.status}: ${response.statusText}`);
      }

      toast.success(`Chamada de ${type === 'audio' ? 'voz' : 'vídeo'} iniciada com sucesso`);
    } catch (error) {
      console.error('Error initiating call:', error);
      toast.error(error instanceof Error ? error.message : "Erro ao iniciar chamada");
    } finally {
      setIsInitiating(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" disabled={isInitiating}>
          {isInitiating ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Phone className="w-5 h-5" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => initiateCall('audio')}>
          <Phone className="w-4 h-4 mr-2" />
          Chamada de Voz
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => initiateCall('video')}>
          <Video className="w-4 h-4 mr-2" />
          Chamada de Vídeo
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
