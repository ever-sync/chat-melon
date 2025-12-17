import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  BarChart3,
  FileText,
  MessageSquare,
  TrendingUp,
  Brain,
  CheckCircle,
  XCircle,
  Clock,
  Zap,
  Database,
  AlertTriangle,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/contexts/CompanyContext';

interface StatCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: React.ReactNode;
  trend?: string;
  trendDown?: boolean;
}

function StatCard({ title, value, description, icon, trend, trendDown }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
        {trend && (
          <p
            className={`text-xs mt-2 flex items-center gap-1 ${trendDown ? 'text-red-600' : 'text-green-600'}`}
          >
            <TrendingUp className={`h-3 w-3 ${trendDown ? 'rotate-180' : ''}`} />
            {trend}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-40 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-40 w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function KBAnalytics() {
  const { currentCompany } = useCompany();

  // Fetch main stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['kb-stats', currentCompany?.id],
    queryFn: async () => {
      if (!currentCompany?.id) return null;

      // Get document count
      const { count: documentCount } = await supabase
        .from('kb_documents')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', currentCompany.id);

      // Get chunk count
      const { count: chunkCount } = await supabase
        .from('kb_chunks')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', currentCompany.id);

      // Get query count (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { count: queryCount } = await supabase
        .from('kb_queries')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', currentCompany.id)
        .gte('created_at', thirtyDaysAgo.toISOString());

      // Get avg confidence score
      const { data: confidenceData } = await supabase
        .from('kb_queries')
        .select('confidence_score')
        .eq('company_id', currentCompany.id)
        .not('confidence_score', 'is', null);

      const avgConfidence =
        confidenceData && confidenceData.length > 0
          ? confidenceData.reduce((sum, q) => sum + (q.confidence_score || 0), 0) /
            confidenceData.length
          : 0;

      // Get cache stats
      const { data: cacheData } = await supabase
        .from('kb_answer_cache')
        .select('hit_count')
        .eq('company_id', currentCompany.id);

      const totalCacheHits = cacheData?.reduce((sum, c) => sum + (c.hit_count || 0), 0) || 0;
      const cacheEntries = cacheData?.length || 0;

      return {
        totalDocuments: documentCount || 0,
        totalChunks: chunkCount || 0,
        totalQueries: queryCount || 0,
        avgConfidence: (avgConfidence * 100).toFixed(1),
        totalCacheHits,
        cacheEntries,
      };
    },
    enabled: !!currentCompany?.id,
  });

  // Fetch top documents
  const { data: topDocuments, isLoading: docsLoading } = useQuery({
    queryKey: ['kb-top-documents', currentCompany?.id],
    queryFn: async () => {
      if (!currentCompany?.id) return [];

      // Get document hit counts from queries
      const { data: queries } = await supabase
        .from('kb_queries')
        .select('results')
        .eq('company_id', currentCompany.id)
        .not('results', 'is', null);

      const documentHits: Record<string, { title: string; hits: number }> = {};

      queries?.forEach((query) => {
        const results = query.results as any[];
        results?.forEach((result) => {
          const docId = result.document_id;
          const docTitle = result.document_title || 'Documento sem título';
          if (docId) {
            if (!documentHits[docId]) {
              documentHits[docId] = { title: docTitle, hits: 0 };
            }
            documentHits[docId].hits++;
          }
        });
      });

      return Object.entries(documentHits)
        .map(([id, data]) => ({ id, ...data }))
        .sort((a, b) => b.hits - a.hits)
        .slice(0, 10);
    },
    enabled: !!currentCompany?.id,
  });

  // Fetch top queries
  const { data: topQueries, isLoading: queriesLoading } = useQuery({
    queryKey: ['kb-top-queries', currentCompany?.id],
    queryFn: async () => {
      if (!currentCompany?.id) return [];

      const { data } = await supabase
        .from('kb_queries')
        .select('query, confidence_score, created_at')
        .eq('company_id', currentCompany.id)
        .order('created_at', { ascending: false })
        .limit(10);

      return data || [];
    },
    enabled: !!currentCompany?.id,
  });

  // Fetch low confidence queries
  const { data: lowConfidenceQueries, isLoading: lowConfLoading } = useQuery({
    queryKey: ['kb-low-confidence', currentCompany?.id],
    queryFn: async () => {
      if (!currentCompany?.id) return [];

      const { data } = await supabase
        .from('kb_queries')
        .select('query, confidence_score, created_at')
        .eq('company_id', currentCompany.id)
        .lt('confidence_score', 0.5)
        .order('created_at', { ascending: false })
        .limit(10);

      return data || [];
    },
    enabled: !!currentCompany?.id,
  });

  if (statsLoading) {
    return <LoadingSkeleton />;
  }

  const noData = !stats || (stats.totalDocuments === 0 && stats.totalQueries === 0);

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total de Documentos"
          value={stats?.totalDocuments || 0}
          description="Documentos na base de conhecimento"
          icon={<FileText className="h-4 w-4 text-muted-foreground" />}
        />
        <StatCard
          title="Total de Chunks"
          value={stats?.totalChunks || 0}
          description="Fragmentos de texto indexados"
          icon={<Database className="h-4 w-4 text-muted-foreground" />}
        />
        <StatCard
          title="Consultas (30 dias)"
          value={stats?.totalQueries || 0}
          description="Perguntas respondidas pela IA"
          icon={<MessageSquare className="h-4 w-4 text-muted-foreground" />}
        />
        <StatCard
          title="Confiança Média"
          value={`${stats?.avgConfidence || 0}%`}
          description="Score médio de confiança"
          icon={<Brain className="h-4 w-4 text-muted-foreground" />}
          trend={parseFloat(stats?.avgConfidence || '0') > 70 ? 'Bom desempenho' : undefined}
          trendDown={parseFloat(stats?.avgConfidence || '0') < 50}
        />
      </div>

      {/* Cache Stats */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-500" />
              Cache de Respostas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Entradas no cache</span>
              <span className="font-medium">{stats?.cacheEntries || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total de cache hits</span>
              <span className="font-medium">{stats?.totalCacheHits || 0}</span>
            </div>
            {stats && stats.cacheEntries > 0 && stats.totalCacheHits > 0 && (
              <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                Economia de ~{stats.totalCacheHits * 500} tokens estimados
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-blue-500" />
              Qualidade das Respostas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Alta confiança (≥70%)</span>
                  <span className="font-medium text-green-600">
                    {parseFloat(stats?.avgConfidence || '0') >= 70 ? '✓' : '-'}
                  </span>
                </div>
                <Progress
                  value={Math.min(parseFloat(stats?.avgConfidence || '0'), 100)}
                  className="h-2"
                />
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Consultas com baixa confiança</span>
                <Badge
                  variant={
                    lowConfidenceQueries && lowConfidenceQueries.length > 5
                      ? 'destructive'
                      : 'secondary'
                  }
                >
                  {lowConfidenceQueries?.length || 0}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Top Documents */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Documentos Mais Consultados
            </CardTitle>
            <CardDescription>
              Ranking dos documentos que mais contribuem para as respostas
            </CardDescription>
          </CardHeader>
          <CardContent>
            {docsLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : topDocuments && topDocuments.length > 0 ? (
              <ScrollArea className="h-[280px]">
                <div className="space-y-2">
                  {topDocuments.map((doc, index) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-2 rounded-md bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-muted-foreground w-5">
                          #{index + 1}
                        </span>
                        <span className="text-sm truncate max-w-[200px]">{doc.title}</span>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {doc.hits} consultas
                      </Badge>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum dado disponível ainda</p>
                <p className="text-sm mt-2">
                  As estatísticas aparecerão conforme você fazer consultas.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Queries */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Consultas Recentes
            </CardTitle>
            <CardDescription>Últimas perguntas feitas à base de conhecimento</CardDescription>
          </CardHeader>
          <CardContent>
            {queriesLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : topQueries && topQueries.length > 0 ? (
              <ScrollArea className="h-[280px]">
                <div className="space-y-2">
                  {topQueries.map((query, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 rounded-md bg-muted/50"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">{query.query}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(query.created_at).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <Badge
                        variant={
                          query.confidence_score >= 0.7
                            ? 'default'
                            : query.confidence_score >= 0.5
                              ? 'secondary'
                              : 'destructive'
                        }
                        className="ml-2 text-xs shrink-0"
                      >
                        {Math.round((query.confidence_score || 0) * 100)}%
                      </Badge>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma consulta realizada</p>
                <p className="text-sm mt-2">Ative a Base de Conhecimento no Copiloto do chat.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Low Confidence Queries - Alert Section */}
      {lowConfidenceQueries && lowConfidenceQueries.length > 0 && (
        <Card className="border-amber-500/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="h-4 w-4" />
              Consultas com Baixa Confiança
            </CardTitle>
            <CardDescription>
              Perguntas que a IA teve dificuldade em responder - considere adicionar mais conteúdo
              sobre estes tópicos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[200px]">
              <div className="space-y-2">
                {lowConfidenceQueries.map((query, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 rounded-md bg-amber-50 dark:bg-amber-950/20"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{query.query}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(query.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <Badge variant="destructive" className="ml-2 text-xs shrink-0">
                      {Math.round((query.confidence_score || 0) * 100)}%
                    </Badge>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
