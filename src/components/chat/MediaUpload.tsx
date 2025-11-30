import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Paperclip, X, Image, FileText, Film, Music } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useSendMediaMessage } from "@/hooks/useEvolutionApi";
import { useCompany } from "@/contexts/CompanyContext";

interface MediaUploadProps {
  conversationId: string;
  contactNumber: string;
  onMediaSent: () => void;
}

export function MediaUpload({ conversationId, contactNumber, onMediaSent }: MediaUploadProps) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const { currentCompany } = useCompany();
  const sendMediaMessageHook = useSendMediaMessage(currentCompany?.evolution_instance_name || '');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.size > 16 * 1024 * 1024) {
        toast.error("O arquivo deve ter no máximo 16MB");
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
    if (!file) return;

    if (!currentCompany?.evolution_instance_name) {
      toast.error("Evolution API não configurada");
      return;
    }

    setUploading(true);
    try {
      // Convert file to Base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
          const base64String = (reader.result as string).split(',')[1];
          resolve(base64String);
        };
        reader.onerror = reject;
      });

      // Determine media type category
      let mediaType: 'image' | 'video' | 'audio' | 'document' = 'document';
      if (file.type.startsWith('image/')) mediaType = 'image';
      else if (file.type.startsWith('video/')) mediaType = 'video';
      else if (file.type.startsWith('audio/')) mediaType = 'audio';

      // Send media via Evolution API
      await sendMediaMessageHook.mutateAsync({
        number: contactNumber,
        mediatype: mediaType,
        media: base64,
        fileName: file.name,
        caption: caption.trim() || undefined,
      });

      toast.success("Mídia enviada com sucesso");

      setOpen(false);
      setFile(null);
      setCaption("");
      setPreview(null);
      onMediaSent();

    } catch (error: any) {
      console.error('Erro ao enviar mídia:', error);
      toast.error(error.message || "Erro ao enviar mídia");
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
            </div>
          )}

          <Button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="w-full"
          >
            {uploading ? "Enviando..." : "Enviar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}