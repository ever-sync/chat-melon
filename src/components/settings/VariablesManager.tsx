import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Search, Edit, Trash2, Copy, Check } from 'lucide-react';
import { useVariables, CompanyVariable } from '@/hooks/useVariables';
import { VariableModal } from './VariableModal';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

export function VariablesManager() {
    const { variables, isLoading, deleteVariable } = useVariables();
    const [search, setSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingVariable, setEditingVariable] = useState<CompanyVariable | undefined>();
    const [copiedKey, setCopiedKey] = useState<string | null>(null);

    const filteredVariables = variables.filter(v =>
        v.label.toLowerCase().includes(search.toLowerCase()) ||
        v.key.toLowerCase().includes(search.toLowerCase())
    );

    const handleCreate = () => {
        setEditingVariable(undefined);
        setIsModalOpen(true);
    };

    const handleEdit = (variable: CompanyVariable) => {
        setEditingVariable(variable);
        setIsModalOpen(true);
    };

    const handleDelete = (id: string) => {
        if (window.confirm('Tem certeza que deseja excluir esta variável?')) {
            deleteVariable(id);
        }
    };

    const copyToClipboard = (key: string) => {
        const text = `{{${key}}}`;
        navigator.clipboard.writeText(text);
        setCopiedKey(key);
        toast.success('Variável copiada para a área de transferência!');
        setTimeout(() => setCopiedKey(null), 2000);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold">Variáveis da Empresa</h2>
                    <p className="text-muted-foreground text-sm">
                        Crie variáveis globais que podem ser usadas em seus templates de mensagem.
                    </p>
                </div>
                <Button onClick={handleCreate} className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Variável
                </Button>
            </div>

            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Buscar por nome ou chave..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10 h-11 rounded-xl"
                />
            </div>

            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3].map(i => (
                        <Skeleton key={i} className="h-40 w-full rounded-2xl" />
                    ))}
                </div>
            ) : filteredVariables.length === 0 ? (
                <Card className="border-dashed border-2 p-12 text-center flex flex-col items-center justify-center bg-gray-50/50">
                    <div className="p-4 rounded-full bg-gray-100 mb-4">
                        <Plus className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 font-medium">Nenhuma variável encontrada</p>
                    <p className="text-gray-400 text-sm mt-1">Crie sua primeira variável para começar a usar nos templates.</p>
                    <Button variant="outline" className="mt-6" onClick={handleCreate}>
                        Criar Variável
                    </Button>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredVariables.map((variable) => (
                        <Card key={variable.id} className="group hover:shadow-md transition-all duration-300 border-gray-100 rounded-2xl overflow-hidden">
                            <CardContent className="p-5">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="space-y-0.5">
                                        <h4 className="font-semibold text-gray-900">{variable.label}</h4>
                                        <div
                                            onClick={() => copyToClipboard(variable.key)}
                                            className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md text-xs font-mono cursor-pointer hover:bg-indigo-100 transition-colors"
                                        >
                                            {copiedKey === variable.key ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                                            {"{{"}{variable.key}{"}}"}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => handleEdit(variable)}>
                                            <Edit className="h-4 w-4 text-gray-500" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:text-red-600" onClick={() => handleDelete(variable.id)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="text-sm">
                                        <span className="text-gray-400 block text-[10px] uppercase font-bold tracking-wider mb-1">Valor</span>
                                        <p className="text-gray-700 line-clamp-2 break-all bg-gray-50 p-2 rounded-lg border border-gray-100">
                                            {variable.value}
                                        </p>
                                    </div>

                                    {variable.description && (
                                        <div className="text-sm">
                                            <span className="text-gray-400 block text-[10px] uppercase font-bold tracking-wider mb-1">Descrição</span>
                                            <p className="text-gray-500 text-xs line-clamp-1 italic">
                                                {variable.description}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <VariableModal
                open={isModalOpen}
                onOpenChange={setIsModalOpen}
                variable={editingVariable}
            />
        </div>
    );
}
