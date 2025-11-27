-- ============================================
-- FIX: Function Search Path Mutable
-- ============================================
-- Add search_path to SECURITY DEFINER functions to prevent
-- search_path hijacking attacks

-- Fix check_permission function
ALTER FUNCTION public.check_permission(uuid, uuid, text) 
SET search_path = 'public';

-- Fix get_user_permissions function  
ALTER FUNCTION public.get_user_permissions(uuid, uuid)
SET search_path = 'public';