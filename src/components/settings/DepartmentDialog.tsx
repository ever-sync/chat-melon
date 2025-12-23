import { useState } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Building2, Clock } from 'lucide-react';

interface Department {
    id: string;
    company_id: string;
    name: string;
    description: string | null;
    color: string;
    working_hours: WorkingHours;
    is_active: boolean;
    show_in_menu: boolean;
    allow_view_all_contacts: boolean;
    auto_assign_leads: boolean;
    welcome_message: string | null;
    created_at: string;
    updated_at: string;
}

interface DaySchedule {
    start: string;
    end: string;
    enabled: boolean;
    is_24h: boolean;
}

interface WorkingHours {
    monday: DaySchedule;
    tuesday: DaySchedule;
    wednesday: DaySchedule;
    thursday: DaySchedule;
    friday: DaySchedule;
    saturday: DaySchedule;
    sunday: DaySchedule;
}

interface DepartmentDialogProps {
    isOpen: boolean;
    onClose: () => void;
    companyId: string;
    department?: Department | null;
    onSuccess: () => void;
}

const COLORS = [
    { value: '#fbbf24', label: 'Amarelo' },
    { value: '#f97316', label: 'Laranja' },
    { value: '#ec4899', label: 'Rosa' },
    { value: '#a855f7', label: 'Roxo' },
    { value: '#8b5cf6', label: 'Violeta' },
    { value: '#10b981', label: 'Verde' },
    { value: '#06b6d4', label: 'Ciano' },
    { value: '#3b82f6', label: 'Azul' },
    { value: '#1e293b', label: 'Escuro' },
    { value: '#64748b', label: 'Cinza' },
];

const DAYS = [
    { key: 'monday', label: 'Segunda' },
    { key: 'tuesday', label: 'Terça' },
    { key: 'wednesday', label: 'Quarta' },
    { key: 'thursday', label: 'Quinta' },
    { key: 'friday', label: 'Sexta' },
    { key: 'saturday', label: 'Sábado' },
    { key: 'sunday', label: 'Domingo' },
];

const DEFAULT_WORKING_HOURS: WorkingHours = {
    monday: { start: '08:30', end: '17:30', enabled: true, is_24h: false },
    tuesday: { start: '08:30', end: '17:30', enabled: true, is_24h: false },
    wednesday: { start: '08:30', end: '17:30', enabled: true, is_24h: false },
    thursday: { start: '08:30', end: '17:30', enabled: true, is_24h: false },
    friday: { start: '08:30', end: '17:30', enabled: true, is_24h: false },
    saturday: { start: '00:00', end: '23:59', enabled: false, is_24h: false },
    sunday: { start: '00:00', end: '23:59', enabled: false, is_24h: false },
};

