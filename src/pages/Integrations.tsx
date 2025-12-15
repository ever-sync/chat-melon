import { useState } from 'react';
import { MainLayout } from '@/components/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import {
    Zap,
    Webhook,
    RefreshCw,
    CheckCircle,
    XCircle,
    AlertCircle,
    Plus,
    Settings,
    ExternalLink,
    Loader2,
} from 'lucide-react';
import { useCompany } from '@/contexts/CompanyContext';
import { toast } from 'sonner';

interface Integration {
    id: string;
    name: string;
    provider: string;
    description: string;
    icon: string;
    status: 'active' | 'paused' | 'error' | 'disconnected';
    lastSync?: string;
    category: 'automation' | 'crm' | 'erp' | 'marketing';
}

const availableIntegrations: Omit<Integration, 'id' | 'status' | 'lastSync'>[] = [
    {
        name: 'Zapier',
        provider: 'zapier',
        description: 'Conecte com mais de 5000 aplicativos',
        icon: '⚡',
        category: 'automation',
    },
    {
        name: 'Make (Integromat)',
        provider: 'make',
        description: 'Automações avançadas com cenários visuais',
        icon: '🔄',
        category: 'automation',
    },
    {
        name: 'RD Station',
        provider: 'rd_station',
        description: 'Sincronize leads e campanhas de marketing',
        icon: '📊',
        category: 'marketing',
    },
    {
        name: 'HubSpot',
        provider: 'hubspot',
        description: 'CRM completo com marketing automation',
        icon: '🧡',
        category: 'crm',
    },
    {
        name: 'Tiny ERP',
        provider: 'tiny',
        description: 'Gestão de estoque, vendas e finanças',
        icon: '📦',
        category: 'erp',
    },
    {
        name: 'Bling',
        provider: 'bling',
        description: 'ERP completo para e-commerce',
        icon: '💼',
        category: 'erp',
    },
];

const statusConfig = {
    active: { label: 'Conectado', color: 'bg-green-100 text-green-700', icon: CheckCircle },
    paused: { label: 'Pausado', color: 'bg-yellow-100 text-yellow-700', icon: AlertCircle },
    error: { label: 'Erro', color: 'bg-red-100 text-red-700', icon: XCircle },
    disconnected: { label: 'Desconectado', color: 'bg-gray-100 text-gray-700', icon: XCircle },
};

export default function Integrations() {
    const { currentCompany } = useCompany();
    const [activeTab, setActiveTab] = useState('all');
    const [connectedIntegrations, setConnectedIntegrations] = useState<Integration[]>([]);

    const handleConnect = (provider: string) => {
        toast.info(`Conectando com ${provider}...`, {
            description: 'Esta funcionalidade requer configuração adicional.',
        });
    };

    const handleSync = (integrationId: string) => {
        toast.success('Sincronização iniciada');
    };

    const filteredIntegrations = activeTab === 'all'
        ? availableIntegrations
        : availableIntegrations.filter((i) => i.category === activeTab);

    return (
        <MainLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                                <Zap className="w-5 h-5 text-primary" />
                            </div>
                            <span className="text-2xl font-bold text-foreground">Integrações</span>
                        </div>
                        <div className="h-10 w-px bg-border mx-2"></div>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">Conecte suas ferramentas</h1>
                            <p className="text-muted-foreground">
                                Integre com CRMs, ERPs e ferramentas de automação
                            </p>
                        </div>
                    </div>
                </div>

                {/* Connected Integrations */}
                {connectedIntegrations.length > 0 && (
                    <div className="space-y-4">
                        <h2 className="text-xl font-semibold">Integrações Ativas</h2>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {connectedIntegrations.map((integration) => {
                                const StatusIcon = statusConfig[integration.status].icon;
                                return (
                                    <Card key={integration.id}>
                                        <CardHeader className="pb-2">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-2xl">{integration.icon}</span>
                                                    <CardTitle className="text-lg">{integration.name}</CardTitle>
                                                </div>
                                                <Badge className={statusConfig[integration.status].color}>
                                                    <StatusIcon className="h-3 w-3 mr-1" />
                                                    {statusConfig[integration.status].label}
                                                </Badge>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-sm text-muted-foreground mb-4">
                                                {integration.description}
                                            </p>
                                            {integration.lastSync && (
                                                <p className="text-xs text-muted-foreground mb-4">
                                                    Última sync: {integration.lastSync}
                                                </p>
                                            )}
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleSync(integration.id)}
                                                >
                                                    <RefreshCw className="h-4 w-4 mr-1" />
                                                    Sincronizar
                                                </Button>
                                                <Button variant="ghost" size="sm">
                                                    <Settings className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Available Integrations */}
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold">Integrações Disponíveis</h2>

                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList>
                            <TabsTrigger value="all">Todas</TabsTrigger>
                            <TabsTrigger value="automation">Automação</TabsTrigger>
                            <TabsTrigger value="crm">CRM</TabsTrigger>
                            <TabsTrigger value="erp">ERP</TabsTrigger>
                            <TabsTrigger value="marketing">Marketing</TabsTrigger>
                        </TabsList>

                        <TabsContent value={activeTab} className="mt-4">
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {filteredIntegrations.map((integration) => (
                                    <Card key={integration.provider} className="hover:shadow-md transition-shadow">
                                        <CardHeader className="pb-2">
                                            <div className="flex items-center gap-3">
                                                <span className="text-3xl">{integration.icon}</span>
                                                <div>
                                                    <CardTitle className="text-lg">{integration.name}</CardTitle>
                                                    <Badge variant="secondary" className="mt-1">
                                                        {integration.category}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-sm text-muted-foreground mb-4">
                                                {integration.description}
                                            </p>
                                            <Button
                                                className="w-full"
                                                onClick={() => handleConnect(integration.provider)}
                                            >
                                                <Plus className="h-4 w-4 mr-2" />
                                                Conectar
                                            </Button>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>

                {/* Webhooks Section */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <Webhook className="h-6 w-6 text-primary" />
                            <div>
                                <CardTitle>Webhooks</CardTitle>
                                <CardDescription>
                                    Configure webhooks para receber eventos em tempo real
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Button variant="outline" asChild>
                            <a href="/settings/webhooks">
                                Configurar Webhooks
                                <ExternalLink className="h-4 w-4 ml-2" />
                            </a>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </MainLayout>
    );
}
