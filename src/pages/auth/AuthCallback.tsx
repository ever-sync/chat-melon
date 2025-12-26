import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Confirmando seu email...');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const token_hash = searchParams.get('token_hash');
        const type = searchParams.get('type');
        const error = searchParams.get('error');
        const error_description = searchParams.get('error_description');

        console.log('AuthCallback - Params:', { token_hash, type, error, error_description });

        // Se houver erro nos params da URL
        if (error) {
          console.error('Erro nos parâmetros:', error, error_description);
          setStatus('error');
          setMessage(error_description || 'Erro ao confirmar email');
          toast.error('Erro: ' + (error_description || error));
          setTimeout(() => navigate('/login'), 3000);
          return;
        }

        // Se for confirmação de signup
        if (type === 'signup' && token_hash) {
          console.log('Verificando email com token_hash...');

          const { error: verifyError } = await supabase.auth.verifyOtp({
            token_hash,
            type: 'email',
          });

          if (verifyError) {
            console.error('Erro ao verificar email:', verifyError);
            setStatus('error');
            setMessage('Erro ao confirmar email: ' + verifyError.message);
            toast.error('Erro ao confirmar email');
            setTimeout(() => navigate('/login'), 3000);
            return;
          }

          console.log('Email confirmado com sucesso!');
          setStatus('success');
          setMessage('Email confirmado com sucesso! Redirecionando...');
          toast.success('Email confirmado! Bem-vindo!');

          // Redirecionar para o chat após 2 segundos
          setTimeout(() => navigate('/'), 2000);
          return;
        }

        // Se for recuperação de senha
        if (type === 'recovery' && token_hash) {
          console.log('Processo de recuperação de senha...');

          const { error: verifyError } = await supabase.auth.verifyOtp({
            token_hash,
            type: 'recovery',
          });

          if (verifyError) {
            console.error('Erro ao verificar token de recuperação:', verifyError);
            setStatus('error');
            setMessage('Erro ao verificar token: ' + verifyError.message);
            toast.error('Erro ao verificar token');
            setTimeout(() => navigate('/login'), 3000);
            return;
          }

          setStatus('success');
          setMessage('Token verificado! Redirecionando para redefinir senha...');
          toast.success('Token verificado!');
          setTimeout(() => navigate('/reset-password'), 2000);
          return;
        }

        // Verificar se já está autenticado (ex: magic link)
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('Erro ao obter sessão:', sessionError);
          setStatus('error');
          setMessage('Erro ao obter sessão');
          setTimeout(() => navigate('/login'), 3000);
          return;
        }

        if (session) {
          console.log('Usuário já autenticado, redirecionando...');
          setStatus('success');
          setMessage('Autenticação confirmada! Redirecionando...');
          toast.success('Bem-vindo!');
          setTimeout(() => navigate('/'), 2000);
          return;
        }

        // Se chegou aqui sem token_hash ou type, algo está errado
        console.warn('Callback sem token_hash ou type válido');
        setStatus('error');
        setMessage('Link de confirmação inválido ou expirado');
        setTimeout(() => navigate('/login'), 3000);

      } catch (err: any) {
        console.error('Erro no callback de autenticação:', err);
        setStatus('error');
        setMessage('Erro inesperado: ' + err.message);
        toast.error('Erro ao processar confirmação');
        setTimeout(() => navigate('/login'), 3000);
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">
            {status === 'loading' && 'Processando...'}
            {status === 'success' && 'Sucesso!'}
            {status === 'error' && 'Erro'}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          {status === 'loading' && (
            <Loader2 className="h-12 w-12 text-purple-600 animate-spin" />
          )}
          {status === 'success' && (
            <CheckCircle className="h-12 w-12 text-green-600" />
          )}
          {status === 'error' && (
            <XCircle className="h-12 w-12 text-red-600" />
          )}

          <p className="text-center text-muted-foreground">
            {message}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
