import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Building2, Search, MoreVertical, Edit, Trash2, Plus } from 'lucide-react';
import { DepartmentDialog } from './DepartmentDialog';

interface Department {
    id: string;
    company_id: string;
    name: string;
    description: string | null;
    color: string;
    working_hours: any;
    is_active: boolean;
    show_in_menu: boolean;
    allow_view_all_contacts: boolean;
    created_at: string;
}

interface DepartmentsListProps {
    companyId: string;
}

export function DepartmentsList({ companyId }: DepartmentsListProps) {
    const [departments, setDepartments] = useState<Department[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);

    useEffect(() => {
        if (companyId) {
            loadDepartments();
        }
    }, [companyId]);

    const loadDepartments = async () => {
        try {
            const { data, error } = await supabase
                .from('departments')
                .select('*')
                .eq('company_id', companyId)
                .order('name');

            if (error) throw error;
            setDepartments(data || []);
        } catch (err) {
            console.error('Erro ao carregar setores:', err);
            toast.error('Não foi possível carregar os setores');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (department: Department) => {
        if (!confirm(`Tem certeza que deseja excluir o setor "${department.name}"?`)) {
            return;
        }

        try {
            const { error } = await supabase.from('departments').delete().eq('id', department.id);

            if (error) throw error;
            toast.success('Setor excluído com sucesso!');
            loadDepartments();
        } catch (err: any) {
            console.error('Erro ao excluir setor:', err);
            toast.error(err.message || 'Erro ao excluir setor');
        }
    };

    const handleEdit = (department: Department) => {
        setSelectedDepartment(department);
        setIsDialogOpen(true);
    };

    const handleNew = () => {
        setSelectedDepartment(null);
        setIsDialogOpen(true);
    };

    const handleDialogClose = () => {
        setIsDialogOpen(false);
        setSelectedDepartment(null);
    };

    const filteredDepartments = departments.filter((dept) =>
        dept.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Building2 className="h-5 w-5 text-primary" />
                            <CardTitle>Setores</CardTitle>
                        </div>
                        <Button onClick={handleNew} size="sm">
                            <Plus className="h-4 w-4 mr-2" />
                            Novo Setor
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar setor..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9"
                            />
                        </div>

                        {/* Lista de Setores */}
                        <div className="space-y-2">
                            {isLoading ? (
                                <p className="text-center text-muted-foreground py-8">Carregando...</p>
                            ) : filteredDepartments.length === 0 ? (
                                <p className="text-center text-muted-foreground py-8">
                                    {searchTerm ? 'Nenhum setor encontrado' : 'Nenhum setor cadastrado'}
                                </p>
                            ) : (
                                filteredDepartments.map((dept) => (
                                    <div
                                        key={dept.id}
                                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                                    >
                                        <div className="flex items-center gap-3 flex-1">
                                            <div
                                                className="w-3 h-3 rounded-full"
                                                style={{ backgroundColor: dept.color }}
                                            />
                                            <div className="flex-1">
                                                <p className="font-medium">{dept.name}</p>
                                                {dept.description && (
                                                    <p className="text-sm text-muted-foreground">{dept.description}</p>
                                                )}
                                            </div>
                                            <div className="flex gap-2">
                                                {dept.show_in_menu && (
                                                    <Badge variant="outline" className="text-xs">
                                                        Visível no menu
                                                    </Badge>
                                                )}
                                                {dept.allow_view_all_contacts && (
                                                    <Badge variant="secondary" className="text-xs">
                                                        Acesso total
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => handleEdit(dept)}>
                                                    <Edit className="h-4 w-4 mr-2" />
                                                    Editar
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    onClick={() => handleDelete(dept)}
                                                    className="text-destructive"
                                                >
                                                    <Trash2 className="h-4 w-4 mr-2" />
                                                    Excluir
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            <DepartmentDialog
                isOpen={isDialogOpen}
                onClose={handleDialogClose}
                companyId={companyId}
                department={selectedDepartment}
                onSuccess={loadDepartments}
            />
        </>
    );
}
