import { useState } from 'react';
import { MainLayout } from '@/components/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DocumentList } from '@/components/kb/DocumentList';
import { DocumentEditor } from '@/components/kb/DocumentEditor';
import { SemanticSearch } from '@/components/kb/SemanticSearch';
import { KBSettings } from '@/components/kb/KBSettings';
import { KBAnalytics } from '@/components/kb/KBAnalytics';
import { BookOpen, Search, Settings, BarChart3, Upload } from 'lucide-react';

export default function KnowledgeBase() {
  const [activeTab, setActiveTab] = useState('documents');
  const [editingDocId, setEditingDocId] = useState<string | null>(null);

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-primary" />
            </div>
            <span className="text-2xl font-bold text-foreground">Knowledge Base</span>
          </div>
          <div className="h-10 w-px bg-border mx-2"></div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Base de Conhecimento</h1>
            <p className="text-muted-foreground">
              Gerencie documentos e permita que a IA responda com contexto da empresa
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto">
            <TabsTrigger value="documents" className="gap-2">
              <BookOpen className="w-4 h-4" />
              Documentos
            </TabsTrigger>
            <TabsTrigger value="upload" className="gap-2">
              <Upload className="w-4 h-4" />
              Adicionar
            </TabsTrigger>
            <TabsTrigger value="search" className="gap-2">
              <Search className="w-4 h-4" />
              Buscar
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="w-4 h-4" />
              Configurações
            </TabsTrigger>
          </TabsList>

          <TabsContent value="documents" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Documentos da Base de Conhecimento</CardTitle>
                <CardDescription>
                  Gerencie os documentos que alimentam as respostas da IA
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DocumentList
                  onEdit={(docId) => {
                    setEditingDocId(docId);
                    setActiveTab('upload');
                  }}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="upload" className="space-y-4">
            <DocumentEditor
              documentId={editingDocId}
              onSaved={() => {
                setEditingDocId(null);
                setActiveTab('documents');
              }}
              onCancel={() => {
                setEditingDocId(null);
                setActiveTab('documents');
              }}
            />
          </TabsContent>

          <TabsContent value="search" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Busca Semântica</CardTitle>
                <CardDescription>Teste a busca semântica na base de conhecimento</CardDescription>
              </CardHeader>
              <CardContent>
                <SemanticSearch />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <KBAnalytics />
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <KBSettings />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
