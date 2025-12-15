import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Mic, Square, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSendAudioMessage } from "@/hooks/api/useEvolutionApi";
import { useCompany } from "@/contexts/CompanyContext";

interface AudioRecorderProps {
  conversationId: string;
  contactNumber: string;
  onSent?: () => void;
  onStartRecording?: () => void;
}

export function AudioRecorder({ conversationId, contactNumber, onSent, onStartRecording }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      // Check if mediaDevices is available (requires HTTPS or localhost)
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast.error("Acesso ao microfone requer HTTPS ou localhost. Acesse via http://localhost:5173");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/ogg; codecs=opus' });
        await sendAudioMessage(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      onStartRecording?.();
    } catch (error: any) {
      console.error('Error starting recording:', error);
      toast.error(`Erro ao acessar microfone: ${error.message || "Permissão negada ou contexto inseguro"}`);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const { currentCompany } = useCompany();
  // const sendAudioMessageHook = useSendAudioMessage(currentCompany?.evolution_instance_name || '');

  const sendAudioMessage = async (audioBlob: Blob) => {
    // if (!currentCompany?.evolution_instance_name) {
    //   toast.error("Evolution API não configurada");
    //   return;
    // }

    setIsSending(true);
    try {
      // Convert Blob to Base64
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);

      await new Promise((resolve, reject) => {
        reader.onloadend = async () => {
          try {
            const base64Audio = (reader.result as string).split(',')[1];

            // Send via Edge Function
            const { data: result, error } = await supabase.functions.invoke('send-message', {
              body: {
                conversationId,
                messageType: 'audio',
                audio: base64Audio,
              }
            });

            if (error || !result?.success) {
              throw new Error(result?.error || error?.message || "Erro ao enviar áudio");
            }

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
      console.error('Error sending audio:', error);
      toast.error("Erro ao enviar áudio");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div>
      {!isRecording ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={startRecording}
          disabled={isSending}
        >
          {isSending ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Mic className="w-5 h-5" />
          )}
        </Button>
      ) : (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={stopRecording}
          className="text-destructive hover:text-destructive"
        >
          <Square className="w-5 h-5 fill-current" />
        </Button>
      )}
    </div>
  );
}
