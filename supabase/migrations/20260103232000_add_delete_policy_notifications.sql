-- Política para permitir que usuários deletem suas próprias notificações
DROP POLICY IF EXISTS "Users can delete their own notifications" ON notifications;
CREATE POLICY "Users can delete their own notifications"
  ON notifications FOR DELETE
  USING (user_id = auth.uid() AND company_id = (
    SELECT company_id 
    FROM company_users 
    WHERE user_id = auth.uid() 
    AND company_id = notifications.company_id
    LIMIT 1
  ));
