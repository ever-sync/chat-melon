-- Fix audio MIME types for WhatsApp audio messages
-- WhatsApp sends audio with various formats that need to be supported

UPDATE storage.buckets
SET allowed_mime_types = ARRAY[
  -- Images
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  -- Videos
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/3gpp',
  'video/mpeg',
  -- Audio (expanded list for WhatsApp compatibility)
  'audio/ogg',
  'audio/opus',
  'audio/mpeg',
  'audio/mp3',
  'audio/mp4',
  'audio/aac',
  'audio/wav',
  'audio/webm',
  'audio/amr',
  'audio/3gpp',
  'audio/x-m4a',
  -- Documents
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'application/zip',
  'application/octet-stream'
]
WHERE id = 'message-media';
