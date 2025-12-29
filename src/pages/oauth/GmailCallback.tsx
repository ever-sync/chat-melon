import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export default function GmailCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const error = params.get('error');

    if (error) {
      toast.error(`Erro na autenticação: ${error}`);
      // Enviar mensagem para a janela principal
      if (window.opener) {
        window.opener.postMessage(
          {
            type: 'gmail-oauth-error',
            error: error,
          },
          window.location.origin
        );
        window.close();
      } else {
        navigate('/channels');
      }
      return;
    }

    if (code) {
      // Enviar código para a janela principal
      if (window.opener) {
        window.opener.postMessage(
          {
            type: 'gmail-oauth-success',
            code: code,
          },
          window.location.origin
        );
        // A janela será fechada pela janela principal
      } else {
        // Se não há opener, redirecionar para channels com o código
        toast.success('Autenticação concluída! Finalizando conexão...');
        setTimeout(() => navigate('/channels'), 2000);
      }
    }
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Conectando Gmail...</h2>
        <p className="text-gray-600">Aguarde enquanto finalizamos a conexão.</p>
      </div>
    </div>
  );
}
