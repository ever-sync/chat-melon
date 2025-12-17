import { useState, useRef } from "react";
import { useDealFiles } from "@/hooks/crm/useDealFiles";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Upload,
  Download,
  Trash2,
  FileText,
  Image as ImageIcon,
  File,
  Eye,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface DealFilesSectionProps {
  dealId: string;
}

export const DealFilesSection = ({ dealId }: DealFilesSectionProps) => {
  const {
    files,
    imageFiles,
    documentFiles,
    otherFiles,
    isLoading,
    uploadFile,
    deleteFile,
    downloadFile,
    formatFileSize,
    getFileIcon,
  } = useDealFiles(dealId);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [deleteFileId, setDeleteFileId] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("all");

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Verificar tamanho (máx 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert("Arquivo muito grande! Máximo de 10MB permitido.");
      return;
    }

    uploadFile.mutate({
      file,
      is_public: false,
    });

    // Limpar input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDeleteFile = () => {
    if (!deleteFileId) return;
    deleteFile.mutate(deleteFileId);
    setDeleteFileId(null);
  };

  const getInitials = (name: string | null) => {
    if (!name) return "??";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-4 gap-2">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Upload de arquivo */}
      <div className="border-2 border-dashed rounded-lg p-6 text-center">
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          className="hidden"
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
        />

        {uploadFile.isPending ? (
          <div className="space-y-2">
            <Upload className="w-8 h-8 mx-auto text-muted-foreground animate-bounce" />
            <p className="text-sm text-muted-foreground">Enviando arquivo...</p>
            <Progress value={50} className="w-full" />
          </div>
        ) : (
          <>
            <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm font-medium mb-1">
              Clique para fazer upload
            </p>
            <p className="text-xs text-muted-foreground mb-3">
              PDF, DOC, DOCX, XLS, XLSX, TXT, imagens (máx 10MB)
            </p>
            <Button onClick={() => fileInputRef.current?.click()}>
              Selecionar Arquivo
            </Button>
          </>
        )}
      </div>

      {/* Tabs de tipos de arquivo */}
      {files.length > 0 && (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">
              Todos ({files.length})
            </TabsTrigger>
            <TabsTrigger value="images">
              <ImageIcon className="w-4 h-4 mr-1" />
              Imagens ({imageFiles.length})
            </TabsTrigger>
            <TabsTrigger value="documents">
              <FileText className="w-4 h-4 mr-1" />
              Docs ({documentFiles.length})
            </TabsTrigger>
            <TabsTrigger value="others">
              <File className="w-4 h-4 mr-1" />
              Outros ({otherFiles.length})
            </TabsTrigger>
          </TabsList>

          {/* Todos os arquivos */}
          <TabsContent value="all" className="space-y-2 mt-4">
            {files.map((file) => (
              <FileItem
                key={file.id}
                file={file}
                onDelete={() => setDeleteFileId(file.id)}
                onDownload={() => downloadFile(file)}
                onPreview={
                  file.mime_type?.startsWith("image/")
                    ? () => setPreviewImage(file.file_url)
                    : undefined
                }
                formatFileSize={formatFileSize}
                getFileIcon={getFileIcon}
                getInitials={getInitials}
              />
            ))}
          </TabsContent>

          {/* Imagens */}
          <TabsContent value="images" className="mt-4">
            {imageFiles.length === 0 ? (
              <EmptyState
                icon={ImageIcon}
                message="Nenhuma imagem enviada"
              />
            ) : (
              <div className="grid grid-cols-4 gap-2">
                {imageFiles.map((file) => (
                  <div
                    key={file.id}
                    className="relative group aspect-square rounded-lg overflow-hidden border cursor-pointer"
                    onClick={() => setPreviewImage(file.file_url)}
                  >
                    <img
                      src={file.file_url}
                      alt={file.file_name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={(e) => {
                          e.stopPropagation();
                          downloadFile(file);
                        }}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteFileId(file.id);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Documentos */}
          <TabsContent value="documents" className="space-y-2 mt-4">
            {documentFiles.length === 0 ? (
              <EmptyState
                icon={FileText}
                message="Nenhum documento enviado"
              />
            ) : (
              documentFiles.map((file) => (
                <FileItem
                  key={file.id}
                  file={file}
                  onDelete={() => setDeleteFileId(file.id)}
                  onDownload={() => downloadFile(file)}
                  formatFileSize={formatFileSize}
                  getFileIcon={getFileIcon}
                  getInitials={getInitials}
                />
              ))
            )}
          </TabsContent>

          {/* Outros */}
          <TabsContent value="others" className="space-y-2 mt-4">
            {otherFiles.length === 0 ? (
              <EmptyState icon={File} message="Nenhum outro arquivo" />
            ) : (
              otherFiles.map((file) => (
                <FileItem
                  key={file.id}
                  file={file}
                  onDelete={() => setDeleteFileId(file.id)}
                  onDownload={() => downloadFile(file)}
                  formatFileSize={formatFileSize}
                  getFileIcon={getFileIcon}
                  getInitials={getInitials}
                />
              ))
            )}
          </TabsContent>
        </Tabs>
      )}

      {files.length === 0 && !uploadFile.isPending && (
        <div className="text-center py-8 text-muted-foreground">
          <File className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Nenhum arquivo enviado ainda</p>
        </div>
      )}

      {/* Dialog de preview de imagem */}
      <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Visualizar Imagem</DialogTitle>
          </DialogHeader>
          <div className="w-full h-[600px] flex items-center justify-center bg-muted rounded-lg">
            {previewImage && (
              <img
                src={previewImage}
                alt="Preview"
                className="max-w-full max-h-full object-contain"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmação de exclusão */}
      <AlertDialog
        open={!!deleteFileId}
        onOpenChange={() => setDeleteFileId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir arquivo?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O arquivo será permanentemente
              excluído.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteFile}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

// Componente de item de arquivo
interface FileItemProps {
  file: any;
  onDelete: () => void;
  onDownload: () => void;
  onPreview?: () => void;
  formatFileSize: (size: number | null) => string;
  getFileIcon: (mimeType: string | null) => string;
  getInitials: (name: string | null) => string;
}

const FileItem = ({
  file,
  onDelete,
  onDownload,
  onPreview,
  formatFileSize,
  getFileIcon,
  getInitials,
}: FileItemProps) => {
  return (
    <div className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
      <div className="text-3xl">{getFileIcon(file.mime_type)}</div>

      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{file.file_name}</p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
          <span>{formatFileSize(file.file_size)}</span>
          <span>•</span>
          {file.uploader_profile && (
            <>
              <Avatar className="h-4 w-4">
                <AvatarImage
                  src={file.uploader_profile.avatar_url || undefined}
                />
                <AvatarFallback className="text-xs">
                  {getInitials(file.uploader_profile.full_name)}
                </AvatarFallback>
              </Avatar>
              <span>{file.uploader_profile.full_name}</span>
              <span>•</span>
            </>
          )}
          <span>
            {format(new Date(file.created_at), "dd/MM/yyyy", {
              locale: ptBR,
            })}
          </span>
        </div>
      </div>

      <div className="flex gap-1">
        {onPreview && (
          <Button size="sm" variant="ghost" onClick={onPreview}>
            <Eye className="w-4 h-4" />
          </Button>
        )}
        <Button size="sm" variant="ghost" onClick={onDownload}>
          <Download className="w-4 h-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="text-destructive hover:text-destructive"
          onClick={onDelete}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

// Componente de estado vazio
interface EmptyStateProps {
  icon: React.ComponentType<{ className?: string }>;
  message: string;
}

const EmptyState = ({ icon: Icon, message }: EmptyStateProps) => {
  return (
    <div className="text-center py-8 text-muted-foreground">
      <Icon className="w-12 h-12 mx-auto mb-2 opacity-50" />
      <p className="text-sm">{message}</p>
    </div>
  );
};
