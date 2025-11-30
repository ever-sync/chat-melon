/**
 * Evolution API Configuration Component
 * Allows companies to configure their Evolution API connection
 */

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/contexts/CompanyContext';
import {
  useInstances,
  useCreateInstance,
  useConnectInstance,
  useLogoutInstance,
  useDeleteInstance,
  useSyncContactPhotos,
} from '@/hooks/useEvolutionApi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Wifi,
  WifiOff,
  RefreshCw,
  Trash2,
  LogOut,
  Plus,
  Save,
  ExternalLink,
  ImageIcon,
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export function EvolutionApiConfig() {
  const { currentCompany } = useCompany();
  const queryClient = useQueryClient();

  // Local state for configuration form
  const [formData, setFormData] = useState({
    apiUrl: currentCompany?.evolution_api_url || '',
    apiKey: currentCompany?.evolution_api_key || '',
    instanceName: currentCompany?.evolution_instance_name || '',
  });

  const [isEditing, setIsEditing] = useState(false);

  // Mutations
  const createInstanceMutation = useCreateInstance();
  const connectInstanceMutation = useConnectInstance();
  const logoutInstanceMutation = useLogoutInstance();
  const deleteInstanceMutation = useDeleteInstance();
  const syncPhotosMutation = useSyncContactPhotos(formData.instanceName);

  const saveConfigMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!currentCompany?.id) throw new Error('No company selected');

      const { error } = await supabase
        .from('companies')
        .update({
          evolution_api_url: data.apiUrl,
          evolution_api_key: data.apiKey,
          evolution_instance_name: data.instanceName,
        })
        .eq('id', currentCompany.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evolution-init'] });
      queryClient.invalidateQueries({ queryKey: ['current-company'] });
      toast.success('Configuração salva com sucesso!');
      setIsEditing(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao salvar configuração');
    },
  });

  // Fetch instances
  const { data: instances = [], isLoading: isLoadingInstances } = useInstances();

  const currentInstance = instances.find((i) => i.instanceName === formData.instanceName);

  const handleSaveConfig = () => {
    if (!formData.apiUrl || !formData.apiKey || !formData.instanceName) {
      toast.error('Preencha todos os campos');
      return;
    }

    saveConfigMutation.mutate(formData);
  };

  const handleCreateInstance = () => {
    if (!formData.instanceName) {
      toast.error('Digite o nome da instância');
      return;
    }

    createInstanceMutation.mutate({
      instanceName: formData.instanceName,
      qrcode: true,
    });
  };

  const handleSyncPhotos = () => {
    if (!formData.instanceName) {
      toast.error('Configure a instância primeiro');
      return;
    }

    syncPhotosMutation.mutate();
  };

  const handleDeleteInstance = async () => {
    if (!formData.instanceName || !currentCompany?.id) {
      toast.error('Nenhuma instância configurada');
      return;
    }

    try {
      // 1. Deletar instância na Evolution API
      await deleteInstanceMutation.mutateAsync(formData.instanceName);

      // 2. Limpar dados do banco de dados
      const { error } = await supabase
        .from('companies')
        .update({
          evolution_api_url: null,
          evolution_api_key: null,
          evolution_instance_name: null,
          evolution_connected: false,
          evolution_qr_code: null,
          evolution_last_sync: null,
        })
        .eq('id', currentCompany.id);

      if (error) throw error;

      // 3. Limpar cache
      queryClient.invalidateQueries({ queryKey: ['evolution-init'] });
      queryClient.invalidateQueries({ queryKey: ['evolution-instances'] });
      queryClient.invalidateQueries({ queryKey: ['current-company'] });
      queryClient.removeQueries({ queryKey: ['contact-profile-picture'] });

      // 4. Resetar formulário
      setFormData({
        apiUrl: '',
        apiKey: '',
        instanceName: '',
      });

      toast.success('Instância deletada e dados removidos do banco!');
    } catch (error: any) {
      console.error('Erro ao deletar instância:', error);
      toast.error(error.message || 'Erro ao deletar instância');
    }
  };

  return (
    <div className="space-y-6">
      {/* Configuration Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wifi className="h-5 w-5" />
            Configuração da Evolution API
          </CardTitle>
          <CardDescription>
            Configure a conexão com a Evolution API para integrar o WhatsApp
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="apiUrl">URL da API *</Label>
            <Input
              id="apiUrl"
              placeholder="https://api.evolutionapi.com"
              value={formData.apiUrl}
              onChange={(e) => setFormData({ ...formData, apiUrl: e.target.value })}
              disabled={!isEditing && !!currentCompany?.evolution_api_url}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="apiKey">API Key *</Label>
            <Input
              id="apiKey"
              type="password"
              placeholder="sua-chave-de-api"
              value={formData.apiKey}
              onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
              disabled={!isEditing && !!currentCompany?.evolution_api_key}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="instanceName">Nome da Instância *</Label>
            <Input
              id="instanceName"
              placeholder="minha-empresa"
              value={formData.instanceName}
              onChange={(e) => setFormData({ ...formData, instanceName: e.target.value })}
              disabled={!isEditing && !!currentCompany?.evolution_instance_name}
            />
            <p className="text-xs text-muted-foreground">
              Nome único para identificar sua instância WhatsApp
            </p>
          </div>

          <div className="flex gap-2">
            {!isEditing && currentCompany?.evolution_api_url ? (
              <Button onClick={() => setIsEditing(true)} variant="outline">
                Editar Configuração
              </Button>
            ) : (
              <>
                <Button
                  onClick={handleSaveConfig}
                  disabled={saveConfigMutation.isPending}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saveConfigMutation.isPending ? 'Salvando...' : 'Salvar Configuração'}
                </Button>
                {isEditing && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setFormData({
                        apiUrl: currentCompany?.evolution_api_url || '',
                        apiKey: currentCompany?.evolution_api_key || '',
                        instanceName: currentCompany?.evolution_instance_name || '',
                      });
                      setIsEditing(false);
                    }}
                  >
                    Cancelar
                  </Button>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Instance Management */}
      {currentCompany?.evolution_api_url && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {currentInstance?.status === 'open' ? (
                <Wifi className="h-5 w-5 text-green-500" />
              ) : (
                <WifiOff className="h-5 w-5 text-gray-400" />
              )}
              Instância WhatsApp
            </CardTitle>
            <CardDescription>
              Gerencie sua conexão WhatsApp através da Evolution API
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoadingInstances ? (
              <div className="text-center py-8 text-muted-foreground">
                Carregando instâncias...
              </div>
            ) : currentInstance ? (
              <>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">{currentInstance.instanceName}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge
                        variant={
                          currentInstance.status === 'open'
                            ? 'default'
                            : currentInstance.status === 'connecting'
                            ? 'secondary'
                            : 'outline'
                        }
                      >
                        {currentInstance.status === 'open'
                          ? 'Conectado'
                          : currentInstance.status === 'connecting'
                          ? 'Conectando...'
                          : 'Desconectado'}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {currentInstance.status !== 'open' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => connectInstanceMutation.mutate(formData.instanceName)}
                        disabled={connectInstanceMutation.isPending}
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Conectar
                      </Button>
                    )}

                    {currentInstance.status === 'open' && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <LogOut className="h-4 w-4 mr-2" />
                            Desconectar
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Desconectar instância?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Isso irá desconectar sua instância WhatsApp. Você precisará escanear o
                              QR Code novamente para reconectar.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => logoutInstanceMutation.mutate(formData.instanceName)}
                            >
                              Desconectar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Deletar instância?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta ação não pode ser desfeita. A instância será deletada da Evolution API e todos os dados de configuração serão removidos do banco de dados (URL, API Key, nome da instância e cache de fotos).
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleDeleteInstance}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Deletar Tudo
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>

                {/* QR Code Display */}
                {currentInstance.qrcode?.base64 && currentInstance.status === 'connecting' && (
                  <div className="p-4 border rounded-lg bg-muted/50 space-y-2">
                    <p className="text-sm font-medium">Escaneie o QR Code no WhatsApp:</p>
                    <div className="flex justify-center">
                      <img
                        src={currentInstance.qrcode.base64}
                        alt="QR Code"
                        className="w-64 h-64"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground text-center">
                      Abra o WhatsApp → Mais opções → Aparelhos conectados → Conectar um aparelho
                    </p>
                  </div>
                )}

                {/* Sync Photos Button */}
                {currentInstance.status === 'open' && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleSyncPhotos}
                    disabled={syncPhotosMutation.isPending}
                  >
                    <ImageIcon className="h-4 w-4 mr-2" />
                    {syncPhotosMutation.isPending
                      ? 'Sincronizando fotos...'
                      : 'Sincronizar Fotos de Perfil'}
                  </Button>
                )}
              </>
            ) : (
              <div className="text-center py-8 space-y-4">
                <p className="text-muted-foreground">Nenhuma instância encontrada</p>
                <Button onClick={handleCreateInstance} disabled={createInstanceMutation.isPending}>
                  <Plus className="h-4 w-4 mr-2" />
                  {createInstanceMutation.isPending ? 'Criando...' : 'Criar Instância'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Documentation Link */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Documentação Evolution API</p>
              <p className="text-sm text-muted-foreground">
                Saiba mais sobre como configurar e usar a Evolution API
              </p>
            </div>
            <Button variant="outline" asChild>
              <a
                href="https://doc.evolution-api.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Abrir Docs
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
