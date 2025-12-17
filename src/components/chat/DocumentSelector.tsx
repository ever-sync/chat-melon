import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, FileText, ExternalLink, Paperclip } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyQuery } from '@/hooks/crm/useCompanyQuery';

interface DocumentSelectorProps {
  onSelect: (content: string) => void;
}

export const DocumentSelector = ({ onSelect }: DocumentSelectorProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const { companyId } = useCompanyQuery();

  const { data: documents } = useQuery({
    queryKey: ['company_documents', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('company_documents')
        .select('*')
        .eq('company_id', companyId)
        .order('title', { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!companyId && open,
  });

  const handleSelect = (doc: any) => {
    // We send the link to the chat
    onSelect(`[${doc.title}](${doc.file_url})`);
    setOpen(false);
    setSearch('');
  };

  const filteredDocs = documents?.filter(
    (doc) =>
      doc.title.toLowerCase().includes(search.toLowerCase()) ||
      doc.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" type="button" title="Enviar Link de Documento">
          <FileText className="h-5 w-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="p-3 border-b">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar documentos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        <ScrollArea className="h-80">
          <div className="p-2 space-y-1">
            {filteredDocs?.map((doc) => (
              <button
                key={doc.id}
                onClick={() => handleSelect(doc)}
                className="w-full text-left p-2.5 rounded-md hover:bg-accent transition-colors group flex items-start gap-3"
              >
                <div className="mt-1 p-1.5 bg-indigo-50 rounded text-indigo-600">
                  <FileText className="h-4 w-4" />
                </div>
                <div className="space-y-1 flex-1">
                  <span className="font-medium text-sm text-gray-900 group-hover:text-indigo-700 block">
                    {doc.title}
                  </span>
                  {doc.description && (
                    <p className="text-xs text-muted-foreground line-clamp-1">{doc.description}</p>
                  )}
                  <span className="text-[10px] text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded inline-block mt-1">
                    {doc.file_type}
                  </span>
                </div>
              </button>
            ))}

            {filteredDocs?.length === 0 && (
              <div className="text-center py-8 text-muted-foreground text-sm">
                Nenhum documento encontrado
              </div>
            )}

            {(!documents || documents.length === 0) && (
              <div className="text-center py-8 text-muted-foreground text-sm">
                Nenhum documento cadastrado.
              </div>
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};
