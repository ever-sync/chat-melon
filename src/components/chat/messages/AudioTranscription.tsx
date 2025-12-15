import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Loader2, FileAudio, Copy, CheckCheck, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface AudioTranscriptionProps {
  messageId: string;
  transcription?: string;
  status?: 'pending' | 'processing' | 'completed' | 'failed';
  language?: string;
  confidence?: number;
  onTranscribe?: () => void;
}

export function AudioTranscription({
  messageId,
  transcription,
  status,
  language,
  confidence,
  onTranscribe,
}: AudioTranscriptionProps) {
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleManualTranscribe = async () => {
    try {
      setIsTranscribing(true);

      // Get message details
      const { data: message, error: messageError } = await supabase
        .from('messages')
        .select('media_url, conversation_id')
        .eq('id', messageId)
        .single();

      if (messageError) throw messageError;

      if (!message.media_url) {
        throw new Error('Nenhuma URL de áudio encontrada');
      }

      // Get conversation to find company_id
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .select('company_id')
        .eq('id', message.conversation_id)
        .single();

      if (convError) throw convError;

      // Get transcription config
      const { data: config } = await supabase
        .from('transcription_configs')
        .select('*')
        .eq('company_id', conversation.company_id)
        .single();

      // Call transcription function
      const { data, error } = await supabase.functions.invoke('transcribe-audio', {
        body: {
          messageId,
          audioUrl: message.media_url,
          language: config?.language || 'pt',
          provider: config?.provider || 'groq',
        },
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: 'Transcrição concluída',
          description: 'O áudio foi transcrito com sucesso.',
        });
        onTranscribe?.();
      } else {
        throw new Error(data.error || 'Erro ao transcrever');
      }
    } catch (error: any) {
      console.error('Transcription error:', error);
      toast({
        title: 'Erro ao transcrever',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleCopyTranscription = async () => {
    if (!transcription) return;

    try {
      await navigator.clipboard.writeText(transcription);
      setCopied(true);
      toast({
        title: 'Copiado',
        description: 'Transcrição copiada para a área de transferência.',
      });

      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: 'Erro ao copiar',
        description: 'Não foi possível copiar a transcrição.',
        variant: 'destructive',
      });
    }
  };

  // Show transcription status badge
  const renderStatusBadge = () => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="outline" className="gap-1">
            <Loader2 className="w-3 h-3 animate-spin" />
            Aguardando transcrição
          </Badge>
        );
      case 'processing':
        return (
          <Badge variant="outline" className="gap-1">
            <Loader2 className="w-3 h-3 animate-spin" />
            Transcrevendo...
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="destructive" className="gap-1">
            <AlertCircle className="w-3 h-3" />
            Falha na transcrição
          </Badge>
        );
      case 'completed':
        return (
          <Badge variant="secondary" className="gap-1">
            <CheckCheck className="w-3 h-3" />
            Transcrito
            {language && ` (${language.toUpperCase()})`}
          </Badge>
        );
      default:
        return null;
    }
  };

  // If no transcription and no status, show manual trigger button
  if (!status && !transcription) {
    return (
      <div className="mt-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleManualTranscribe}
          disabled={isTranscribing}
          className="gap-2"
        >
          {isTranscribing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Transcrevendo...
            </>
          ) : (
            <>
              <FileAudio className="w-4 h-4" />
              Transcrever áudio
            </>
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className="mt-2 space-y-2">
      {/* Status Badge */}
      <div className="flex items-center justify-between">
        {renderStatusBadge()}
        {confidence !== undefined && status === 'completed' && (
          <span className="text-xs text-muted-foreground">
            Confiança: {(confidence * 100).toFixed(0)}%
          </span>
        )}
      </div>

      {/* Transcription Text */}
      {transcription && status === 'completed' && (
        <Card className="p-3 bg-muted/50">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                {transcription}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopyTranscription}
              className="shrink-0"
            >
              {copied ? (
                <CheckCheck className="w-4 h-4 text-green-500" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
          </div>
        </Card>
      )}

      {/* Retry button if failed */}
      {status === 'failed' && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleManualTranscribe}
          disabled={isTranscribing}
          className="gap-2"
        >
          {isTranscribing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Tentando novamente...
            </>
          ) : (
            <>
              <FileAudio className="w-4 h-4" />
              Tentar novamente
            </>
          )}
        </Button>
      )}
    </div>
  );
}
