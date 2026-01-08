import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { MainLayout } from '@/components/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  Copy,
  ExternalLink,
  BarChart3,
  Settings,
  Sparkles,
  FileText,
  Globe
} from 'lucide-react';
import { useCompany } from '@/contexts/CompanyContext';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface LandingPage {
  id: string;
  name: string;
  slug: string;
  description: string;
  status: 'draft' | 'published' | 'archived';
  views_count: number;
  submissions_count: number;
  conversion_rate: number;
  created_at: string;
  published_at: string | null;
  ai_provider: string | null;
}

export default function LandingPages() {
  const navigate = useNavigate();
  const { currentCompany } = useCompany();
  const [landingPages, setLandingPages] = useState<LandingPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    loadLandingPages();
  }, [currentCompany]);

  const loadLandingPages = async () => {
    if (!currentCompany?.id) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('landing_pages')
        .select('*')
        .eq('company_id', currentCompany.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLandingPages(data || []);
    } catch (error: any) {
      console.error('Error loading landing pages:', error);
      toast.error('Erro ao carregar landing pages');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta landing page?')) return;

    try {
      const { error } = await supabase
        .from('landing_pages')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Landing page excluída com sucesso');
      loadLandingPages();
    } catch (error: any) {
      console.error('Error deleting landing page:', error);
      toast.error('Erro ao excluir landing page');
    }
  };

  const handleDuplicate = async (page: LandingPage) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('landing_pages')
        .insert({
          company_id: currentCompany?.id,
          name: `${page.name} (Cópia)`,
          slug: `${page.slug}-copy-${Date.now()}`,
          description: page.description,
          html_content: page.html_content,
          css_content: page.css_content,
          js_content: page.js_content,
          meta_tags: page.meta_tags,
          form_config: page.form_config,
          status: 'draft',
          created_by: user?.id
        });

      if (error) throw error;
      toast.success('Landing page duplicada com sucesso');
      loadLandingPages();
    } catch (error: any) {
      console.error('Error duplicating landing page:', error);
      toast.error('Erro ao duplicar landing page');
    }
  };

  const filteredPages = landingPages.filter((page) => {
    const matchesSearch =
      page.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      page.slug.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || page.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; className: string }> = {
      draft: { label: 'Rascunho', className: 'bg-gray-100 text-gray-800' },
      published: { label: 'Publicada', className: 'bg-green-100 text-green-800' },
      archived: { label: 'Arquivada', className: 'bg-orange-100 text-orange-800' }
    };
    const variant = variants[status] || variants.draft;
    return <Badge className={variant.className}>{variant.label}</Badge>;
  };

  return (
    <MainLayout>
      <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Landing Pages</h2>
          <p className="text-gray-500 mt-1">Crie páginas de conversão com IA</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => navigate('/marketing/landing-pages/ai-settings')}
          >
            <Settings className="h-4 w-4 mr-2" />
            Configurar IA
          </Button>
          <Button onClick={() => navigate('/marketing/landing-pages/create')}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Landing Page
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Páginas</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{landingPages.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Publicadas</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {landingPages.filter((p) => p.status === 'published').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Visualizações</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {landingPages.reduce((acc, p) => acc + p.views_count, 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Conversões</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {landingPages.reduce((acc, p) => acc + p.submissions_count, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por nome ou slug..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todos os Status</option>
              <option value="draft">Rascunho</option>
              <option value="published">Publicada</option>
              <option value="archived">Arquivada</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Landing Pages List */}
      {loading ? (
        <div className="flex items-center justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : filteredPages.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <Sparkles className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchTerm || filterStatus !== 'all'
                ? 'Nenhuma landing page encontrada'
                : 'Crie sua primeira Landing Page'}
            </h3>
            <p className="text-gray-500 mb-4 max-w-md">
              {searchTerm || filterStatus !== 'all'
                ? 'Tente ajustar os filtros de busca'
                : 'Use IA para criar landing pages profissionais em segundos'}
            </p>
            {!searchTerm && filterStatus === 'all' && (
              <Button onClick={() => navigate('/marketing/landing-pages/create')}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Landing Page
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredPages.map((page) => (
            <Card key={page.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{page.name}</h3>
                      {getStatusBadge(page.status)}
                      {page.ai_provider && (
                        <Badge className="bg-purple-100 text-purple-800">
                          <Sparkles className="h-3 w-3 mr-1" />
                          {page.ai_provider}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mb-3">{page.description}</p>
                    <div className="flex items-center gap-6 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        {page.views_count} visualizações
                      </span>
                      <span className="flex items-center gap-1">
                        <BarChart3 className="h-4 w-4" />
                        {page.submissions_count} conversões
                      </span>
                      {page.conversion_rate > 0 && (
                        <span className="text-green-600 font-medium">
                          {page.conversion_rate.toFixed(1)}% taxa de conversão
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                      Criada {formatDistanceToNow(new Date(page.created_at), { addSuffix: true, locale: ptBR })}
                    </p>
                  </div>

                  <div className="flex gap-2 ml-4">
                    {page.status === 'published' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(`/lp/${page.slug}`, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/marketing/landing-pages/${page.id}/preview`)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/marketing/landing-pages/${page.id}/edit`)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDuplicate(page)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(page.id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
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
      </div>
    </MainLayout>
  );
}
