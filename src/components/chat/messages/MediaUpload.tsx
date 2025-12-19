import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Paperclip, X, Image, FileText, Film, Music, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useCompany } from '@/contexts/CompanyContext';
import { uploadMedia, formatFileSize, getMediaCategory } from '@/services/mediaStorage';
import { Progress } from '@/components/ui/progress';

interface MediaUploadProps {
  conversationId: string;
  contactNumber: string;
  onMediaSent: () => void;
}

export function MediaUpload({ conversationId, contactNumber, onMediaSent }: MediaUploadProps) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [preview, setPreview] = useState<string | null>(null);

  const { currentCompany } = useCompany();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.size > 16 * 1024 * 1024) {
        toast.error('O arquivo deve ter no máximo 16MB');
        return;
      }

      setFile(selectedFile);

      // Create preview for images
      if (selectedFile.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreview(reader.result as string);
        };
        reader.readAsDataURL(selectedFile);
      } else {
        setPreview(null);
      }
    }
  };

  const handleUpload = async () => {
    if (!file || !currentCompany?.id) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      // 1. Upload para Supabase Storage
      toast.info('Fazendo upload do arquivo...');
      const uploadResult = await uploadMedia({
        file,
        companyId: currentCompany.id,
        conversationId,
        onProgress: (progress) => {
          setUploadProgress(progress);
        },
      });

      console.log('✅ Upload concluído:', uploadResult);
      setUploadProgress(50);

      // 2. Enviar mensagem via Evolution API com URL do storage
      toast.info('Enviando mensagem...');

      const mediaCategory = getMediaCategory(file.type);

      // Salvar mensagem no banco
      const { data: messageData, error: messageError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          company_id: currentCompany.id,
          user_id: (await supabase.auth.getUser()).data.user?.id,
          content: caption || file.name,
          is_from_me: true,
          message_type: 'text',
          media_type: file.type,
          media_url: uploadResult.url,
          status: 'pending',
        })
        .select()
        .single();

      if (messageError) {
        throw new Error('Erro ao salvar mensagem no banco');
      }

      setUploadProgress(75);

      // 3. Enviar via Evolution API
      const { data: result, error } = await supabase.functions.invoke('send-message', {
        body: {
          conversationId,
          messageType: 'media',
          mediaType: mediaCategory,
          media: uploadResult.url, // Enviar URL pública
          content: file.name,
          caption: caption.trim() || undefined,
        },
      });

      if (error || !result?.success) {
        // Atualizar status da mensagem para erro
        await supabase
          .from('messages')
          .update({ status: 'error' })
          .eq('id', messageData.id);

        throw new Error(result?.error || error?.message || 'Erro ao enviar mídia');
      }

      // Atualizar status da mensagem para enviado
      await supabase
        .from('messages')
        .update({ status: 'sent' })
        .eq('id', messageData.id);

      setUploadProgress(100);
      toast.success('Mídia enviada com sucesso!');

      // Reset
      setOpen(false);
      setFile(null);
      setCaption('');
      setPreview(null);
      setUploadProgress(0);
      onMediaSent();
    } catch (error: any) {
      console.error('Erro ao enviar mídia:', error);
      toast.error(error.message || 'Erro ao enviar mídia');
    } finally {
      setUploading(false);
    }
  };

  const getFileIcon = () => {
    if (!file) return <Paperclip className="h-4 w-4" />;

    if (file.type.startsWith('image/')) return <Image className="h-4 w-4" />;
    if (file.type.startsWith('video/')) return <Film className="h-4 w-4" />;
    if (file.type.startsWith('audio/')) return <Music className="h-4 w-4" />;
    return <FileText className="h-4 w-4" />;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" type="button">
          <Paperclip className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enviar Arquivo</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="file">Arquivo</Label>
            <Input
              id="file"
              type="file"
              onChange={handleFileChange}
              accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Máximo 16MB. Imagens, vídeos, áudios e documentos.
            </p>
          </div>

          {file && (
            <div className="p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                {getFileIcon()}
                <span className="text-sm flex-1 truncate">{file.name}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setFile(null);
                    setPreview(null);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {preview && (
                <img
                  src={preview}
                  alt="Preview"
                  className="mt-2 rounded max-h-48 w-full object-contain"
                />
              )}
            </div>
          )}

          {file && (
            <div>
              <Label htmlFor="caption">Legenda (opcional)</Label>
              <Textarea
                id="caption"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Adicione uma legenda..."
                rows={3}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Tamanho: {formatFileSize(file.size)}
              </p>
            </div>
          )}

          {uploading && uploadProgress > 0 && (
            <div className="space-y-2">
              <Progress value={uploadProgress} className="w-full" />
              <p className="text-xs text-center text-muted-foreground">
                {uploadProgress < 50 && 'Fazendo upload...'}
                {uploadProgress >= 50 && uploadProgress < 75 && 'Salvando mensagem...'}
                {uploadProgress >= 75 && uploadProgress < 100 && 'Enviando...'}
                {uploadProgress === 100 && 'Concluído!'}
              </p>
            </div>
          )}

          <Button onClick={handleUpload} disabled={!file || uploading} className="w-full">
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              'Enviar'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