export function DepartmentDialog({
    isOpen,
    onClose,
    companyId,
    department,
    onSuccess,
}: DepartmentDialogProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [name, setName] = useState(department?.name || '');
    const [description, setDescription] = useState(department?.description || '');
    const [color, setColor] = useState(department?.color || '#6366f1');
    const [workingHours, setWorkingHours] = useState<WorkingHours>(
        department?.working_hours || DEFAULT_WORKING_HOURS
    );
    const [showInMenu, setShowInMenu] = useState(department?.show_in_menu ?? true);
    const [allowViewAllContacts, setAllowViewAllContacts] = useState(
        department?.allow_view_all_contacts ?? false
    );
    const [welcomeMessage, setWelcomeMessage] = useState(department?.welcome_message || '');

    const handleSubmit = async () => {
        if (!name.trim()) {
            toast.error('Digite o nome do setor');
            return;
        }

        setIsSubmitting(true);
        try {
            const data = {
                company_id: companyId,
                name: name.trim(),
                description: description.trim() || null,
                color,
                working_hours: workingHours,
                show_in_menu: showInMenu,
                allow_view_all_contacts: allowViewAllContacts,
                welcome_message: welcomeMessage.trim() || null,
            };

            if (department) {
                // Atualizar
                const { error } = await supabase
                    .from('departments')
                    .update(data)
                    .eq('id', department.id);

                if (error) throw error;
                toast.success('Setor atualizado com sucesso!');
            } else {
                // Criar
                const { error } = await supabase.from('departments').insert([data]);

                if (error) throw error;
                toast.success('Setor criado com sucesso!');
            }

            onSuccess();
            onClose();
        } catch (err: any) {
            console.error('Erro ao salvar setor:', err);
            toast.error(err.message || 'Erro ao salvar setor');
        } finally {
            setIsSubmitting(false);
        }
    };

    const updateDaySchedule = (day: keyof WorkingHours, field: keyof DaySchedule, value: any) => {
        setWorkingHours((prev) => ({
            ...prev,
            [day]: {
                ...prev[day],
                [field]: value,
            },
        }));
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-primary" />
                        <DialogTitle>{department ? 'Editar Setor' : 'Novo Setor'}</DialogTitle>
                    </div>
                    <DialogDescription>
                        Configure o setor e seus horários de funcionamento
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Nome */}
                    <div>
                        <Label>Nome do Setor *</Label>
                        <Input
                            placeholder="Ex: COMERCIAL, PÓS VENDA, SUPORTE"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>

                    {/* Descrição */}
                    <div>
                        <Label>Descrição</Label>
                        <Textarea
                            placeholder="Descrição do setor (opcional)"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={2}
                        />
                    </div>

                    {/* Cor */}
                    <div>
                        <Label>Cor do Setor</Label>
                        <div className="flex gap-2 mt-2 flex-wrap">
                            {COLORS.map((c) => (
                                <button
                                    key={c.value}
                                    type="button"
                                    onClick={() => setColor(c.value)}
                                    className={`w-10 h-10 rounded-full transition-transform hover:scale-110 ${color === c.value ? 'ring-2 ring-offset-2 ring-primary' : ''
                                        }`}
                                    style={{ backgroundColor: c.value }}
                                    title={c.label}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Horário de Expediente */}
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <Label className="text-base">Expediente Setor</Label>
                        </div>
                        <div className="space-y-3 border rounded-lg p-4">
                            {DAYS.map(({ key, label }) => {
                                const day = workingHours[key as keyof WorkingHours];
                                return (
                                    <div key={key} className="flex items-center gap-4">
                                        <div className="flex items-center gap-2 w-32">
                                            <Switch
                                                checked={day.enabled}
                                                onCheckedChange={(checked) =>
                                                    updateDaySchedule(key as keyof WorkingHours, 'enabled', checked)
                                                }
                                            />
                                            <span className="text-sm font-medium">{label}</span>
                                        </div>

                                        {day.enabled && (
                                            <>
                                                <Input
                                                    type="time"
                                                    value={day.start}
                                                    onChange={(e) =>
                                                        updateDaySchedule(key as keyof WorkingHours, 'start', e.target.value)
                                                    }
                                                    className="w-32"
                                                    disabled={day.is_24h}
                                                />
                                                <span className="text-muted-foreground">às</span>
                                                <Input
                                                    type="time"
                                                    value={day.end}
                                                    onChange={(e) =>
                                                        updateDaySchedule(key as keyof WorkingHours, 'end', e.target.value)
                                                    }
                                                    className="w-32"
                                                    disabled={day.is_24h}
                                                />
                                                <div className="flex items-center gap-2">
                                                    <Switch
                                                        checked={day.is_24h}
                                                        onCheckedChange={(checked) =>
                                                            updateDaySchedule(key as keyof WorkingHours, 'is_24h', checked)
                                                        }
                                                    />
                                                    <span className="text-sm text-muted-foreground">24 horas</span>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Funcionalidades */}
                    <div className="space-y-3 border rounded-lg p-4">
                        <Label className="text-base">Funcionalidades</Label>

                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium">Enviar leads apenas para atendentes online</p>
                                <p className="text-xs text-muted-foreground">
                                    Quando ativado, leads só serão enviados para atendentes que estiverem online
                                </p>
                            </div>
                            <Switch checked={false} disabled />
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium">Frase Padrão</p>
                                <p className="text-xs text-muted-foreground">
                                    Mensagem de boas-vindas do setor
                                </p>
                            </div>
                        </div>
                        <Textarea
                            placeholder="Digite a mensagem de boas-vindas..."
                            value={welcomeMessage}
                            onChange={(e) => setWelcomeMessage(e.target.value)}
                            rows={2}
                        />

                        <div className="flex items-center justify-between pt-2">
                            <div>
                                <p className="text-sm font-medium">Configuração de exibição do menu</p>
                                <p className="text-xs text-muted-foreground">
                                    Ativado: permite visualizar setor / Desativado: oculta setor
                                </p>
                            </div>
                            <div className="flex gap-4">
                                <button
                                    type="button"
                                    onClick={() => setShowInMenu(true)}
                                    className={`px-4 py-2 rounded text-sm ${showInMenu
                                            ? 'bg-primary text-primary-foreground'
                                            : 'bg-muted text-muted-foreground'
                                        }`}
                                >
                                    Ativado
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowInMenu(false)}
                                    className={`px-4 py-2 rounded text-sm ${!showInMenu
                                            ? 'bg-primary text-primary-foreground'
                                            : 'bg-muted text-muted-foreground'
                                        }`}
                                >
                                    Desativado
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center justify-between pt-2">
                            <div>
                                <p className="text-sm font-medium">
                                    Permitir que este setor visualize toda a base de contatos
                                </p>
                            </div>
                            <Switch
                                checked={allowViewAllContacts}
                                onCheckedChange={setAllowViewAllContacts}
                            />
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
                        Cancelar
                    </Button>
                    <Button onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting ? 'Salvando...' : department ? 'Atualizar' : 'Cadastrar'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
