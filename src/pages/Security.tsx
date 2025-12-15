import { useState } from 'react';
import { MainLayout } from '@/components/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Shield,
    Key,
    Smartphone,
    FileText,
    Search,
    Download,
    AlertTriangle,
    CheckCircle,
    Clock,
    User,
    Settings,
    Loader2,
} from 'lucide-react';
import { useCompany } from '@/contexts/CompanyContext';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AuditLog {
    id: string;
    action: string;
    resource_type: string;
    resource_name?: string;
    user_email: string;
    severity: 'info' | 'warning' | 'critical';
    created_at: string;
}

const mockAuditLogs: AuditLog[] = [
    {
        id: '1',
        action: 'login',
        resource_type: 'authentication',
        user_email: 'admin@example.com',
        severity: 'info',
        created_at: new Date().toISOString(),
    },
    {
        id: '2',
        action: 'update',
        resource_type: 'settings',
        resource_name: 'Company Settings',
        user_email: 'admin@example.com',
        severity: 'warning',
        created_at: new Date(Date.now() - 3600000).toISOString(),
    },
];

const severityConfig = {
    info: { label: 'Info', color: 'bg-blue-100 text-blue-700', icon: CheckCircle },
    warning: { label: 'Aviso', color: 'bg-yellow-100 text-yellow-700', icon: AlertTriangle },
    critical: { label: 'Crítico', color: 'bg-red-100 text-red-700', icon: AlertTriangle },
};

