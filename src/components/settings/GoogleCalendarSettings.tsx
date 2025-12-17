import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, CheckCircle2, XCircle } from 'lucide-react';
import { useGoogleCalendar } from '@/hooks/useGoogleCalendar';
import { Badge } from '@/components/ui/badge';

export const GoogleCalendarSettings = () => {
  const { connectionStatus, isCheckingConnection, connectCalendar, disconnectCalendar } =
    useGoogleCalendar();

  const redirectUri = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/google-calendar-oauth`;
  const appUrl = window.location.origin;

  if (isCheckingConnection) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Google Calendar
          </CardTitle>
          <CardDescription>Verificando conexão...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Google Calendar
        </CardTitle>
        <CardDescription>Sincronize suas tarefas e reuniões com o Google Calendar</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {connectionStatus?.connected ? (
          <>
            <div className="flex items-center gap-2 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-900">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
              <div className="flex-1">
                <p className="text-sm font-medium text-green-900 dark:text-green-100">
                  Conectado com sucesso
                </p>
                <p className="text-xs text-green-700 dark:text-green-300">
                  {connectionStatus.email}
                </p>
              </div>
              <Badge
                variant="outline"
                className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700"
              >
                Ativo
              </Badge>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-medium">Recursos Ativos:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>✓ Tarefas de reunião sincronizadas automaticamente</li>
                <li>✓ Widget de agenda no Dashboard</li>
                <li>✓ Verificação de disponibilidade ao criar tarefas</li>
                <li>✓ Link automático do Google Meet</li>
              </ul>
            </div>

            <Button
              variant="destructive"
              onClick={() => disconnectCalendar.mutate()}
              disabled={disconnectCalendar.isPending}
            >
              <XCircle className="h-4 w-4 mr-2" />
              {disconnectCalendar.isPending ? 'Desconectando...' : 'Desconectar'}
            </Button>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2 p-4 bg-muted rounded-lg">
              <XCircle className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm font-medium">Não conectado</p>
                <p className="text-xs text-muted-foreground">
                  Conecte para sincronizar suas tarefas
                </p>
              </div>
            </div>

            <div className="space-y-3 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-lg">
              <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-100">
                ⚙️ Configuração no Google Cloud Console
              </h4>
              <p className="text-xs text-amber-800 dark:text-amber-200">
                Para conectar, você precisa configurar os URIs no Google Cloud Console:
              </p>
              <div className="space-y-2 text-xs">
                <div>
                  <p className="font-medium text-amber-900 dark:text-amber-100">
                    1. Authorized JavaScript origins:
                  </p>
                  <code className="block mt-1 p-2 bg-amber-100 dark:bg-amber-900/30 rounded text-amber-900 dark:text-amber-100 break-all">
                    {appUrl}
                  </code>
                </div>
                <div>
                  <p className="font-medium text-amber-900 dark:text-amber-100">
                    2. Authorized redirect URIs:
                  </p>
                  <code className="block mt-1 p-2 bg-amber-100 dark:bg-amber-900/30 rounded text-amber-900 dark:text-amber-100 break-all">
                    {redirectUri}
                  </code>
                </div>
              </div>
              <a
                href="https://console.cloud.google.com/apis/credentials"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-xs text-amber-700 dark:text-amber-300 hover:underline"
              >
                Abrir Google Cloud Console →
              </a>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-medium">Ao conectar, você poderá:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Sincronizar tarefas de reunião com o Calendar</li>
                <li>• Ver sua agenda do dia no Dashboard</li>
                <li>• Verificar disponibilidade ao agendar</li>
                <li>• Gerar links do Google Meet automaticamente</li>
              </ul>
            </div>

            {connectCalendar.isError && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="text-xs text-destructive">
                  Erro ao conectar. Verifique se os URIs estão configurados corretamente no Google
                  Cloud Console.
                </p>
              </div>
            )}

            <Button
              onClick={() => connectCalendar.mutate()}
              disabled={connectCalendar.isPending}
              className="w-full"
            >
              <Calendar className="h-4 w-4 mr-2" />
              {connectCalendar.isPending ? 'Conectando...' : 'Conectar Google Calendar'}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
};
