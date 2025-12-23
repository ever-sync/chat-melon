import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useProposalTemplates } from '@/hooks/useProposalTemplates';
import { Plus, FileText, Trash2, Edit, Copy } from 'lucide-react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export const ProposalTemplatesManager = () => {
    const { templates, isLoading, deleteTemplate } = useProposalTemplates();
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const handleDelete = async () => {
        if (deleteId) {
            await deleteTemplate(deleteId);
            setDeleteId(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Templates de Propostas</h2>
                    <p className="text-muted-foreground text-sm">
                        Gerencie seus templates de propostas comerciais
                    </p>
                </div>
                <Button className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 overflow-hidden shadow-lg shadow-emerald-500/20 transition-all duration-300 hover:scale-105">
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Template
                </Button>
            </div>

            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                        <Card key={i} className="animate-pulse rounded-2xl border-gray-100">
                            <CardHeader>
                                <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                                <div className="h-3 bg-muted rounded w-full" />
                            </CardHeader>
                            <CardContent>
                                <div className="h-32 bg-muted rounded" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : templates.length === 0 ? (
                <Card className="border-dashed border-2 p-12 text-center flex flex-col items-center justify-center bg-gray-50/50 rounded-3xl">
                    <div className="p-4 rounded-full bg-emerald-50 mb-4">
                        <FileText className="h-8 w-8 text-emerald-500" />
                    </div>
                    <p className="text-gray-500 font-medium">Nenhum template encontrado</p>
                    <p className="text-gray-400 text-sm mt-1 text-center max-w-[300px]">Crie seu primeiro template de proposta para agilizar o processo de vendas.</p>
                    <Button variant="outline" className="mt-6 rounded-xl" onClick={() => { }}>
                        Criar Primeiro Template
                    </Button>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {templates.map((template) => (
                        <Card key={template.id} className="group hover:shadow-xl transition-all duration-300 border-gray-100 rounded-3xl overflow-hidden bg-white hover:-translate-y-1">
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <CardTitle className="text-lg flex items-center gap-2 font-bold text-gray-900">
                                            {template.name}
                                            {template.is_default && (
                                                <Badge className="text-[10px] bg-emerald-500">
                                                    PADRÃO
                                                </Badge>
                                            )}
                                        </CardTitle>
                                        {template.description && (
                                            <CardDescription className="mt-1 line-clamp-1">{template.description}</CardDescription>
                                        )}
                                    </div>
                                </div>
                                {template.category && (
                                    <Badge variant="secondary" className="w-fit mt-2 text-[10px] uppercase font-bold tracking-wider text-gray-400 bg-gray-50">
                                        {template.category}
                                    </Badge>
                                )}
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {/* Preview placeholder */}
                                    <div className="h-32 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl flex items-center justify-center border border-emerald-100/50">
                                        <FileText className="h-12 w-12 text-emerald-200" />
                                    </div>

                                    {/* Stats */}
                                    <div className="flex items-center justify-between text-xs text-gray-500 font-medium px-1">
                                        <span className="flex items-center gap-1.5">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                            {template.content.sections.length} seções
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                                            {template.usage_count} usos
                                        </span>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-2 pt-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                                        <Button variant="outline" size="sm" className="flex-1 rounded-xl h-9 text-xs font-semibold">
                                            <Edit className="h-3.5 w-3.5 mr-1.5" />
                                            Editar
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="rounded-xl h-9 w-9 text-gray-400 hover:text-red-500 hover:bg-red-50 hover:border-red-100 transition-colors"
                                            onClick={() => setDeleteId(template.id)}
                                            disabled={template.is_default}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <AlertDialogContent className="rounded-3xl border-0 shadow-2xl p-8">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-2xl font-bold text-gray-900">Excluir Template</AlertDialogTitle>
                        <AlertDialogDescription className="text-base text-gray-500">
                            Tem certeza que deseja excluir este template? Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-8 gap-3">
                        <AlertDialogCancel className="rounded-xl h-12 px-6 font-medium">Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-red-500 text-white hover:bg-red-600 rounded-xl h-12 px-8 font-bold shadow-lg shadow-red-500/20"
                        >
                            Excluir
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};