export default function Security() {
    const { currentCompany } = useCompany();
    const [activeTab, setActiveTab] = useState('overview');
    const [searchQuery, setSearchQuery] = useState('');
    const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
    const [require2FA, setRequire2FA] = useState(false);

    return (
        <MainLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                                <Shield className="w-5 h-5 text-primary" />
                            </div>
                            <span className="text-2xl font-bold text-foreground">Segurança</span>
                        </div>
                        <div className="h-10 w-px bg-border mx-2"></div>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">Central de Segurança</h1>
                            <p className="text-muted-foreground">
                                Gerencie autenticação, 2FA e logs de auditoria
                            </p>
                        </div>
                    </div>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList>
                        <TabsTrigger value="overview">Visão Geral</TabsTrigger>
                        <TabsTrigger value="2fa">Autenticação 2FA</TabsTrigger>
                        <TabsTrigger value="sso">SSO</TabsTrigger>
                        <TabsTrigger value="audit">Logs de Auditoria</TabsTrigger>
                    </TabsList>

                    {/* Overview Tab */}
                    <TabsContent value="overview" className="space-y-4 mt-4">
                        <div className="grid gap-4 md:grid-cols-3">
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">
                                        Status de Segurança
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                        <span className="text-2xl font-bold">Bom</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Todas as configurações estão corretas
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">
                                        Usuários com 2FA
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">0 / 1</div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        0% dos usuários protegidos
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">
                                        Eventos de Segurança
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">0</div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Nos últimos 7 dias
                                    </p>
                                </CardContent>
                            </Card>
                        </div>

                        <Card>
                            <CardHeader>
                                <CardTitle>Recomendações</CardTitle>
                                <CardDescription>
                                    Ações sugeridas para melhorar a segurança
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between p-4 border rounded-lg">
                                    <div className="flex items-center gap-4">
                                        <Smartphone className="h-8 w-8 text-yellow-500" />
                                        <div>
                                            <h4 className="font-semibold">Ativar 2FA</h4>
                                            <p className="text-sm text-muted-foreground">
                                                Proteja sua conta com autenticação de dois fatores
                                            </p>
                                        </div>
                                    </div>
                                    <Button onClick={() => setActiveTab('2fa')}>Configurar</Button>
                                </div>

                                <div className="flex items-center justify-between p-4 border rounded-lg">
                                    <div className="flex items-center gap-4">
                                        <Key className="h-8 w-8 text-blue-500" />
                                        <div>
                                            <h4 className="font-semibold">Configurar SSO</h4>
                                            <p className="text-sm text-muted-foreground">
                                                Centralize a autenticação com seu provedor de identidade
                                            </p>
                                        </div>
                                    </div>
                                    <Button variant="outline" onClick={() => setActiveTab('sso')}>
                                        Configurar
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* 2FA Tab */}
                    <TabsContent value="2fa" className="space-y-4 mt-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Smartphone className="h-5 w-5" />
                                    Autenticação de Dois Fatores
                                </CardTitle>
                                <CardDescription>
                                    Adicione uma camada extra de segurança à sua conta
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="flex items-center justify-between p-4 border rounded-lg">
                                    <div>
                                        <h4 className="font-semibold">2FA na minha conta</h4>
                                        <p className="text-sm text-muted-foreground">
                                            Ativar autenticação de dois fatores para sua conta
                                        </p>
                                    </div>
                                    <Switch
                                        checked={twoFactorEnabled}
                                        onCheckedChange={setTwoFactorEnabled}
                                    />
                                </div>

                                <div className="flex items-center justify-between p-4 border rounded-lg">
                                    <div>
                                        <h4 className="font-semibold">Exigir 2FA para todos</h4>
                                        <p className="text-sm text-muted-foreground">
                                            Obrigar todos os usuários a configurarem 2FA
                                        </p>
                                    </div>
                                    <Switch
                                        checked={require2FA}
                                        onCheckedChange={setRequire2FA}
                                    />
                                </div>

                                {twoFactorEnabled && (
                                    <div className="p-4 bg-muted rounded-lg">
                                        <h4 className="font-semibold mb-2">Métodos disponíveis</h4>
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <CheckCircle className="h-4 w-4 text-green-500" />
                                                <span>App Autenticador (TOTP)</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <CheckCircle className="h-4 w-4 text-green-500" />
                                                <span>SMS</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <CheckCircle className="h-4 w-4 text-green-500" />
                                                <span>Email</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* SSO Tab */}
                    <TabsContent value="sso" className="space-y-4 mt-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Key className="h-5 w-5" />
                                    Single Sign-On (SSO)
                                </CardTitle>
                                <CardDescription>
                                    Configure autenticação centralizada via SAML ou OAuth
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="text-center py-8">
                                    <Key className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                    <h3 className="font-semibold text-lg mb-2">SSO não configurado</h3>
                                    <p className="text-muted-foreground mb-4">
                                        Configure SSO para permitir que seus usuários façam login com o
                                        provedor de identidade da sua empresa.
                                    </p>
                                    <Button>
                                        <Settings className="h-4 w-4 mr-2" />
                                        Configurar SSO
                                    </Button>
                                </div>

                                <div className="border-t pt-4">
                                    <h4 className="font-semibold mb-4">Provedores suportados</h4>
                                    <div className="grid gap-2 md:grid-cols-4">
                                        {['Google Workspace', 'Microsoft Azure AD', 'Okta', 'SAML 2.0'].map(
                                            (provider) => (
                                                <div
                                                    key={provider}
                                                    className="p-3 border rounded-lg text-center text-sm"
                                                >
                                                    {provider}
                                                </div>
                                            )
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Audit Logs Tab */}
                    <TabsContent value="audit" className="space-y-4 mt-4">
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="flex items-center gap-2">
                                            <FileText className="h-5 w-5" />
                                            Logs de Auditoria
                                        </CardTitle>
                                        <CardDescription>
                                            Histórico de ações realizadas no sistema
                                        </CardDescription>
                                    </div>
                                    <Button variant="outline">
                                        <Download className="h-4 w-4 mr-2" />
                                        Exportar
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="flex gap-4 mb-4">
                                    <div className="relative flex-1">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Buscar logs..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="pl-9"
                                        />
                                    </div>
                                    <Select defaultValue="all">
                                        <SelectTrigger className="w-40">
                                            <SelectValue placeholder="Severidade" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Todas</SelectItem>
                                            <SelectItem value="info">Info</SelectItem>
                                            <SelectItem value="warning">Warning</SelectItem>
                                            <SelectItem value="critical">Critical</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Ação</TableHead>
                                            <TableHead>Recurso</TableHead>
                                            <TableHead>Usuário</TableHead>
                                            <TableHead>Severidade</TableHead>
                                            <TableHead>Data</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {mockAuditLogs.map((log) => {
                                            const SeverityIcon = severityConfig[log.severity].icon;
                                            return (
                                                <TableRow key={log.id}>
                                                    <TableCell className="font-medium">{log.action}</TableCell>
                                                    <TableCell>
                                                        {log.resource_name || log.resource_type}
                                                    </TableCell>
                                                    <TableCell>{log.user_email}</TableCell>
                                                    <TableCell>
                                                        <Badge className={severityConfig[log.severity].color}>
                                                            <SeverityIcon className="h-3 w-3 mr-1" />
                                                            {severityConfig[log.severity].label}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-muted-foreground">
                                                        {formatDistanceToNow(new Date(log.created_at), {
                                                            addSuffix: true,
                                                            locale: ptBR,
                                                        })}
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </MainLayout>
    );
}
