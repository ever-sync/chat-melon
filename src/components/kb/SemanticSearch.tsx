import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, Brain } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useCompany } from '@/contexts/CompanyContext';

interface SearchResult {
  id: string;
  content: string;
  document_title: string;
  similarity: number;
}

export function SemanticSearch() {
  const { currentCompany } = useCompany();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [answer, setAnswer] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;

    if (!currentCompany?.id) {
      toast.error('Nenhuma empresa selecionada');
      return;
    }

    setIsSearching(true);
    setAnswer('');
    setResults([]);

    try {
      const { data, error } = await supabase.functions.invoke('kb-semantic-search', {
        body: {
          query,
          companyId: currentCompany.id,
        },
      });

      if (error) throw error;

      if (!data?.success && data?.error) {
        toast.error(data.error);
        return;
      }

      setResults(data?.results || []);
      setAnswer(data?.answer || '');
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Erro ao buscar na base de conhecimento');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <Input
          placeholder="Digite sua pergunta..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          className="flex-1"
        />
        <Button onClick={handleSearch} disabled={isSearching}>
          {isSearching ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
          <span className="ml-2">Buscar</span>
        </Button>
      </div>

      {answer && (
        <Card className="border-primary/50 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Brain className="h-5 w-5 text-primary" />
              Resposta da IA
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{answer}</p>
          </CardContent>
        </Card>
      )}

      {results.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Documentos Relevantes</h3>
          {results.map((result) => (
            <Card key={result.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">{result.document_title}</CardTitle>
                  <Badge variant="secondary">
                    {Math.round(result.similarity * 100)}% relevante
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-3">{result.content}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!isSearching && query && results.length === 0 && !answer && (
        <div className="text-center py-8 text-muted-foreground">
          <p>Nenhum resultado encontrado para "{query}"</p>
          <p className="text-sm mt-2">
            Tente reformular sua pergunta ou adicione mais documentos à base de conhecimento.
          </p>
        </div>
      )}
    </div>
  );
}
