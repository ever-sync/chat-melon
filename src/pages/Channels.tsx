import { useState } from 'react';
import { MainLayout } from '@/components/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    MessageSquare,
    Instagram,
    Facebook,
    Mail,
    Globe,
    Plus,
    Settings,
    CheckCircle,
    XCircle,
    AlertCircle,
    RefreshCw,
    Trash2,
    ExternalLink,
    Loader2,
} from 'lucide-react';
import { useCompany } from '@/contexts/CompanyContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Channel {
    id: string;
    type: 'whatsapp' | 'instagram' | 'messenger' | 'email' | 'webchat';
    name: string;
    is_active: boolean;
    status: 'connected' | 'disconnected' | 'error';
    credentials: Record<string, any>;
    settings: Record<string, any>;
    total_conversations: number;
    total_messages_in: number;
    total_messages_out: number;
    last_activity_at: string | null;
    created_at: string;
}

const channelConfig = {
    whatsapp: {
        name: 'WhatsApp',
        icon: MessageSquare,
        color: 'text-green-500',
        bgColor: 'bg-green-500/10',
        description: 'Conecte via Evolution API ou WhatsApp Business API',
    },
    instagram: {
        name: 'Instagram DM',
        icon: Instagram,
        color: 'text-pink-500',
        bgColor: 'bg-pink-500/10',
        description: 'Receba e responda mensagens do Instagram Direct',
    },
    messenger: {
        name: 'Facebook Messenger',
        icon: Facebook,
        color: 'text-blue-500',
        bgColor: 'bg-blue-500/10',
        description: 'Integre com sua página do Facebook',
    },
    email: {
        name: 'Email',
        icon: Mail,
        color: 'text-orange-500',
        bgColor: 'bg-orange-500/10',
        description: 'Receba emails como conversas no chat',
    },
    webchat: {
        name: 'Widget Web',
        icon: Globe,
        color: 'text-purple-500',
        bgColor: 'bg-purple-500/10',
        description: 'Chat widget para seu site',
    },
};

const statusConfig = {
    connected: { label: 'Conectado', color: 'bg-green-100 text-green-700', icon: CheckCircle },
    disconnected: { label: 'Desconectado', color: 'bg-gray-100 text-gray-700', icon: XCircle },
    error: { label: 'Erro', color: 'bg-red-100 text-red-700', icon: AlertCircle },
};

