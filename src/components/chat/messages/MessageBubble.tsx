import React from 'react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import {
  Bot,
  User,
  Clock,
  Check,
  CheckCheck,
  AlertCircle,
  EyeOff,
  BarChart3,
  ListOrdered,
  MapPin,
  FileText,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MessageActions } from './MessageActions';
import { ContactAvatar } from '@/components/ContactAvatar';
import { useCompany } from '@/contexts/CompanyContext';
import { AudioTranscription } from './AudioTranscription';

// Função utilitária para decidir se o texto deve ser preto ou branco com base no fundo
const getContrastColor = (hexcolor: string) => {
  if (!hexcolor) return '#ffffff';
  if (hexcolor.startsWith('#')) {
    const r = parseInt(hexcolor.slice(1, 3), 16);
    const g = parseInt(hexcolor.slice(3, 5), 16);
    const b = parseInt(hexcolor.slice(5, 7), 16);
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;
    return yiq >= 128 ? '#000000' : '#ffffff';
  }
  return '#ffffff';
};

// Função para converter URLs em links clicáveis
const linkifyText = (text: string): React.ReactNode[] => {
  // Regex para detectar URLs (http, https, www)
  const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)/gi;
  const parts = text.split(urlRegex);

  return parts.map((part, index) => {
    if (!part) return null;

    // Verificar se é uma URL
    if (urlRegex.test(part)) {
      // Reset regex lastIndex
      urlRegex.lastIndex = 0;
      const href = part.startsWith('www.') ? `https://${part}` : part;
      return (
        <a
          key={index}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 hover:text-blue-600 underline break-all"
          onClick={(e) => e.stopPropagation()}
        >
          {part}
        </a>
      );
    }

    return <span key={index}>{part}</span>;
  }).filter(Boolean);
};

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
      message_color?: string;
    };
  };
  showSender?: boolean;
  contactAvatar?: string;
  contactName?: string;
  contactPhone?: string;
  onUpdated?: () => void;
}

