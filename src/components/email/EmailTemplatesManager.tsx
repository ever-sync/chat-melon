import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import {
  Plus,
  Search,
  MoreVertical,
  Mail,
  Edit,
  Copy,
  Trash2,
  Eye,
  Send,
  Sparkles,
  Layout,
  Clock,
  Filter,
} from 'lucide-react';
import { useCompany } from '@/contexts/CompanyContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { EmailTemplateEditor } from './EmailTemplateEditor';
import { EmailTemplate } from './types';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function EmailTemplatesManager() {
  const { currentCompany } = useCompany();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showEditor, setShowEditor] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Buscar templates de email
  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['email-templates-visual', currentCompany?.id],
    queryFn: async () => {
      if (!currentCompany?.id) return [];

      const { data, error } = await supabase
        .from('email_templates_visual')
        .select('*')
        .eq('company_id', currentCompany.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data as any[];
    },
    enabled: !!currentCompany?.id,
  });

  // Criar template
  const createTemplate = useMutation({
    mutationFn: async (template: EmailTemplate) => {
      const { data, error } = await supabase
        .from('email_templates_visual')
        .insert({
          company_id: currentCompany?.id,
          name: template.name,
          subject: template.subject,
          blocks: template.blocks,
          global_styles: template.globalStyles,
          html: template.html,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-templates-visual'] });
      toast.success('Template criado com sucesso!');
      setShowEditor(false);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao criar template');
    },
  });

  // Atualizar template
  const updateTemplate = useMutation({
    mutationFn: async (template: EmailTemplate) => {
      const { data, error } = await supabase
        .from('email_templates_visual')
        .update({
          name: template.name,
          subject: template.subject,
          blocks: template.blocks,
          global_styles: template.globalStyles,
          html: template.html,
          updated_at: new Date().toISOString(),
        })
        .eq('id', template.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-templates-visual'] });
      toast.success('Template atualizado com sucesso!');
      setShowEditor(false);
      setEditingTemplate(null);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao atualizar template');
    },
  });

  // Duplicar template
  const duplicateTemplate = useMutation({
    mutationFn: async (templateId: string) => {
      const original = templates.find((t) => t.id === templateId);
      if (!original) throw new Error('Template não encontrado');

      const { data, error } = await supabase
        .from('email_templates_visual')
        .insert({
          company_id: currentCompany?.id,
          name: `${original.name} (cópia)`,
          subject: original.subject,
          blocks: original.blocks,
          global_styles: original.global_styles,
          html: original.html,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-templates-visual'] });
      toast.success('Template duplicado!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao duplicar template');
    },
  });

  // Deletar template
  const deleteTemplate = useMutation({
    mutationFn: async (templateId: string) => {
      const { error } = await supabase
        .from('email_templates_visual')
        .delete()
        .eq('id', templateId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-templates-visual'] });
      toast.success('Template removido!');
      setDeleteConfirm(null);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao remover template');
    },
  });

  // Salvar template (criar ou atualizar)
  const handleSaveTemplate = (template: EmailTemplate) => {
    if (editingTemplate) {
      updateTemplate.mutate({ ...template, id: editingTemplate.id });
    } else {
      createTemplate.mutate(template);
    }
  };

  // Editar template
  const handleEditTemplate = (template: any) => {
    setEditingTemplate({
      id: template.id,
      name: template.name,
      subject: template.subject || '',
      blocks: template.blocks || [],
      globalStyles: template.global_styles || {
        backgroundColor: '#f4f4f5',
        contentBackgroundColor: '#ffffff',
        primaryColor: '#6366f1',
        textColor: '#1f2937',
        fontFamily: 'Inter, sans-serif',
        maxWidth: 600,
      },
      html: template.html,
      createdAt: template.created_at,
      updatedAt: template.updated_at,
    });
    setShowEditor(true);
  };

  // Filtrar templates
  const filteredTemplates = templates.filter((t) =>
    t.name?.toLowerCase().includes(search.toLowerCase()) ||
    t.subject?.toLowerCase().includes(search.toLowerCase())
  );

  // Se o editor estiver aberto, renderizar apenas ele
  if (showEditor) {
    return (
      <EmailTemplateEditor
        template={editingTemplate || undefined}
        onSave={handleSaveTemplate}
        onClose={() => {
          setShowEditor(false);
          setEditingTemplate(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-rose-500/10 to-pink-500/10">
            <Mail className="h-6 w-6 text-rose-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Templates de Email</h2>
            <p className="text-sm text-gray-500">
              Crie emails profissionais com nosso editor visual
            </p>
          </div>
        </div>
        <Button
          onClick={() => setShowEditor(true)}
          className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Criar Template
        </Button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar templates..."
            className="pl-10"
          />
        </div>
      </div>

      {/* Templates Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <div className="h-48 bg-gray-100" />
              <CardContent className="p-4 space-y-3">
                <div className="h-5 bg-gray-100 rounded w-2/3" />
                <div className="h-4 bg-gray-100 rounded w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredTemplates.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="p-4 rounded-full bg-rose-50 mb-4">
              <Mail className="h-8 w-8 text-rose-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {search ? 'Nenhum template encontrado' : 'Crie seu primeiro template de email'}
            </h3>
            <p className="text-sm text-gray-500 mb-6 max-w-sm">
              {search
                ? 'Tente buscar por outro termo'
                : 'Use nosso editor visual para criar emails profissionais e bonitos'}
            </p>
            {!search && (
              <Button
                onClick={() => setShowEditor(true)}
                className="bg-gradient-to-r from-rose-500 to-pink-600"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Criar Template
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <Card
              key={template.id}
              className="group overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer"
              onClick={() => handleEditTemplate(template)}
            >
              {/* Preview */}
              <div className="relative h-48 bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
                {template.html ? (
                  <iframe
                    srcDoc={template.html}
                    className="w-full h-full pointer-events-none transform scale-50 origin-top-left"
                    style={{ width: '200%', height: '200%' }}
                    title={template.name}
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Layout className="h-12 w-12 text-gray-300" />
                  </div>
                )}

                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-4">
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditTemplate(template);
                      }}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                  </div>
                </div>
              </div>

              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {template.name}
                    </h3>
                    <p className="text-sm text-gray-500 truncate mt-0.5">
                      {template.subject || 'Sem assunto'}
                    </p>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEditTemplate(template)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => duplicateTemplate.mutate(template.id)}>
                        <Copy className="h-4 w-4 mr-2" />
                        Duplicar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setDeleteConfirm(template.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="flex items-center gap-2 mt-3 text-xs text-gray-400">
                  <Clock className="h-3 w-3" />
                  <span>
                    {template.updated_at
                      ? `Atualizado ${formatDistanceToNow(new Date(template.updated_at), {
                          addSuffix: true,
                          locale: ptBR,
                        })}`
                      : 'Recém criado'}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir template?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O template será removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirm && deleteTemplate.mutate(deleteConfirm)}
              className="bg-red-600 hover:bg-red-700"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