export default function Channels() {
    const { currentCompany } = useCompany();
    const queryClient = useQueryClient();
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [selectedType, setSelectedType] = useState<string | null>(null);
    const [configData, setConfigData] = useState<Record<string, string>>({});

    // Fetch channels
    const { data: channels = [], isLoading } = useQuery({
        queryKey: ['channels', currentCompany?.id],
        queryFn: async () => {
            if (!currentCompany?.id) return [];

            const { data, error } = await (supabase
                .from('channels' as any) as any)
                .select('*')
                .eq('company_id', currentCompany.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data as Channel[];
        },
        enabled: !!currentCompany?.id,
    });

    // Create channel mutation
    const createChannel = useMutation({
        mutationFn: async ({ type, name, credentials }: { type: string; name: string; credentials: Record<string, any> }) => {
            const { data, error } = await (supabase
                .from('channels' as any) as any)
                .insert({
                    company_id: currentCompany?.id,
                    type,
                    name,
                    credentials,
                    is_active: true,
                    status: 'disconnected',
                } as any)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['channels'] });
            toast.success('Canal criado com sucesso!');
            setShowAddDialog(false);
            setSelectedType(null);
            setConfigData({});
        },
        onError: (error: any) => {
            toast.error(error.message || 'Erro ao criar canal');
        },
    });

    // Delete channel mutation
    const deleteChannel = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await (supabase.from('channels' as any) as any).delete().eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['channels'] });
            toast.success('Canal removido');
        },
    });

    // Toggle channel mutation
    const toggleChannel = useMutation({
        mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
            const { error } = await (supabase
                .from('channels' as any) as any)
                .update({ is_active } as any)
                .eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['channels'] });
        },
    });

    const handleAddChannel = () => {
        if (!selectedType) return;

        let credentials: Record<string, any> = {};
        let name = channelConfig[selectedType as keyof typeof channelConfig]?.name || selectedType;

        if (selectedType === 'instagram') {
            credentials = {
                instagram_id: configData.instagram_id,
                access_token: configData.access_token,
                page_id: configData.page_id,
            };
            name = configData.channel_name || 'Instagram DM';
        } else if (selectedType === 'messenger') {
            credentials = {
                page_id: configData.page_id,
                access_token: configData.access_token,
                page_name: configData.page_name,
            };
            name = configData.page_name || 'Facebook Messenger';
        }

        createChannel.mutate({ type: selectedType, name, credentials });
    };

    const handleOAuthConnect = (type: string) => {
        // Meta OAuth flow
        const clientId = process.env.REACT_APP_META_APP_ID || 'YOUR_META_APP_ID';
        const redirectUri = `${window.location.origin}/oauth/callback`;
        const scope = type === 'instagram'
            ? 'instagram_basic,instagram_manage_messages,pages_show_list,pages_messaging'
            : 'pages_show_list,pages_messaging,pages_read_engagement';

        const oauthUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&state=${type}`;

        window.open(oauthUrl, '_blank', 'width=600,height=700');

        toast.info('Complete a autenticação na janela que abriu', {
            description: 'Após autorizar, volte aqui e insira os dados.',
        });
    };

    return (
        <MainLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                                <MessageSquare className="w-5 h-5 text-primary" />
                            </div>
                            <span className="text-2xl font-bold text-foreground">Canais</span>
                        </div>
                        <div className="h-10 w-px bg-border mx-2"></div>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">Canais de Comunicação</h1>
                            <p className="text-muted-foreground">
                                Conecte WhatsApp, Instagram, Messenger e mais
                            </p>
                        </div>
                    </div>
                    <Button onClick={() => setShowAddDialog(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar Canal
                    </Button>
                </div>

                {/* Connected Channels */}
                {isLoading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : channels.length === 0 ? (
                    <Card>
                        <CardContent className="py-12 text-center">
                            <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                            <h3 className="font-semibold text-lg mb-2">Nenhum canal configurado</h3>
                            <p className="text-muted-foreground mb-4">
                                Adicione um canal para começar a receber mensagens.
                            </p>
                            <Button onClick={() => setShowAddDialog(true)}>
                                <Plus className="h-4 w-4 mr-2" />
                                Adicionar Canal
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {channels.map((channel) => {
                            const config = channelConfig[channel.type];
                            const Icon = config?.icon || MessageSquare;
                            const StatusIcon = statusConfig[channel.status]?.icon || XCircle;

                            return (
                                <Card key={channel.id} className="relative">
                                    <CardHeader className="pb-2">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-lg ${config?.bgColor || 'bg-gray-100'}`}>
                                                    <Icon className={`h-5 w-5 ${config?.color || 'text-gray-500'}`} />
                                                </div>
                                                <div>
                                                    <CardTitle className="text-base">{channel.name}</CardTitle>
                                                    <p className="text-xs text-muted-foreground capitalize">
                                                        {config?.name || channel.type}
                                                    </p>
                                                </div>
                                            </div>
                                            <Switch
                                                checked={channel.is_active}
                                                onCheckedChange={(checked) =>
                                                    toggleChannel.mutate({ id: channel.id, is_active: checked })
                                                }
                                            />
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="flex items-center gap-2">
                                            <Badge className={statusConfig[channel.status]?.color}>
                                                <StatusIcon className="h-3 w-3 mr-1" />
                                                {statusConfig[channel.status]?.label}
                                            </Badge>
                                        </div>

                                        <div className="grid grid-cols-3 gap-2 text-center">
                                            <div>
                                                <div className="text-lg font-semibold">{channel.total_conversations}</div>
                                                <div className="text-xs text-muted-foreground">Conversas</div>
                                            </div>
                                            <div>
                                                <div className="text-lg font-semibold">{channel.total_messages_in}</div>
                                                <div className="text-xs text-muted-foreground">Recebidas</div>
                                            </div>
                                            <div>
                                                <div className="text-lg font-semibold">{channel.total_messages_out}</div>
                                                <div className="text-xs text-muted-foreground">Enviadas</div>
                                            </div>
                                        </div>

                                        <div className="flex gap-2">
                                            <Button variant="outline" size="sm" className="flex-1">
                                                <Settings className="h-4 w-4 mr-1" />
                                                Configurar
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                    if (confirm('Remover este canal?')) {
                                                        deleteChannel.mutate(channel.id);
                                                    }
                                                }}
                                            >
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}

                {/* Available Channels */}
                <Card>
                    <CardHeader>
                        <CardTitle>Canais Disponíveis</CardTitle>
                        <CardDescription>
                            Adicione novos canais para comunicação omnichannel
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {Object.entries(channelConfig).map(([type, config]) => {
                                const Icon = config.icon;
                                const isConnected = channels.some((c) => c.type === type);

                                return (
                                    <div
                                        key={type}
                                        className={`p-4 border rounded-lg ${isConnected ? 'opacity-60' : 'hover:border-primary cursor-pointer'
                                            }`}
                                        onClick={() => {
                                            if (!isConnected) {
                                                setSelectedType(type);
                                                setShowAddDialog(true);
                                            }
                                        }}
                                    >
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className={`p-2 rounded-lg ${config.bgColor}`}>
                                                <Icon className={`h-5 w-5 ${config.color}`} />
                                            </div>
                                            <div>
                                                <h4 className="font-semibold">{config.name}</h4>
                                                {isConnected && (
                                                    <Badge variant="secondary" className="text-xs">
                                                        Conectado
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                        <p className="text-sm text-muted-foreground">{config.description}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Add Channel Dialog */}
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>
                            {selectedType
                                ? `Configurar ${channelConfig[selectedType as keyof typeof channelConfig]?.name}`
                                : 'Adicionar Canal'}
                        </DialogTitle>
                        <DialogDescription>
                            {selectedType
                                ? 'Insira as credenciais para conectar este canal'
                                : 'Escolha o tipo de canal que deseja adicionar'}
                        </DialogDescription>
                    </DialogHeader>

                    {!selectedType ? (
                        <div className="grid gap-3">
                            {Object.entries(channelConfig).map(([type, config]) => {
                                const Icon = config.icon;
                                return (
                                    <button
                                        key={type}
                                        className="flex items-center gap-3 p-4 border rounded-lg hover:border-primary text-left"
                                        onClick={() => setSelectedType(type)}
                                    >
                                        <div className={`p-2 rounded-lg ${config.bgColor}`}>
                                            <Icon className={`h-5 w-5 ${config.color}`} />
                                        </div>
                                        <div>
                                            <div className="font-semibold">{config.name}</div>
                                            <div className="text-sm text-muted-foreground">{config.description}</div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {selectedType === 'instagram' && (
                                <>
                                    <div className="p-4 bg-pink-50 border border-pink-200 rounded-lg">
                                        <p className="text-sm text-pink-800">
                                            Para conectar o Instagram, você precisa de uma conta Business/Creator conectada a uma Página do Facebook.
                                        </p>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="mt-2"
                                            onClick={() => handleOAuthConnect('instagram')}
                                        >
                                            <ExternalLink className="h-4 w-4 mr-2" />
                                            Conectar com Facebook
                                        </Button>
                                    </div>
                                    <div className="space-y-3">
                                        <div>
                                            <Label>Nome do Canal</Label>
                                            <Input
                                                placeholder="Ex: Instagram Principal"
                                                value={configData.channel_name || ''}
                                                onChange={(e) => setConfigData({ ...configData, channel_name: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <Label>Instagram Business Account ID</Label>
                                            <Input
                                                placeholder="ID da conta Instagram Business"
                                                value={configData.instagram_id || ''}
                                                onChange={(e) => setConfigData({ ...configData, instagram_id: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <Label>Page ID (Facebook)</Label>
                                            <Input
                                                placeholder="ID da página do Facebook vinculada"
                                                value={configData.page_id || ''}
                                                onChange={(e) => setConfigData({ ...configData, page_id: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <Label>Access Token</Label>
                                            <Input
                                                type="password"
                                                placeholder="Token de acesso da API"
                                                value={configData.access_token || ''}
                                                onChange={(e) => setConfigData({ ...configData, access_token: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </>
                            )}

                            {selectedType === 'messenger' && (
                                <>
                                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                        <p className="text-sm text-blue-800">
                                            Configure sua Página do Facebook para receber mensagens do Messenger.
                                        </p>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="mt-2"
                                            onClick={() => handleOAuthConnect('messenger')}
                                        >
                                            <ExternalLink className="h-4 w-4 mr-2" />
                                            Conectar Página
                                        </Button>
                                    </div>
                                    <div className="space-y-3">
                                        <div>
                                            <Label>Nome da Página</Label>
                                            <Input
                                                placeholder="Nome da sua página no Facebook"
                                                value={configData.page_name || ''}
                                                onChange={(e) => setConfigData({ ...configData, page_name: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <Label>Page ID</Label>
                                            <Input
                                                placeholder="ID da página do Facebook"
                                                value={configData.page_id || ''}
                                                onChange={(e) => setConfigData({ ...configData, page_id: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <Label>Page Access Token</Label>
                                            <Input
                                                type="password"
                                                placeholder="Token de acesso da página"
                                                value={configData.access_token || ''}
                                                onChange={(e) => setConfigData({ ...configData, access_token: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </>
                            )}

                            {selectedType === 'whatsapp' && (
                                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                                    <p className="text-sm text-green-800">
                                        O WhatsApp já está configurado via Evolution API nas configurações do sistema.
                                    </p>
                                    <Button variant="outline" size="sm" className="mt-2" asChild>
                                        <a href="/settings">
                                            <Settings className="h-4 w-4 mr-2" />
                                            Ir para Configurações
                                        </a>
                                    </Button>
                                </div>
                            )}

                            {selectedType === 'webchat' && (
                                <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                                    <p className="text-sm text-purple-800">
                                        O Widget de Chat já está disponível nas configurações.
                                    </p>
                                    <Button variant="outline" size="sm" className="mt-2" asChild>
                                        <a href="/settings">
                                            <Settings className="h-4 w-4 mr-2" />
                                            Configurar Widget
                                        </a>
                                    </Button>
                                </div>
                            )}

                            {selectedType === 'email' && (
                                <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                                    <p className="text-sm text-orange-800">
                                        Integração de email em breve! Configure IMAP/SMTP para receber emails como conversas.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setShowAddDialog(false);
                                setSelectedType(null);
                                setConfigData({});
                            }}
                        >
                            Cancelar
                        </Button>
                        {selectedType && ['instagram', 'messenger'].includes(selectedType) && (
                            <Button onClick={handleAddChannel} disabled={createChannel.isPending}>
                                {createChannel.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                Salvar Canal
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </MainLayout>
    );
}
