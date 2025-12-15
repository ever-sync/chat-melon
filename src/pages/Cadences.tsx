import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Plus,
    Search,
    MoreVertical,
    Play,
    Pause,
    Copy,
    Trash2,
    Edit,
    Users,
    TrendingUp,
    Mail,
    MessageSquare,
    Clock,
    Loader2,
    Zap,
} from 'lucide-react';
import { useCadences } from '@/hooks/useCadences';
import { toast } from 'sonner';
import type { Cadence } from '@/types/cadences';

const statusConfig = {
    draft: { label: 'Rascunho', color: 'bg-gray-100 text-gray-700' },
    active: { label: 'Ativo', color: 'bg-green-100 text-green-700' },
    paused: { label: 'Pausado', color: 'bg-yellow-100 text-yellow-700' },
    archived: { label: 'Arquivado', color: 'bg-red-100 text-red-700' },
};

export default function Cadences() {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [newCadenceName, setNewCadenceName] = useState('');
    const [newCadenceDescription, setNewCadenceDescription] = useState('');

    const {
        cadences,
        isLoading,
        createCadence,
        deleteCadence,
        duplicateCadence,
        activateCadence,
        pauseCadence,
    } = useCadences();

    const filteredCadences = cadences.filter(
        (c) =>
            c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleCreate = async () => {
        if (!newCadenceName.trim()) {
            toast.error('Nome é obrigatório');
            return;
        }

        try {
            const cadence = await createCadence.mutateAsync({
                name: newCadenceName,
                description: newCadenceDescription,
            });

            setCreateDialogOpen(false);
            setNewCadenceName('');
            setNewCadenceDescription('');
            toast.success('Cadência criada com sucesso');

            // Navigate to builder
            navigate(`/cadences/${cadence.id}`);
        } catch (error) {
            toast.error('Erro ao criar cadência');
        }
    };

    const handleDuplicate = async (id: string) => {
        try {
            await duplicateCadence.mutateAsync(id);
            toast.success('Cadência duplicada com sucesso');
        } catch (error) {
            toast.error('Erro ao duplicar cadência');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir esta cadência?')) return;

        try {
            await deleteCadence.mutateAsync(id);
            toast.success('Cadência excluída com sucesso');
        } catch (error) {
            toast.error('Erro ao excluir cadência');
        }
    };

    const handleToggleStatus = async (cadence: Cadence) => {
        try {
            if (cadence.status === 'active') {
                await pauseCadence.mutateAsync(cadence.id);
                toast.success('Cadência pausada');
            } else {
                await activateCadence.mutateAsync(cadence.id);
                toast.success('Cadência ativada');
            }
        } catch (error) {
            toast.error('Erro ao alterar status');
        }
    };

    const getStepIcons = (steps: any[]) => {
        const channels = [...new Set(steps.map((s) => s.channel))];
        return channels.map((channel) => {
            switch (channel) {
                case 'whatsapp':
                    return <MessageSquare key={channel} className="h-4 w-4 text-green-500" />;
                case 'email':
                    return <Mail key={channel} className="h-4 w-4 text-blue-500" />;
                case 'task':
                    return <Clock key={channel} className="h-4 w-4 text-orange-500" />;
                default:
                    return null;
            }
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
                                <Zap className="w-5 h-5 text-primary" />
                            </div>
                            <span className="text-2xl font-bold text-foreground">Cadences</span>
                        </div>
                        <div className="h-10 w-px bg-border mx-2"></div>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">Sales Cadences</h1>
                            <p className="text-muted-foreground">
                                Sequências automatizadas de follow-up para prospecção
                            </p>
                        </div>
                    </div>
                    <Button onClick={() => setCreateDialogOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Nova Cadência
                    </Button>
                </div>

                {/* Search */}
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar cadências..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                    />
                </div>

                {/* Stats */}
                <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Total de Cadências
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{cadences.length}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Ativas
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">
                                {cadences.filter((c) => c.status === 'active').length}
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Total Inscritos
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {cadences.reduce((sum, c) => sum + c.total_enrolled, 0)}
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Taxa de Resposta
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-primary">
                                {cadences.reduce((sum, c) => sum + c.total_enrolled, 0) > 0
                                    ? Math.round(
                                        (cadences.reduce((sum, c) => sum + c.total_replied, 0) /
                                            cadences.reduce((sum, c) => sum + c.total_enrolled, 0)) *
                                        100
                                    )
                                    : 0}
                                %
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Cadences List */}
                {isLoading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : filteredCadences.length === 0 ? (
                    <Card>
                        <CardContent className="py-12 text-center">
                            <Zap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                            <h3 className="font-semibold text-lg mb-2">Nenhuma cadência encontrada</h3>
                            <p className="text-muted-foreground mb-4">
                                Crie sua primeira cadência para automatizar o follow-up com seus leads.
                            </p>
                            <Button onClick={() => setCreateDialogOpen(true)}>
                                <Plus className="h-4 w-4 mr-2" />
                                Criar Cadência
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4">
                        {filteredCadences.map((cadence) => (
                            <Card key={cadence.id} className="hover:shadow-md transition-shadow">
                                <CardContent className="p-6">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="font-semibold text-lg">{cadence.name}</h3>
                                                <Badge className={statusConfig[cadence.status].color}>
                                                    {statusConfig[cadence.status].label}
                                                </Badge>
                                            </div>
                                            {cadence.description && (
                                                <p className="text-muted-foreground text-sm mb-3">
                                                    {cadence.description}
                                                </p>
                                            )}
                                            <div className="flex items-center gap-6 text-sm text-muted-foreground">
                                                <div className="flex items-center gap-1">
                                                    <span>{cadence.steps?.length || 0} passos</span>
                                                    <div className="flex gap-1 ml-2">
                                                        {getStepIcons(cadence.steps || [])}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Users className="h-4 w-4" />
                                                    <span>{cadence.total_enrolled} inscritos</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <TrendingUp className="h-4 w-4" />
                                                    <span>
                                                        {cadence.total_enrolled > 0
                                                            ? Math.round((cadence.total_replied / cadence.total_enrolled) * 100)
                                                            : 0}
                                                        % responderam
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {cadence.status === 'active' ? (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleToggleStatus(cadence)}
                                                >
                                                    <Pause className="h-4 w-4 mr-1" />
                                                    Pausar
                                                </Button>
                                            ) : (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleToggleStatus(cadence)}
                                                >
                                                    <Play className="h-4 w-4 mr-1" />
                                                    Ativar
                                                </Button>
                                            )}

                                            <Button
                                                variant="default"
                                                size="sm"
                                                onClick={() => navigate(`/cadences/${cadence.id}`)}
                                            >
                                                <Edit className="h-4 w-4 mr-1" />
                                                Editar
                                            </Button>

                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => navigate(`/cadences/${cadence.id}`)}>
                                                        <Edit className="h-4 w-4 mr-2" />
                                                        Editar
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleDuplicate(cadence.id)}>
                                                        <Copy className="h-4 w-4 mr-2" />
                                                        Duplicar
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        onClick={() => handleDelete(cadence.id)}
                                                        className="text-destructive"
                                                    >
                                                        <Trash2 className="h-4 w-4 mr-2" />
                                                        Excluir
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Create Dialog */}
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Nova Cadência</DialogTitle>
                        <DialogDescription>
                            Crie uma sequência automatizada de follow-up para seus leads.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Nome</Label>
                            <Input
                                placeholder="Ex: Follow-up Inbound"
                                value={newCadenceName}
                                onChange={(e) => setNewCadenceName(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Descrição (opcional)</Label>
                            <Textarea
                                placeholder="Descreva o objetivo desta cadência..."
                                value={newCadenceDescription}
                                onChange={(e) => setNewCadenceDescription(e.target.value)}
                                rows={3}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={handleCreate} disabled={createCadence.isPending}>
                            {createCadence.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Criar Cadência
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </MainLayout>
    );
}
