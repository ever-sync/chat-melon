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
        // Obter parâmetros tanto de query string quanto de hash fragment
        const hashParams = new URLSearchParams(window.location.hash.substring(1));

        const token_hash = searchParams.get('token_hash') || hashParams.get('token_hash');
        const type = searchParams.get('type') || hashParams.get('type');
        const error = searchParams.get('error') || hashParams.get('error');
        const error_description = searchParams.get('error_description') || hashParams.get('error_description');
        const access_token = searchParams.get('access_token') || hashParams.get('access_token');
        const refresh_token = searchParams.get('refresh_token') || hashParams.get('refresh_token');

        console.log('AuthCallback - Query Params:', Object.fromEntries(searchParams.entries()));
        console.log('AuthCallback - Hash Params:', Object.fromEntries(hashParams.entries()));
        console.log('AuthCallback - Combined:', { token_hash, type, error, error_description, access_token, refresh_token });

        // Se houver erro nos params da URL
        if (error) {
          console.error('Erro nos parâmetros:', error, error_description);
          setStatus('error');
          setMessage(error_description || 'Erro ao confirmar email');
          toast.error('Erro: ' + (error_description || error));
          setTimeout(() => navigate('/login'), 3000);
          return;
        }

        // Se já tiver access_token e refresh_token (confirmação automática do Supabase)
        if (access_token && refresh_token) {
          console.log('Tokens presentes, estabelecendo sessão...');

          const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
            access_token,
            refresh_token,
          });

          if (sessionError) {
            console.error('Erro ao estabelecer sessão:', sessionError);
            setStatus('error');
            setMessage('Erro ao estabelecer sessão');
            toast.error('Erro ao confirmar email');
            setTimeout(() => navigate('/login'), 3000);
            return;
          }

          console.log('Sessão estabelecida com sucesso!', sessionData);
          setStatus('success');
          setMessage('Email confirmado com sucesso! Redirecionando...');
          toast.success('Email confirmado! Bem-vindo!');
          setTimeout(() => navigate('/dashboard'), 2000);
          return;
        }

        // Se for confirmação de signup ou email
        if ((type === 'signup' || type === 'email') && token_hash) {
          console.log('Verificando email com token_hash...');

          // Usar o método correto do Supabase para verificar o token_hash
          const { data, error: verifyError } = await supabase.auth.verifyOtp({
            token_hash,
            type: 'signup',
          });

          if (verifyError) {
            console.error('Erro ao verificar email:', verifyError);
            setStatus('error');
            setMessage('Erro ao confirmar email: ' + verifyError.message);
            toast.error('Erro ao confirmar email');
            setTimeout(() => navigate('/login'), 3000);
            return;
          }

          console.log('Email confirmado com sucesso!', data);
          setStatus('success');
          setMessage('Email confirmado com sucesso! Redirecionando...');
          toast.success('Email confirmado! Bem-vindo!');

          // Redirecionar para o dashboard após 2 segundos
          setTimeout(() => navigate('/dashboard'), 2000);
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

    // Timeout de segurança - se ficar mais de 10 segundos carregando, mostrar erro
    const timeout = setTimeout(() => {
      if (status === 'loading') {
        console.warn('Timeout ao processar confirmação');
        setStatus('error');
        setMessage('O processamento está demorando muito. Por favor, tente fazer login manualmente.');
        toast.error('Timeout ao processar confirmação');
        setTimeout(() => navigate('/login'), 3000);
      }
    }, 10000);

    handleCallback();

    return () => clearTimeout(timeout);
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
