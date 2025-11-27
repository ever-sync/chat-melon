import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Mic, Square, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

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
    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error("Não foi possível acessar o microfone");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const sendAudioMessage = async (audioBlob: Blob) => {
    setIsSending(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      // Upload to storage
      const fileName = `audio_${Date.now()}.ogg`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('chat-media')
        .upload(`${user.id}/${fileName}`, audioBlob, {
          contentType: 'audio/ogg',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('chat-media')
        .getPublicUrl(uploadData.path);

      // Get session for authorization
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Sessão expirada');

      // Send via Evolution API with correct audio endpoint
      const { error: sendError } = await supabase.functions.invoke('evolution-send-audio', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: {
          conversationId: conversationId,
          audioUrl: publicUrl,
        }
      });

      if (sendError) throw sendError;

      toast.success("Áudio enviado com sucesso");

      onSent?.();
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
