import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { Bot, User, Clock, Check, CheckCheck, AlertCircle, EyeOff, BarChart3, ListOrdered, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MessageActions } from './MessageActions';
import { ContactAvatar } from '@/components/ContactAvatar';
import { useCompany } from '@/contexts/CompanyContext';
import { AudioTranscription } from './AudioTranscription';

interface MessageBubbleProps {
  message: {
    id: string;
    content: string;
    content_type?: string;
    message_type?: string;
    is_from_me: boolean;
    is_from_ai?: boolean;
    ai_model?: string;
    ai_confidence?: number;
    ai_intent_detected?: string;
    ai_sentiment?: string;
    status?: string;
    timestamp: string;
    edited_at?: string;
    delivered_at?: string;
    read_at?: string;
    media_url?: string;
    media_type?: string;
    poll_data?: any;
    list_data?: any;
    location_data?: any;
    contact_data?: any;
    audio_transcription?: string;
    transcription_status?: 'pending' | 'processing' | 'completed' | 'failed';
    transcription_language?: string;
    transcription_confidence?: number;
    sender?: {
      name: string;
      avatar_url?: string;
    };
  };
  showSender?: boolean;
  contactAvatar?: string;
  contactName?: string;
  contactPhone?: string;
  onUpdated?: () => void;
}

