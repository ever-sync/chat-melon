import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ShieldCheck, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface UserPermissionsDialogProps {
    isOpen: boolean;
    onClose: () => void;
    member: any;
}

const PERMISSION_GROUPS: Record<string, { label: string; permissions: { key: string; label: string }[] }> = {
    chat: {
        label: 'Chat e Atendimento',
        permissions: [
            { key: 'chat.view_all', label: 'Visualizar todos os chats' },
            { key: 'chat.view_team', label: 'Visualizar chats da equipe' },
            { key: 'chat.view_own', label: 'Visualizar próprios chats' },
            { key: 'chat.send_messages', label: 'Enviar mensagens' },
            { key: 'chat.transfer', label: 'Transferir atendimentos' },
            { key: 'chat.take_over', label: 'Assumir atendimentos' },
            { key: 'chat.close', label: 'Encerrar atendimentos' },
            { key: 'chat.delete_messages', label: 'Apagar mensagens' },
        ],
    },
    contacts: {
        label: 'Contatos e Clientes',
        permissions: [
            { key: 'contacts.view_all', label: 'Visualizar todos os contatos' },
            { key: 'contacts.view_own', label: 'Visualizar próprios contatos' },
            { key: 'contacts.create', label: 'Criar novos contatos' },
            { key: 'contacts.edit_all', label: 'Editar todos os contatos' },
            { key: 'contacts.edit_own', label: 'Editar próprios contatos' },
            { key: 'contacts.delete', label: 'Excluir contatos' },
        ],
    },
    deals: {
        label: 'Vendas (CRM)',
        permissions: [
            { key: 'deals.view_all', label: 'Visualizar todos os negócios' },
            { key: 'deals.view_own', label: 'Visualizar próprios negócios' },
            { key: 'deals.create', label: 'Criar novos negócios' },
            { key: 'deals.edit_all', label: 'Editar todos os negócios' },
            { key: 'deals.edit_own', label: 'Editar próprios negócios' },
            { key: 'deals.delete', label: 'Excluir negócios' },
            { key: 'deals.move_stage', label: 'Mover estágios do funil' },
        ],
    },
    campaigns: {
        label: 'Campanhas',
        permissions: [
            { key: 'campaigns.view', label: 'Visualizar campanhas' },
            { key: 'campaigns.create', label: 'Criar novas campanhas' },
            { key: 'campaigns.edit', label: 'Editar campanhas' },
            { key: 'campaigns.execute', label: 'Disparar campanhas' },
            { key: 'campaigns.delete', label: 'Excluir campanhas' },
        ],
    },
    reports: {
        label: 'Relatórios',
        permissions: [
            { key: 'reports.view_all', label: 'Visualizar todos os relatórios' },
            { key: 'reports.view_team', label: 'Visualizar relatórios da equipe' },
            { key: 'reports.view_own', label: 'Visualizar próprios relatórios' },
            { key: 'reports.export', label: 'Exportar dados/PDF' },
        ],
    },
    settings: {
        label: 'Configurações',
        permissions: [
            { key: 'settings.company', label: 'Gerenciar dados da empresa' },
            { key: 'settings.users', label: 'Gerenciar usuários e permissões' },
            { key: 'settings.queues', label: 'Gerenciar filas e setores' },
            { key: 'settings.labels', label: 'Gerenciar etiquetas' },
            { key: 'settings.pipelines', label: 'Gerenciar funis de venda' },
            { key: 'settings.integrations', label: 'Gerenciar integrações' },
        ],
    },
};

export function UserPermissionsDialog({
    isOpen,
    onClose,
    member,
}: UserPermissionsDialogProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [permissions, setPermissions] = useState<Record<string, boolean>>({});
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (member && isOpen) {
            loadPermissions();
        }
    }, [member, isOpen]);

    const loadPermissions = async () => {
        setIsLoading(true);
        try {
            // Primeiro buscamos as permissões salvas específicas para o membro
            const { data, error } = await supabase
                .from('member_permissions')
                .select('permission_key, is_granted')
                .eq('member_id', member.id);

            if (error) throw error;

            const permsMap: Record<string, boolean> = {};
            data?.forEach((p) => {
                permsMap[p.permission_key] = p.is_granted;
            });

            setPermissions(permsMap);
        } catch (err: any) {
            console.error('Erro ao carregar permissões:', err);
            toast.error('Erro ao carregar permissões customizadas');
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggle = async (key: string, isGranted: boolean) => {
        setPermissions(prev => ({ ...prev, [key]: isGranted }));

        try {
            const { error } = await supabase
                .from('member_permissions')
                .upsert({
                    member_id: member.id,
                    permission_key: key,
                    is_granted: isGranted,
                    updated_at: new Date().toISOString()
                }, {
                    onConflict: 'member_id,permission_key'
                });

            if (error) throw error;
        } catch (err: any) {
            console.error('Erro ao salvar permissão:', err);
            toast.error('Erro ao salvar alteração');
            // Reverter localmente em caso de erro
            setPermissions(prev => ({ ...prev, [key]: !isGranted }));
        }
    };

    const filteredGroups = Object.entries(PERMISSION_GROUPS).reduce((acc, [groupId, group]) => {
        const filteredPerms = group.permissions.filter(p =>
            p.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.key.toLowerCase().includes(searchTerm.toLowerCase())
        );

        if (filteredPerms.length > 0) {
            acc[groupId] = { ...group, permissions: filteredPerms };
        }
        return acc;
    }, {} as typeof PERMISSION_GROUPS);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl h-[80vh] flex flex-col p-0">
                <DialogHeader className="p-6 pb-2">
                    <div className="flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5 text-primary" />
                        <DialogTitle>Permissões de {member?.display_name || 'Usuário'}</DialogTitle>
                    </div>
                    <DialogDescription>
                        Defina permissões específicas que sobrescrevem o cargo padrão do usuário.
                    </DialogDescription>
                </DialogHeader>

                <div className="px-6 pb-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar permissão..."
                            className="pl-9"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <ScrollArea className="flex-1 px-6">
                    <div className="space-y-8 pb-6">
                        {Object.entries(filteredGroups).map(([groupId, group]) => (
                            <div key={groupId} className="space-y-4">
                                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                                    {group.label}
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {group.permissions.map((p) => (
                                        <div
                                            key={p.key}
                                            className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                                        >
                                            <div className="space-y-0.5">
                                                <Label className="text-sm font-medium leading-none cursor-pointer" htmlFor={p.key}>
                                                    {p.label}
                                                </Label>
                                                <p className="text-[10px] text-muted-foreground font-mono">
                                                    {p.key}
                                                </p>
                                            </div>
                                            <Switch
                                                id={p.key}
                                                checked={permissions[p.key] || false}
                                                onCheckedChange={(val) => handleToggle(p.key, val)}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                        {Object.keys(filteredGroups).length === 0 && (
                            <div className="text-center py-10 text-muted-foreground">
                                Nenhuma permissão encontrada para sua busca.
                            </div>
                        )}
                    </div>
                </ScrollArea>

                <DialogFooter className="p-6 pt-2 border-t mt-auto">
                    <Button variant="outline" onClick={onClose}>
                        Fechar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