export function MessageBubble({
  message,
  showSender = false,
  contactAvatar,
  contactName,
  contactPhone,
  onUpdated,
}: MessageBubbleProps) {
  const { currentCompany } = useCompany();
  // Estados para controle de carregamento de mídia
  const [mediaError, setMediaError] = React.useState(false);
  const [isMediaLoading, setIsMediaLoading] = React.useState(true);

  // Reset do estado quando a mídia muda
  React.useEffect(() => {
    if (message.media_url) {
      setMediaError(false);
      setIsMediaLoading(true);
    }
  }, [message.media_url]);

  const isFromMe = message.is_from_me;
  const isFromAI = message.is_from_ai;
  const isSystemMessage = message.message_type === 'system' || message.content_type === 'system';
  const isInternalNote = message.message_type === 'internal_note';

  // Mensagens de sistema (transferências, alertas)
  if (isSystemMessage) {
    return (
      <div className="flex justify-center my-4">
        <div className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full text-sm">
          {linkifyText(message.content)}
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
          <p className="text-sm text-foreground whitespace-pre-wrap">{linkifyText(message.content)}</p>
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
    // Mensagem do atendente humano - usar cor personalizada se disponível
    if (message.sender?.message_color) {
      return ''; // Retornamos vazio para aplicar via style inline
    }
    return 'bg-indigo-500 text-white';
  };

  const getCustomStyle = () => {
    if (isFromMe && !isFromAI && message.sender?.message_color) {
      return {
        backgroundColor: message.sender.message_color,
        color: getContrastColor(message.sender.message_color)
      };
    }
    return {};
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
      <div className={cn('flex gap-2 mb-4', isFromMe ? 'justify-end' : 'justify-start')}>
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

        <div className={cn('max-w-[70%] flex flex-col', isFromMe ? 'items-end' : 'items-start')}>
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
                    {message.ai_intent_detected && <p>Intenção: {message.ai_intent_detected}</p>}
                  </TooltipContent>
                </Tooltip>
              ) : (
                <span className="text-xs text-gray-500">{message.sender?.name || 'Atendente'}</span>
              )}
            </div>
          )}

          {/* Bolha da mensagem */}
          <div
            className={cn(
              'px-4 py-2 rounded-2xl shadow-sm',
              getBubbleStyle(),
              isFromMe ? 'rounded-br-md' : 'rounded-bl-md'
            )}
            style={getCustomStyle()}
          >
            {/* Placeholder para mídia não disponível */}
            {!message.media_url && message.media_type && (
              <div className="mb-2 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center gap-3 min-w-[200px]">
                <div className="p-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                  {message.media_type.includes('image') && <AlertCircle className="h-5 w-5 text-gray-500" />}
                  {message.media_type.includes('video') && <AlertCircle className="h-5 w-5 text-gray-500" />}
                  {message.media_type.includes('audio') && <AlertCircle className="h-5 w-5 text-gray-500" />}
                  {message.media_type.includes('sticker') && <AlertCircle className="h-5 w-5 text-gray-500" />}
                  {message.media_type.includes('document') && <FileText className="h-5 w-5 text-gray-500" />}
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {message.media_type.includes('image') && 'Imagem não disponível'}
                    {message.media_type.includes('video') && 'Vídeo não disponível'}
                    {message.media_type.includes('audio') && 'Áudio não disponível'}
                    {message.media_type.includes('sticker') && 'Figurinha não disponível'}
                    {message.media_type.includes('document') && 'Documento não disponível'}
                  </p>
                  <p className="text-xs text-gray-400">A mídia expirou ou não pôde ser baixada</p>
                </div>
              </div>
            )}

            {/* Media attachments */}
            {message.media_url && (
              <div className="mb-2">
                {/* Tratamento de erro universal para todas as mídias */}
                {mediaError ? (
                  <div className="flex flex-col items-center justify-center p-6 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-200 dark:border-red-900/30 min-w-[200px]">
                    <AlertCircle className="h-8 w-8 text-red-500 mb-2" />
                    <p className="text-xs text-red-600 dark:text-red-400">Erro ao carregar mídia</p>
                    <button
                      onClick={() => { setMediaError(false); setIsMediaLoading(true); }}
                      className="mt-2 text-[10px] underline text-red-500"
                    >
                      Tentar novamente
                    </button>
                    <a
                      href={message.media_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 text-[10px] text-blue-500 underline"
                    >
                      Abrir em nova aba
                    </a>
                  </div>
                ) : (
                  <>
                    {message.media_type?.includes('image') && (
                      <div className="relative group min-h-[100px] min-w-[200px]">
                        {isMediaLoading && (
                          <div className="w-full aspect-video bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center animate-pulse">
                            <Clock className="h-5 w-5 text-gray-400" />
                          </div>
                        )}
                        <img
                          src={message.media_url}
                          alt="Imagem"
                          className={cn(
                            "max-w-full rounded-lg max-h-96 object-contain cursor-pointer hover:opacity-90 transition-opacity",
                            isMediaLoading ? "opacity-0 invisible absolute" : "opacity-100 visible h-auto"
                          )}
                          onClick={() => window.open(message.media_url, '_blank')}
                          onLoad={() => setIsMediaLoading(false)}
                          onError={() => {
                            console.error('Erro ao carregar imagem:', message.media_url);
                            setMediaError(true);
                            setIsMediaLoading(false);
                          }}
                        />
                        <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <a
                            href={message.media_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-black/50 text-white px-2 py-1 rounded text-xs backdrop-blur-sm"
                          >
                            Abrir
                          </a>
                        </div>
                      </div>
                    )}
                    {message.media_type?.includes('video') && (
                      <div className="relative group">
                        {isMediaLoading && (
                          <div className="w-full aspect-video bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center animate-pulse">
                            <Clock className="h-5 w-5 text-gray-400" />
                          </div>
                        )}
                        <video
                          src={message.media_url}
                          controls
                          controlsList="nodownload"
                          className={cn(
                            "max-w-full rounded-lg max-h-96",
                            isMediaLoading ? "opacity-0 absolute" : "opacity-100"
                          )}
                          preload="metadata"
                          onLoadedMetadata={() => setIsMediaLoading(false)}
                          onError={() => {
                            console.error('Erro ao carregar video:', message.media_url);
                            setMediaError(true);
                            setIsMediaLoading(false);
                          }}
                        >
                          Seu navegador não suporta vídeo.
                        </video>
                      </div>
                    )}
                    {message.media_type?.includes('audio') && (
                      <div className="space-y-2">
                        <audio
                          src={message.media_url}
                          controls
                          controlsList="nodownload"
                          className="w-full max-w-sm"
                          preload="metadata"
                          onLoadedMetadata={() => setIsMediaLoading(false)}
                          onError={() => {
                            console.error('Erro ao carregar audio:', message.media_url);
                            setMediaError(true);
                            setIsMediaLoading(false);
                          }}
                        >
                          Seu navegador não suporta áudio.
                        </audio>
                        <AudioTranscription
                          messageId={message.id}
                          transcription={message.audio_transcription}
                          status={message.transcription_status}
                          language={message.transcription_language}
                          confidence={message.transcription_confidence}
                          onTranscribe={onUpdated}
                        />
                      </div>
                    )}
                    {message.media_type?.includes('sticker') && (
                      <div className="relative group">
                        {isMediaLoading && (
                          <div className="w-32 h-32 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center animate-pulse">
                            <Clock className="h-5 w-5 text-gray-400" />
                          </div>
                        )}
                        <img
                          src={message.media_url}
                          alt="Figurinha"
                          className={cn(
                            "w-32 h-32 object-contain",
                            isMediaLoading ? "opacity-0 absolute" : "opacity-100"
                          )}
                          loading="lazy"
                          onLoad={() => setIsMediaLoading(false)}
                          onError={() => {
                            console.error('Erro ao carregar figurinha:', message.media_url);
                            setMediaError(true);
                            setIsMediaLoading(false);
                          }}
                        />
                      </div>
                    )}
                    {/* Documentos e outros tipos */}
                    {!message.media_type?.includes('image') &&
                      !message.media_type?.includes('video') &&
                      !message.media_type?.includes('audio') &&
                      !message.media_type?.includes('sticker') && (
                        <a
                          href={message.media_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 bg-black/10 dark:bg-white/10 px-3 py-2 rounded hover:bg-black/20 dark:hover:bg-white/20 transition-colors"
                        >
                          <FileText className="h-4 w-4" />
                          <span className="text-sm">Abrir documento</span>
                        </a>
                      )}
                  </>
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

            <p className="whitespace-pre-wrap break-words text-sm">{linkifyText(message.content)}</p>
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
          <Avatar
            className={cn(
              'h-8 w-8 flex-shrink-0',
              isFromAI ? 'ring-2 ring-emerald-500' : 'ring-2 ring-indigo-500'
            )}
          >
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
