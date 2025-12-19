/**
 * Media Storage Service
 * Handles file uploads to Supabase Storage for message media
 */

import { supabase } from '@/integrations/supabase/client';

export interface UploadMediaOptions {
  file: File;
  companyId: string;
  conversationId?: string;
  onProgress?: (progress: number) => void;
}

export interface UploadMediaResult {
  url: string;
  path: string;
  size: number;
  mimeType: string;
}

/**
 * Upload media file to Supabase Storage
 */
export async function uploadMedia(options: UploadMediaOptions): Promise<UploadMediaResult> {
  const { file, companyId, conversationId, onProgress } = options;

  // Validar tamanho do arquivo (máximo 50MB)
  const MAX_SIZE = 50 * 1024 * 1024; // 50MB
  if (file.size > MAX_SIZE) {
    throw new Error(`Arquivo muito grande. Máximo permitido: 50MB. Tamanho do arquivo: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
  }

  // Validar tipo de arquivo
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'audio/mpeg',
    'audio/mp3',
    'audio/ogg',
    'audio/wav',
    'audio/webm',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ];

  if (!allowedTypes.includes(file.type)) {
    throw new Error(`Tipo de arquivo não suportado: ${file.type}`);
  }

  // Gerar nome único para o arquivo
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 8);
  const fileExtension = file.name.split('.').pop();
  const sanitizedFileName = file.name
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .substring(0, 50);

  // Estrutura de pastas: company_id/conversation_id/timestamp_random_filename.ext
  const filePath = conversationId
    ? `${companyId}/${conversationId}/${timestamp}_${randomStr}_${sanitizedFileName}`
    : `${companyId}/${timestamp}_${randomStr}_${sanitizedFileName}`;

  // Upload para Supabase Storage
  const { data, error } = await supabase.storage
    .from('message-media')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type,
    });

  if (error) {
    console.error('Erro ao fazer upload:', error);
    throw new Error(`Falha ao fazer upload: ${error.message}`);
  }

  if (!data?.path) {
    throw new Error('Caminho do arquivo não retornado pelo storage');
  }

  // Obter URL pública
  const { data: urlData } = supabase.storage
    .from('message-media')
    .getPublicUrl(data.path);

  if (!urlData?.publicUrl) {
    throw new Error('URL pública não gerada');
  }

  return {
    url: urlData.publicUrl,
    path: data.path,
    size: file.size,
    mimeType: file.type,
  };
}

/**
 * Download remote media URL and re-upload to Supabase Storage
 * Used by webhook to store media from Evolution API
 */
export async function downloadAndUploadMedia(
  remoteUrl: string,
  companyId: string,
  conversationId: string,
  fileName: string
): Promise<UploadMediaResult> {
  try {
    // Download do arquivo remoto
    const response = await fetch(remoteUrl);
    if (!response.ok) {
      throw new Error(`Falha ao baixar mídia: ${response.status} ${response.statusText}`);
    }

    const blob = await response.blob();
    const mimeType = response.headers.get('content-type') || 'application/octet-stream';

    // Criar File object
    const file = new File([blob], fileName, { type: mimeType });

    // Upload para nosso storage
    return await uploadMedia({
      file,
      companyId,
      conversationId,
    });
  } catch (error) {
    console.error('Erro ao baixar e fazer upload de mídia:', error);
    throw error;
  }
}

/**
 * Delete media file from storage
 */
export async function deleteMedia(path: string): Promise<void> {
  const { error } = await supabase.storage.from('message-media').remove([path]);

  if (error) {
    console.error('Erro ao deletar mídia:', error);
    throw new Error(`Falha ao deletar mídia: ${error.message}`);
  }
}

/**
 * Get file category from MIME type
 */
export function getMediaCategory(mimeType: string): 'image' | 'video' | 'audio' | 'document' {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  return 'document';
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}
