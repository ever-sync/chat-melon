import { useState } from 'react';
import { MainLayout } from '@/components/MainLayout';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { FileText, Download, File, ExternalLink, Plus, Pencil, Trash2, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useCompanyQuery } from '@/hooks/crm/useCompanyQuery';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

export default function Documents() {
  const { companyId } = useCompanyQuery();
  const queryClient = useQueryClient();

  // Document States
  const [isDocOpen, setIsDocOpen] = useState(false);
  const [editingDocId, setEditingDocId] = useState<string | null>(null);
  const [docForm, setDocForm] = useState({
    title: '',
    description: '',
    file_url: '',
    file_type: 'PDF',
    file_size: '',
    category_id: 'none',
  });

  // Category States
  const [isCatOpen, setIsCatOpen] = useState(false);
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [catForm, setCatForm] = useState({ name: '' });

  // --- QUERIES ---
  const { data: documents, isLoading: isDocsLoading } = useQuery({
    queryKey: ['company_documents', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('company_documents')
        .select('*, document_categories(name)')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  const { data: categories, isLoading: isCatsLoading } = useQuery({
    queryKey: ['document_categories', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('document_categories')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  // --- MUTATIONS: DOCUMENTS ---
  const createDocMutation = useMutation({
    mutationFn: async (newDoc: {
      title: string;
      description: string;
      file_url: string;
      file_type: string;
      file_size: string | null;
      category_id: string | null;
    }) => {
      const { error } = await supabase.from('company_documents').insert({
        company_id: companyId,
        ...newDoc,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company_documents'] });
      setIsDocOpen(false);
      setDocForm({
        title: '',
        description: '',
        file_url: '',
        file_type: 'PDF',
        file_size: '',
        category_id: 'none',
      });
      toast.success('Documento adicionado com sucesso!');
    },
    onError: (error) => toast.error('Erro ao adicionar documento: ' + error.message),
  });

  const updateDocMutation = useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: {
      id: string;
      title: string;
      description: string;
      file_url: string;
      file_type: string;
      file_size: string | null;
      category_id: string | null;
    }) => {
      const { error } = await supabase.from('company_documents').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company_documents'] });
      setIsDocOpen(false);
      setEditingDocId(null);
      setDocForm({
        title: '',
        description: '',
        file_url: '',
        file_type: 'PDF',
        file_size: '',
        category_id: 'none',
      });
      toast.success('Documento atualizado com sucesso!');
    },
    onError: (error) => toast.error('Erro ao atualizar documento: ' + error.message),
  });

  const deleteDocMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('company_documents').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company_documents'] });
      toast.success('Documento removido com sucesso!');
    },
  });

  // --- MUTATIONS: CATEGORIES ---
  const createCatMutation = useMutation({
    mutationFn: async (newCat: { name: string }) => {
      const { error } = await supabase.from('document_categories').insert({
        company_id: companyId,
        ...newCat,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document_categories'] });
      setIsCatOpen(false);
      setCatForm({ name: '' });
      toast.success('Categoria criada com sucesso!');
    },
    onError: (error) => toast.error('Erro ao criar categoria: ' + error.message),
  });

  const updateCatMutation = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { error } = await supabase.from('document_categories').update({ name }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document_categories'] });
      setIsCatOpen(false);
      setEditingCatId(null);
      setCatForm({ name: '' });
      toast.success('Categoria atualizada com sucesso!');
    },
    onError: (error) => toast.error('Erro ao atualizar categoria: ' + error.message),
  });

  const deleteCatMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('document_categories').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document_categories'] });
      toast.success('Categoria removida com sucesso!');
    },
    onError: (error) =>
      toast.error('Erro ao remover categoria. Verifique se há documentos vinculados.'),
  });

  // --- HANDLERS: DOCUMENTS ---
  const handleDocSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...docForm,
      file_size: docForm.file_size || null,
      category_id: docForm.category_id === 'none' ? null : docForm.category_id,
    };

    if (editingDocId) {
      updateDocMutation.mutate({ id: editingDocId, ...payload });
    } else {
      createDocMutation.mutate(payload);
    }
  };

  const handleEditDoc = (doc: any) => {
    setEditingDocId(doc.id);
    setDocForm({
      title: doc.title,
      description: doc.description || '',
      file_url: doc.file_url,
      file_type: doc.file_type,
      file_size: doc.file_size || '',
      category_id: doc.category_id || 'none',
    });
    setIsDocOpen(true);
  };

  const handleNewDoc = () => {
    setEditingDocId(null);
    setDocForm({
      title: '',
      description: '',
      file_url: '',
      file_type: 'PDF',
      file_size: '',
      category_id: 'none',
    });
    setIsDocOpen(true);
  };

  // --- HANDLERS: CATEGORIES ---
  const handleCatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCatId) {
      updateCatMutation.mutate({ id: editingCatId, ...catForm });
    } else {
      createCatMutation.mutate(catForm);
    }
  };

  const handleEditCat = (cat: any) => {
    setEditingCatId(cat.id);
    setCatForm({ name: cat.name });
    setIsCatOpen(true);
  };

  const handleNewCat = () => {
    setEditingCatId(null);
    setCatForm({ name: '' });
    setIsCatOpen(true);
  };

  return (
    <MainLayout>
      <div className="space-y-8 max-w-5xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Documentos</h1>
          <p className="text-gray-500 mt-2">Acesse manuais, termos e materiais de apoio.</p>
        </div>

        <Tabs defaultValue="documents" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="documents">Meus Documentos</TabsTrigger>
            <TabsTrigger value="categories">Categorias</TabsTrigger>
          </TabsList>

          {/* --- TAB: DOCUMENTS --- */}
          <TabsContent value="documents" className="space-y-6">
            <div className="flex justify-end">
              <Dialog open={isDocOpen} onOpenChange={setIsDocOpen}>
                <DialogTrigger asChild>
                  <Button
                    onClick={handleNewDoc}
                    className="bg-indigo-600 hover:bg-indigo-700 rounded-xl"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Novo Documento
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>
                      {editingDocId ? 'Editar Documento' : 'Novo Documento'}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleDocSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Título</Label>
                      <Input
                        id="title"
                        value={docForm.title}
                        onChange={(e) => setDocForm({ ...docForm, title: e.target.value })}
                        placeholder="Ex: Manual do Usuário"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="category">Categoria</Label>
                      <Select
                        value={docForm.category_id}
                        onValueChange={(value) => setDocForm({ ...docForm, category_id: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma categoria" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Sem categoria</SelectItem>
                          {categories?.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Descrição</Label>
                      <Textarea
                        id="description"
                        value={docForm.description}
                        onChange={(e) => setDocForm({ ...docForm, description: e.target.value })}
                        placeholder="Breve descrição do documento..."
                        rows={2}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="type">Tipo</Label>
                        <Select
                          value={docForm.file_type}
                          onValueChange={(value) => setDocForm({ ...docForm, file_type: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="PDF">PDF</SelectItem>
                            <SelectItem value="DOCS">Documento</SelectItem>
                            <SelectItem value="LINK">Link Externo</SelectItem>
                            <SelectItem value="IMAGE">Imagem</SelectItem>
                            <SelectItem value="ZIP">Arquivo ZIP</SelectItem>
                            <SelectItem value="OTHER">Outro</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="size">Tamanho (Opcional)</Label>
                        <Input
                          id="size"
                          value={docForm.file_size}
                          onChange={(e) => setDocForm({ ...docForm, file_size: e.target.value })}
                          placeholder="Ex: 2.5 MB"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="url">URL do Arquivo / Link</Label>
                      <Input
                        id="url"
                        value={docForm.file_url}
                        onChange={(e) => setDocForm({ ...docForm, file_url: e.target.value })}
                        placeholder="https://..."
                        required
                      />
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsDocOpen(false)}>
                        Cancelar
                      </Button>
                      <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">
                        {editingDocId ? 'Salvar' : 'Criar'}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {isDocsLoading ? (
              <div className="text-center py-8 text-gray-500">Carregando...</div>
            ) : documents?.length === 0 ? (
              <div className="text-center py-8 text-gray-500">Nenhum documento cadastrado.</div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                {documents?.map((doc) => (
                  <Card
                    key={doc.id}
                    className="border-0 shadow-sm rounded-2xl bg-white hover:shadow-md transition-all group relative"
                  >
                    <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 bg-white/80 hover:bg-indigo-50 text-gray-500 hover:text-indigo-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditDoc(doc);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 bg-white/80 hover:bg-red-50 text-gray-500 hover:text-red-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm('Tem certeza que deseja excluir este documento?')) {
                            deleteDocMutation.mutate(doc.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex gap-4">
                          <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100 transition-colors h-fit">
                            <FileText className="h-6 w-6" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                                {doc.title}
                              </h3>
                              {doc.document_categories?.name && (
                                <Badge variant="secondary" className="text-xs font-normal">
                                  {doc.document_categories.name}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                              {doc.description}
                            </p>
                            <div className="flex items-center gap-3 mt-4 text-xs text-gray-400">
                              <span className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-md">
                                <File className="h-3 w-3" />
                                {doc.file_type}
                              </span>
                              {doc.file_size && <span>{doc.file_size}</span>}
                              {doc.file_size && <span>•</span>}
                              <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="mt-6 flex justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-lg gap-2 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200"
                          onClick={() => window.open(doc.file_url, '_blank')}
                        >
                          {doc.file_type === 'LINK' || doc.file_type === 'DOCS' ? (
                            <>
                              <ExternalLink className="h-4 w-4" />
                              Acessar
                            </>
                          ) : (
                            <>
                              <Download className="h-4 w-4" />
                              Download
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* --- TAB: CATEGORIES --- */}
          <TabsContent value="categories" className="space-y-4">
            <div className="flex justify-end">
              <Dialog open={isCatOpen} onOpenChange={setIsCatOpen}>
                <DialogTrigger asChild>
                  <Button
                    onClick={handleNewCat}
                    className="bg-indigo-600 hover:bg-indigo-700 rounded-xl"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Nova Categoria
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {editingCatId ? 'Editar Categoria' : 'Nova Categoria'}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCatSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="catName">Nome da Categoria</Label>
                      <Input
                        id="catName"
                        value={catForm.name}
                        onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
                        placeholder="Ex: Contratos, Manuais..."
                        required
                      />
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsCatOpen(false)}>
                        Cancelar
                      </Button>
                      <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">
                        {editingCatId ? 'Salvar Alterações' : 'Criar Categoria'}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <Card className="border-0 shadow-sm rounded-2xl bg-white overflow-hidden">
              <CardHeader className="border-b border-gray-100 bg-gray-50/50 p-6">
                <div className="flex items-center gap-2 text-indigo-600 font-medium">
                  <Tag className="h-5 w-5" />
                  <span>Lista de Categorias</span>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {isCatsLoading ? (
                  <div className="text-center py-8 text-gray-500">Carregando...</div>
                ) : categories?.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    Nenhuma categoria cadastrada.
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {categories?.map((cat) => (
                      <div
                        key={cat.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 group hover:border-indigo-100 transition-all"
                      >
                        <span className="font-medium text-gray-900">{cat.name}</span>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleEditCat(cat)}
                            className="h-8 w-8 text-gray-500 hover:text-indigo-600"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              if (confirm('Tem certeza que deseja excluir esta categoria?')) {
                                deleteCatMutation.mutate(cat.id);
                              }
                            }}
                            className="h-8 w-8 text-gray-500 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
