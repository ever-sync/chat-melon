import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { MainLayout } from '@/components/MainLayout';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit, ExternalLink, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { useCompany } from '@/contexts/CompanyContext';

interface LandingPage {
  id: string;
  name: string;
  slug: string;
  description: string;
  html_content: string;
  status: string;
  ai_provider: string | null;
  created_at: string;
}

export default function PreviewLandingPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentCompany } = useCompany();
  const [landingPage, setLandingPage] = useState<LandingPage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLandingPage();
  }, [id, currentCompany]);

  const loadLandingPage = async () => {
    if (!id || !currentCompany?.id) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('landing_pages')
        .select('*')
        .eq('id', id)
        .eq('company_id', currentCompany.id)
        .single();

      if (error) throw error;
      setLandingPage(data);
    } catch (error: any) {
      console.error('Error loading landing page:', error);
      toast.error('Erro ao carregar landing page');
      navigate('/marketing/landing-pages');
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!landingPage) return;

    try {
      const { error } = await supabase
        .from('landing_pages')
        .update({
          status: 'published',
          published_at: new Date().toISOString()
        })
        .eq('id', landingPage.id);

      if (error) throw error;

      toast.success('Landing page publicada com sucesso!');
      loadLandingPage();
    } catch (error: any) {
      console.error('Error publishing landing page:', error);
      toast.error('Erro ao publicar landing page');
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </MainLayout>
    );
  }

  if (!landingPage) {
    return (
      <MainLayout>
        <div className="text-center p-12">
          <p className="text-gray-500">Landing page não encontrada</p>
          <Button onClick={() => navigate('/marketing/landing-pages')} className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/marketing/landing-pages')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{landingPage.name}</h2>
              <p className="text-gray-500 text-sm mt-1">Preview da Landing Page</p>
            </div>
          </div>

          <div className="flex gap-2">
            {landingPage.status === 'published' && (
              <Button
                variant="outline"
                onClick={() => window.open(`/lp/${landingPage.slug}`, '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Ver Publicada
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => navigate(`/marketing/landing-pages/${landingPage.id}/edit`)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
            {landingPage.status !== 'published' && (
              <Button onClick={handlePublish}>
                <Eye className="h-4 w-4 mr-2" />
                Publicar
              </Button>
            )}
          </div>
        </div>

        {/* Preview Frame */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="mb-4 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Status: <span className="font-medium text-gray-900">{landingPage.status}</span>
            </div>
            {landingPage.ai_provider && (
              <div className="text-sm text-gray-500">
                Gerado com: <span className="font-medium text-purple-600">{landingPage.ai_provider}</span>
              </div>
            )}
          </div>

          {/* iframe Preview */}
          <div className="border border-gray-300 rounded-lg overflow-hidden">
            <iframe
              srcDoc={landingPage.html_content}
              className="w-full"
              style={{ height: '600px', border: 'none' }}
              title="Landing Page Preview"
              sandbox="allow-scripts"
            />
          </div>

          {/* Mobile Preview */}
          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Preview Mobile</h3>
            <div className="flex justify-center bg-gray-100 p-4 rounded-lg">
              <div className="border-4 border-gray-800 rounded-[2rem] overflow-hidden" style={{ width: '375px' }}>
                <iframe
                  srcDoc={landingPage.html_content}
                  className="w-full"
                  style={{ height: '667px', border: 'none' }}
                  title="Mobile Preview"
                  sandbox="allow-scripts"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