export function MessageBubble({ message, showSender = false, contactAvatar, contactName, contactPhone, onUpdated }: MessageBubbleProps) {
  const { currentCompany } = useCompany();
  const isFromMe = message.is_from_me;
  const isFromAI = message.is_from_ai;
  const isSystemMessage = message.message_type === 'system' || message.content_type === 'system';
  const isInternalNote = message.message_type === 'internal_note';

  // Mensagens de sistema (transferências, alertas)
  if (isSystemMessage) {
    return (
      <div className="flex justify-center my-4">
        <div className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full text-sm">
          {message.content}
        </div>
      </div>
    );
  }

  // Notas internas
  if (isInternalNote) {
    return (
      <div className="my-2">
        <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg px-4 py-3">
          <div className="flex items-center gap-2 mb-1">
            <EyeOff className="w-4 h-4 text-yellow-700 dark:text-yellow-400" />
            <span className="text-xs font-medium text-yellow-700 dark:text-yellow-400">
              Nota Interna
            </span>
          </div>
          <p className="text-sm text-foreground whitespace-pre-wrap">{message.content}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {format(new Date(message.timestamp), 'HH:mm', { locale: ptBR })}
          </p>
        </div>
      </div>
    );
  }

  // Definir cores baseado no tipo
  const getBubbleStyle = () => {
    if (!isFromMe) {
      // Mensagem do lead - cinza
      return 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100';
    }
    if (isFromAI) {
      // Mensagem da IA - verde esmeralda para diferenciar
      return 'bg-emerald-500 text-white';
    }
    // Mensagem do atendente humano - indigo suave
    return 'bg-indigo-500 text-white';
  };

  const getSentimentBadge = () => {
    if (!message.ai_sentiment) return null;

    const colors = {
      positive: 'bg-green-100 text-green-800',
      neutral: 'bg-gray-100 text-gray-800',
      negative: 'bg-red-100 text-red-800',
    };

    const labels = {
      positive: '😊 Positivo',
      neutral: '😐 Neutro',
      negative: '😟 Negativo',
    };

    return (
      <Badge className={cn('text-xs', colors[message.ai_sentiment as keyof typeof colors])}>
        {labels[message.ai_sentiment as keyof typeof labels]}
      </Badge>
    );
  };

  const getStatusIcon = () => {
    switch (message.status) {
      case 'pending':
        return <Clock className="h-3 w-3 text-gray-400" />;
      case 'sent':
        return <Check className="h-3 w-3 text-gray-400" />;
      case 'delivered':
        return <CheckCheck className="h-3 w-3 text-gray-400" />;
      case 'read':
        return <CheckCheck className="h-3 w-3 text-blue-500" />;
      case 'error':
        return <AlertCircle className="h-3 w-3 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <TooltipProvider>
      <div className={cn(
        'flex gap-2 mb-4',
        isFromMe ? 'justify-end' : 'justify-start'
      )}>
        {/* Avatar do lead (esquerda) */}
        {!isFromMe && contactPhone && (
          <ContactAvatar
            phoneNumber={contactPhone}
            name={contactName}
            instanceName={currentCompany?.evolution_instance_name || ''}
            profilePictureUrl={contactAvatar}
            size="sm"
          />
        )}

        <div className={cn(
          'max-w-[70%] flex flex-col',
          isFromMe ? 'items-end' : 'items-start'
        )}>
          {/* Header com nome e indicador IA */}
          {(showSender || isFromAI) && isFromMe && (
            <div className="flex items-center gap-2 mb-1">
              {isFromAI ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1 text-xs text-emerald-600">
                      <Bot className="h-3 w-3" />
                      <span>IA</span>
                      {message.ai_confidence && (
                        <span className="text-gray-400">
                          ({Math.round(message.ai_confidence * 100)}%)
                        </span>
                      )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Modelo: {message.ai_model || 'Não especificado'}</p>
                    {message.ai_intent_detected && (
                      <p>Intenção: {message.ai_intent_detected}</p>
                    )}
                  </TooltipContent>
                </Tooltip>
              ) : (
                <span className="text-xs text-gray-500">
                  {message.sender?.name || 'Atendente'}
                </span>
              )}
            </div>
          )}

          {/* Bolha da mensagem */}
          <div className={cn(
            'px-4 py-2 rounded-2xl shadow-sm',
            getBubbleStyle(),
            isFromMe ? 'rounded-br-md' : 'rounded-bl-md'
          )}>
            {/* Media attachments */}
            {message.media_url && (
              <div className="mb-2">
                {message.media_type?.startsWith('image/') && (
                  <img
                    src={message.media_url}
                    alt="Media"
                    className="max-w-full rounded max-h-64 object-contain"
                  />
                )}
                {message.media_type?.startsWith('video/') && (
                  <video
                    src={message.media_url}
                    controls
                    className="max-w-full rounded max-h-64"
                  />
                )}
                {message.media_type?.startsWith('audio/') && (
                  <>
                    <audio src={message.media_url} controls className="max-w-full" />
                    <AudioTranscription
                      messageId={message.id}
                      transcription={message.audio_transcription}
                      status={message.transcription_status}
                      language={message.transcription_language}
                      confidence={message.transcription_confidence}
                      onTranscribe={onUpdated}
                    />
                  </>
                )}
                {!message.media_type?.startsWith('image/') &&
                  !message.media_type?.startsWith('video/') &&
                  !message.media_type?.startsWith('audio/') && (
                    <a
                      href={message.media_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline text-xs"
                    >
                      📎 Abrir arquivo
                    </a>
                  )}
              </div>
            )}

            {/* Poll data */}
            {message.poll_data && (
              <div className="mb-2 p-3 bg-black/10 rounded-lg space-y-2">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  <p className="font-medium">{message.poll_data.question}</p>
                </div>
                {message.poll_data.options?.map((opt: any, i: number) => (
                  <div key={i} className="flex justify-between text-sm bg-black/5 p-2 rounded">
                    <span>{opt.name}</span>
                    <span className="font-medium">{opt.votes || 0} votos</span>
                  </div>
                ))}
              </div>
            )}

            {/* List data */}
            {message.list_data && (
              <div className="mb-2 p-3 bg-black/10 rounded-lg space-y-1">
                <div className="flex items-center gap-2">
                  <ListOrdered className="w-4 h-4" />
                  <p className="font-medium">{message.list_data.title}</p>
                </div>
                <p className="text-sm opacity-80">{message.list_data.description}</p>
              </div>
            )}

            {/* Location data */}
            {message.location_data && (
              <div className="mb-2 p-3 bg-black/10 rounded-lg space-y-1">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <p className="font-medium">{message.location_data.name || 'Localização'}</p>
                </div>
                {message.location_data.address && (
                  <p className="text-sm opacity-80">{message.location_data.address}</p>
                )}
                <a
                  href={`https://www.google.com/maps?q=${message.location_data.latitude},${message.location_data.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs underline opacity-80 hover:opacity-100 flex items-center gap-1"
                >
                  🗺️ Abrir no Google Maps
                </a>
              </div>
            )}

            {/* Contact data */}
            {message.contact_data && (
              <div className="mb-2 p-3 bg-black/10 rounded-lg space-y-1">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <p className="font-medium">{message.contact_data.name}</p>
                </div>
                <p className="text-sm opacity-80">{message.contact_data.phone}</p>
              </div>
            )}

            <p className="whitespace-pre-wrap break-words text-sm">{message.content}</p>
          </div>

          {/* Footer com hora, status e sentimento */}
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-gray-400">
              {format(new Date(message.timestamp), 'HH:mm', { locale: ptBR })}
            </span>

            {isFromMe && getStatusIcon()}
            {message.edited_at && <span className="text-xs italic text-gray-400">(editado)</span>}

            {/* Badge de sentimento (só para mensagens do lead analisadas) */}
            {!isFromMe && message.ai_sentiment && getSentimentBadge()}

            {/* Message actions */}
            {isFromMe && onUpdated && (
              <MessageActions
                messageId={message.id}
                content={message.content}
                timestamp={message.timestamp}
                isFromMe={message.is_from_me}
                onUpdated={onUpdated}
              />
            )}
          </div>
        </div>

        {/* Avatar do atendente/IA (direita) */}
        {isFromMe && (
          <Avatar className={cn(
            'h-8 w-8 flex-shrink-0',
            isFromAI ? 'ring-2 ring-emerald-500' : 'ring-2 ring-indigo-500'
          )}>
            {isFromAI ? (
              <AvatarFallback className="bg-emerald-100">
                <Bot className="h-4 w-4 text-emerald-600" />
              </AvatarFallback>
            ) : (
              <>
                <AvatarImage src={message.sender?.avatar_url} />
                <AvatarFallback className="bg-indigo-100 text-indigo-700">
                  {message.sender?.name?.charAt(0) || 'A'}
                </AvatarFallback>
              </>
            )}
          </Avatar>
        )}
      </div>
    </TooltipProvider>
  );
}
