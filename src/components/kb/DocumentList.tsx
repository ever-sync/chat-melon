import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Loader2, MoreVertical, Edit, Trash2, FileText, Link as LinkIcon, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/contexts/CompanyContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DocumentListProps {
  onEdit?: (documentId: string) => void;
}

export function DocumentList({ onEdit }: DocumentListProps) {
  const { currentCompany } = useCompany();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState<any[]>([]);

  useEffect(() => {
    loadDocuments();
  }, [currentCompany?.id]);

  const loadDocuments = async () => {
    if (!currentCompany?.id) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('kb_documents')
        .select(`
          *,
          category:faq_categories(name),
          chunks:kb_chunks(count)
        `)
        .eq('company_id', currentCompany.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setDocuments(data || []);
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar documentos',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (documentId: string) => {
    if (!confirm('Tem certeza que deseja excluir este documento?')) return;

    try {
      const { error } = await supabase
        .from('kb_documents')
        .delete()
        .eq('id', documentId);

      if (error) throw error;

      toast({
        title: 'Documento excluído',
        description: 'O documento e seus chunks foram removidos',
      });

      loadDocuments();
    } catch (error: any) {
      toast({
        title: 'Erro ao excluir',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const toggleActive = async (documentId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('kb_documents')
        .update({ is_active: !isActive })
        .eq('id', documentId);

      if (error) throw error;

      toast({
        title: isActive ? 'Documento desativado' : 'Documento ativado',
      });

      loadDocuments();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const getSourceIcon = (sourceType: string) => {
    switch (sourceType) {
      case 'url':
        return <LinkIcon className="w-4 h-4" />;
      case 'pdf':
        return <FileText className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="text-center p-12">
        <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Nenhum documento encontrado</h3>
        <p className="text-muted-foreground mb-4">
          Comece adicionando documentos à sua base de conhecimento
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Título</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead>Fonte</TableHead>
            <TableHead>Chunks</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Criado em</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {documents.map((doc) => (
            <TableRow key={doc.id}>
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  {getSourceIcon(doc.source_type)}
                  {doc.title}
                </div>
              </TableCell>
              <TableCell>
                {doc.category?.name ? (
                  <Badge variant="outline">{doc.category.name}</Badge>
                ) : (
                  <span className="text-muted-foreground text-sm">-</span>
                )}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground capitalize">
                {doc.source_type}
              </TableCell>
              <TableCell>
                <Badge variant="secondary">
                  {doc.chunks?.[0]?.count || 0} chunks
                </Badge>
              </TableCell>
              <TableCell>
                {doc.is_active ? (
                  <Badge variant="default" className="bg-green-500">Ativo</Badge>
                ) : (
                  <Badge variant="secondary">Inativo</Badge>
                )}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {format(new Date(doc.created_at), 'dd/MM/yyyy', { locale: ptBR })}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit?.(doc.id)}>
                      <Edit className="w-4 h-4 mr-2" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => toggleActive(doc.id, doc.is_active)}>
                      <Eye className="w-4 h-4 mr-2" />
                      {doc.is_active ? 'Desativar' : 'Ativar'}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDelete(doc.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
