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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { UserCog } from 'lucide-react';

interface UserEditDialogProps {
    isOpen: boolean;
    onClose: () => void;
    member: any;
    teams: any[];
    departments: any[];
    onSuccess: () => void;
    roleLabels: Record<string, { label: string; color: string }>;
}

export function UserEditDialog({
    isOpen,
    onClose,
    member,
    teams,
    departments,
    onSuccess,
    roleLabels,
}: UserEditDialogProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [displayName, setDisplayName] = useState('');
    const [role, setRole] = useState('');
    const [teamId, setTeamId] = useState<string | null>(null);
    const [departmentId, setDepartmentId] = useState<string | null>(null);
    const [canReceiveChats, setCanReceiveChats] = useState(true);
    const [maxConcurrentChats, setMaxConcurrentChats] = useState(10);

    useEffect(() => {
        if (member) {
            setDisplayName(member.display_name || '');
            setRole(member.role || '');
            setTeamId(member.team_id || 'none');
            setDepartmentId(member.department_id || 'none');
            setCanReceiveChats(member.can_receive_chats ?? true);
            setMaxConcurrentChats(member.max_concurrent_chats || 10);
        }
    }, [member]);

    const handleSubmit = async () => {
        if (!member) return;

        setIsSubmitting(true);
        try {
            const updates = {
                display_name: displayName.trim(),
                role: role as any,
                team_id: teamId === 'none' ? null : teamId,
                department_id: departmentId === 'none' ? null : departmentId,
                can_receive_chats: canReceiveChats,
                max_concurrent_chats: maxConcurrentChats,
                updated_at: new Date().toISOString(),
            };

            const { error } = await supabase
                .from('company_members')
                .update(updates)
                .eq('id', member.id);

            if (error) throw error;

            toast.success('Usuário atualizado com sucesso!');
            onSuccess();
            onClose();
        } catch (err: any) {
            console.error('Erro ao atualizar usuário:', err);
            toast.error(err.message || 'Erro ao atualizar usuário');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <div className="flex items-center gap-2">
                        <UserCog className="h-5 w-5 text-primary" />
                        <DialogTitle>Editar Usuário</DialogTitle>
                    </div>
                    <DialogDescription>
                        Atualize as informações e permissões básicas do membro.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Nome de Exibição</Label>
                        <Input
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            placeholder="Nome do usuário"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Cargo</Label>
                            <Select value={role} onValueChange={setRole}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.entries(roleLabels)
                                        .filter(([r]) => r !== 'owner' || member?.role === 'owner')
                                        .map(([r, { label }]) => (
                                            <SelectItem key={r} value={r}>
                                                {label}
                                            </SelectItem>
                                        ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Setor</Label>
                            <Select
                                value={departmentId || 'none'}
                                onValueChange={(val) => setDepartmentId(val === 'none' ? null : val)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione um setor" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Nenhum</SelectItem>
                                    {departments.map((dept) => (
                                        <SelectItem key={dept.id} value={dept.id}>
                                            {dept.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Equipe</Label>
                        <Select
                            value={teamId || 'none'}
                            onValueChange={(val) => setTeamId(val === 'none' ? null : val)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione uma equipe" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">Nenhuma</SelectItem>
                                {teams.map((team) => (
                                    <SelectItem key={team.id} value={team.id}>
                                        {team.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="space-y-0.5">
                            <Label>Receber Atendimentos</Label>
                            <p className="text-xs text-muted-foreground">
                                Permite que este usuário receba novos chats
                            </p>
                        </div>
                        <Switch
                            checked={canReceiveChats}
                            onCheckedChange={setCanReceiveChats}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Limite de Chats Simultâneos</Label>
                        <Input
                            type="number"
                            value={maxConcurrentChats}
                            onChange={(e) => setMaxConcurrentChats(parseInt(e.target.value))}
                            min={1}
                            max={100}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
                        Cancelar
                    </Button>
                    <Button onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
