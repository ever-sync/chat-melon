import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/CompanyContext";
import { toast } from "sonner";

export type DealFile = {
  id: string;
  deal_id: string;
  company_id: string;
  uploaded_by: string | null;
  file_name: string;
  file_url: string;
  file_type: string | null;
  file_size: number | null;
  mime_type: string | null;
  storage_path: string | null;
  description: string | null;
  is_public: boolean;
  created_at: string;
  uploader_profile?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
};

export type UploadDealFileInput = {
  file: File;
  description?: string;
  is_public?: boolean;
};

export const useDealFiles = (dealId?: string) => {
  const { currentCompany } = useCompany();
  const queryClient = useQueryClient();

  // Query para buscar arquivos
  const { data: files = [], isLoading } = useQuery({
    queryKey: ["deal-files", dealId],
    queryFn: async () => {
      if (!dealId) return [];

      const { data, error } = await supabase
        .from("deal_files")
        .select(`
          *,
          uploader_profile:profiles!deal_files_uploaded_by_fkey (
            id,
            full_name,
            avatar_url
          )
        `)
        .eq("deal_id", dealId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as DealFile[];
    },
    enabled: !!dealId,
    staleTime: 60 * 1000, // 1 minuto
  });

  // Agrupar por tipo
  const imageFiles = files.filter(f => f.mime_type?.startsWith("image/"));
  const documentFiles = files.filter(f =>
    f.mime_type?.includes("pdf") ||
    f.mime_type?.includes("document") ||
    f.mime_type?.includes("spreadsheet") ||
    f.mime_type?.includes("presentation")
  );
  const otherFiles = files.filter(f =>
    !f.mime_type?.startsWith("image/") &&
    !documentFiles.includes(f)
  );

  // Mutation para fazer upload de arquivo
  const uploadFile = useMutation({
    mutationFn: async (input: UploadDealFileInput) => {
      if (!dealId || !currentCompany?.id) {
        throw new Error("Deal ID ou Company ID não disponível");
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Gerar nome único para o arquivo
      const fileExt = input.file.name.split(".").pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const storagePath = `${currentCompany.id}/deals/${dealId}/${fileName}`;

      // Upload para Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("deal-files")
        .upload(storagePath, input.file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Obter URL pública
      const { data: urlData } = supabase.storage
        .from("deal-files")
        .getPublicUrl(storagePath);

      // Inserir registro no banco
      const { data, error } = await supabase
        .from("deal_files")
        .insert({
          deal_id: dealId,
          company_id: currentCompany.id,
          uploaded_by: user.id,
          file_name: input.file.name,
          file_url: urlData.publicUrl,
          file_type: fileExt,
          file_size: input.file.size,
          mime_type: input.file.type,
          storage_path: storagePath,
          description: input.description,
          is_public: input.is_public || false,
        })
        .select(`
          *,
          uploader_profile:profiles!deal_files_uploaded_by_fkey (
            id,
            full_name,
            avatar_url
          )
        `)
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deal-files", dealId] });
      queryClient.invalidateQueries({ queryKey: ["deal-activities", dealId] });
      toast.success("Arquivo enviado com sucesso!");
    },
    onError: (error: Error) => {
      toast.error("Erro ao enviar arquivo: " + error.message);
    },
  });

  // Mutation para atualizar descrição do arquivo
  const updateFileDescription = useMutation({
    mutationFn: async ({ fileId, description }: { fileId: string; description: string }) => {
      const { data, error } = await supabase
        .from("deal_files")
        .update({ description })
        .eq("id", fileId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deal-files", dealId] });
      toast.success("Descrição atualizada!");
    },
    onError: (error: Error) => {
      toast.error("Erro ao atualizar descrição: " + error.message);
    },
  });

  // Mutation para deletar arquivo
  const deleteFile = useMutation({
    mutationFn: async (fileId: string) => {
      // Buscar informações do arquivo
      const { data: file, error: fetchError } = await supabase
        .from("deal_files")
        .select("storage_path")
        .eq("id", fileId)
        .single();

      if (fetchError) throw fetchError;

      // Deletar do storage
      if (file.storage_path) {
        const { error: storageError } = await supabase.storage
          .from("deal-files")
          .remove([file.storage_path]);

        if (storageError) {
          console.error("Erro ao deletar do storage:", storageError);
          // Continua mesmo com erro no storage
        }
      }

      // Deletar registro do banco
      const { error } = await supabase
        .from("deal_files")
        .delete()
        .eq("id", fileId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deal-files", dealId] });
      toast.success("Arquivo excluído!");
    },
    onError: (error: Error) => {
      toast.error("Erro ao excluir arquivo: " + error.message);
    },
  });

  // Função para fazer download de arquivo
  const downloadFile = async (file: DealFile) => {
    try {
      const response = await fetch(file.file_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.file_name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Download iniciado!");
    } catch (error) {
      toast.error("Erro ao fazer download");
      console.error("Download error:", error);
    }
  };

  // Função para formatar tamanho de arquivo
  const formatFileSize = (bytes: number | null): string => {
    if (!bytes) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  // Função para obter ícone baseado no tipo
  const getFileIcon = (mimeType: string | null): string => {
    if (!mimeType) return "📄";
    if (mimeType.startsWith("image/")) return "🖼️";
    if (mimeType.includes("pdf")) return "📕";
    if (mimeType.includes("document")) return "📝";
    if (mimeType.includes("spreadsheet")) return "📊";
    if (mimeType.includes("presentation")) return "📊";
    if (mimeType.includes("video")) return "🎥";
    if (mimeType.includes("audio")) return "🎵";
    if (mimeType.includes("zip") || mimeType.includes("rar")) return "📦";
    return "📄";
  };

  return {
    files,
    imageFiles,
    documentFiles,
    otherFiles,
    isLoading,
    uploadFile,
    updateFileDescription,
    deleteFile,
    downloadFile,
    formatFileSize,
    getFileIcon,
  };
};
