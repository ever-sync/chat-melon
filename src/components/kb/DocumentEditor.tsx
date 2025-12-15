import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Save, X, FileText, Link as LinkIcon, Upload } from 'lucide-react';
import { useToast } from '@/hooks/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/contexts/CompanyContext';

interface DocumentEditorProps {
  documentId?: string | null;
  onSaved?: () => void;
  onCancel?: () => void;
}

export function DocumentEditor({ documentId, onSaved, onCancel }: DocumentEditorProps) {
  const { currentCompany } = useCompany();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    categoryId: '',
    sourceType: 'manual' as 'manual' | 'pdf' | 'url',
    sourceUrl: '',
  });

  useEffect(() => {
    loadCategories();
    if (documentId) {
      loadDocument();
    }
  }, [documentId]);

  const loadCategories = async () => {
    if (!currentCompany?.id) return;

    const { data } = await supabase
      .from('faq_categories')
      .select('*')
      .eq('company_id', currentCompany.id)
      .order('name');

    if (data) {
      setCategories(data);
    }
  };

  const loadDocument = async () => {
    if (!documentId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('kb_documents')
        .select('*')
        .eq('id', documentId)
        .single();

      if (error) throw error;

      if (data) {
        setFormData({
          title: data.title,
          content: data.content,
          categoryId: data.category_id || '',
          sourceType: data.source_type || 'manual',
          sourceUrl: data.source_url || '',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar documento',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentCompany?.id) {
      toast({
        title: 'Erro',
        description: 'Empresa não selecionada',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.title.trim() || !formData.content.trim()) {
      toast({
        title: 'Erro',
        description: 'Título e conteúdo são obrigatórios',
        variant: 'destructive',
      });
      return;
    }

    setProcessing(true);
    try {
      // Call Edge Function to ingest document
      const { data, error } = await supabase.functions.invoke('kb-ingest-document', {
        body: {
          documentId,
          companyId: currentCompany.id,
          title: formData.title,
          content: formData.content,
          categoryId: formData.categoryId || null,
          sourceType: formData.sourceType,
          sourceUrl: formData.sourceUrl || null,
        },
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: 'Sucesso',
          description: `Documento ${documentId ? 'atualizado' : 'criado'} com sucesso. ${data.chunksCreated} chunks processados.`,
        });

        // Reset form
        setFormData({
          title: '',
          content: '',
          categoryId: '',
          sourceType: 'manual',
          sourceUrl: '',
        });

        onSaved?.();
      } else {
        throw new Error(data.error || 'Erro desconhecido');
      }
    } catch (error: any) {
      console.error('Error saving document:', error);
      toast({
        title: 'Erro ao salvar documento',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type === 'text/plain') {
      const text = await file.text();
      setFormData(prev => ({
        ...prev,
        title: prev.title || file.name.replace('.txt', ''),
        content: text,
        sourceType: 'manual',
      }));
      toast({
        title: 'Arquivo carregado',
        description: `${file.name} foi importado com sucesso`,
      });
    } else {
      toast({
        title: 'Formato não suportado',
        description: 'Apenas arquivos .txt são suportados no momento',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>
            {documentId ? 'Editar Documento' : 'Adicionar Documento'}
          </CardTitle>
          <CardDescription>
            O documento será dividido em chunks e processado para busca semântica
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Ex: Política de Trocas e Devoluções"
              required
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Categoria</Label>
            <Select
              value={formData.categoryId}
              onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
            >
              <SelectTrigger id="category">
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Sem categoria</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Source Type */}
          <div className="space-y-2">
            <Label htmlFor="sourceType">Tipo de Fonte</Label>
            <Select
              value={formData.sourceType}
              onValueChange={(value: any) => setFormData({ ...formData, sourceType: value })}
            >
              <SelectTrigger id="sourceType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manual">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Manual
                  </div>
                </SelectItem>
                <SelectItem value="url">
                  <div className="flex items-center gap-2">
                    <LinkIcon className="w-4 h-4" />
                    URL
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Source URL (if URL type) */}
          {formData.sourceType === 'url' && (
            <div className="space-y-2">
              <Label htmlFor="sourceUrl">URL da Fonte</Label>
              <Input
                id="sourceUrl"
                type="url"
                value={formData.sourceUrl}
                onChange={(e) => setFormData({ ...formData, sourceUrl: e.target.value })}
                placeholder="https://..."
              />
            </div>
          )}

          {/* File Upload */}
          <div className="space-y-2">
            <Label htmlFor="file">Importar de Arquivo (.txt)</Label>
            <div className="flex items-center gap-2">
              <Input
                id="file"
                type="file"
                accept=".txt"
                onChange={handleFileUpload}
                className="cursor-pointer"
              />
              <Button type="button" variant="outline" size="icon">
                <Upload className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="space-y-2">
            <Label htmlFor="content">Conteúdo *</Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="Cole ou digite o conteúdo do documento aqui..."
              rows={15}
              className="font-mono text-sm"
              required
            />
            <p className="text-xs text-muted-foreground">
              {formData.content.length} caracteres
              {formData.content.length > 0 && ` • ~${Math.ceil(formData.content.length / 1000)} chunks estimados`}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
            )}
            <Button type="submit" disabled={processing}>
              {processing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {documentId ? 'Atualizar' : 'Salvar'} Documento
                </>
              )}
            </Button>
          </div>

          {/* Info */}
          <div className="rounded-lg bg-muted p-4 text-sm space-y-2">
            <h4 className="font-medium">Como funciona:</h4>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>O documento será dividido em chunks de ~1000 caracteres</li>
              <li>Cada chunk receberá um embedding (vetor) usando OpenAI</li>
              <li>A IA usará busca semântica para encontrar chunks relevantes</li>
              <li>Respostas serão geradas com base no contexto encontrado</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
