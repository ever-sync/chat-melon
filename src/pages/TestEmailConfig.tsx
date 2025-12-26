import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export default function TestEmailConfig() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testConfig = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('test-email-config', {
        body: {},
      });

      if (error) {
        console.error('Erro ao testar configuração:', error);
        toast.error('Erro: ' + error.message);
        setResult({ error: error.message });
      } else {
        console.log('Resultado do teste:', data);
        setResult(data);

        // Verificar se o RESEND_API_KEY está configurado
        if (!data.config?.RESEND_API_KEY?.configured) {
          toast.error('RESEND_API_KEY NÃO ESTÁ CONFIGURADO!');
        } else {
          toast.success('Configuração OK!');
        }
      }
    } catch (err: any) {
      console.error('Erro:', err);
      toast.error('Erro: ' + err.message);
      setResult({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Teste de Configuração de Email</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Este teste verifica se as variáveis de ambiente estão configuradas corretamente no Supabase.
          </p>

          <Button onClick={testConfig} disabled={loading}>
            {loading ? 'Testando...' : 'Testar Configuração'}
          </Button>

          {result && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <h3 className="font-semibold mb-2">Resultado:</h3>
              <pre className="text-xs overflow-auto">
                {JSON.stringify(result, null, 2)}
              </pre>

              {result.config && (
                <div className="mt-4 space-y-2">
                  <h4 className="font-semibold">Status das Variáveis:</h4>
                  <div className="space-y-1 text-sm">
                    <div>
                      RESEND_API_KEY: {' '}
                      {result.config.RESEND_API_KEY?.configured ? (
                        <span className="text-green-600 font-semibold">✓ CONFIGURADO</span>
                      ) : (
                        <span className="text-red-600 font-semibold">✗ NÃO CONFIGURADO</span>
                      )}
                      {result.config.RESEND_API_KEY?.configured && (
                        <span className="ml-2 text-muted-foreground">
                          (começa com: {result.config.RESEND_API_KEY.starts_with})
                        </span>
                      )}
                    </div>
                    <div>
                      APP_URL: <span className="font-mono">{result.config.APP_URL}</span>
                    </div>
                    <div>
                      SUPABASE_URL: {' '}
                      {result.config.SUPABASE_URL === 'CONFIGURADO' ? (
                        <span className="text-green-600">✓</span>
                      ) : (
                        <span className="text-red-600">✗</span>
                      )}
                    </div>
                    <div>
                      SUPABASE_SERVICE_ROLE_KEY: {' '}
                      {result.config.SUPABASE_SERVICE_ROLE_KEY === 'CONFIGURADO' ? (
                        <span className="text-green-600">✓</span>
                      ) : (
                        <span className="text-red-600">✗</span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg text-sm">
            <h4 className="font-semibold mb-2">Como configurar as variáveis:</h4>
            <ol className="list-decimal list-inside space-y-1">
              <li>Acesse o Supabase Dashboard</li>
              <li>Vá em Settings → Edge Functions → Environment Variables</li>
              <li>Adicione as variáveis:
                <ul className="list-disc list-inside ml-4 mt-1">
                  <li><code>RESEND_API_KEY</code> - Sua chave do Resend</li>
                  <li><code>APP_URL</code> - URL do seu app (ex: http://192.168.15.2:8081)</li>
                </ul>
              </li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
