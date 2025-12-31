import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { FileText, Globe, MessageSquare, Upload, Plus, Trash2, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function KnowledgeBaseTab() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Base de Conhecimento (RAG)</CardTitle>
          <CardDescription>
            Ensine seu agente com documentos, links e perguntas frequentes. 
            Ele usará essas informações para responder com precisão.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="files" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="files" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Arquivos
              </TabsTrigger>
              <TabsTrigger value="urls" className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Sites & Links
              </TabsTrigger>
              <TabsTrigger value="faq" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                FAQ Manual
              </TabsTrigger>
            </TabsList>

            <TabsContent value="files" className="space-y-4">
              <div className="border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-lg p-8 flex flex-col items-center justify-center text-center hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors cursor-pointer">
                <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-full mb-3">
                  <Upload className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="font-semibold text-lg mb-1">Upload de Arquivos</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Arraste e solte ou clique para selecionar PDFs, DOCX ou TXT
                </p>
                <Button variant="outline">Selecionar Arquivos</Button>
              </div>

              <div className="space-y-3 mt-6">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Arquivos Processados
                </h4>
                {/* Mock List */}
                <div className="flex items-center justify-between p-3 border rounded-lg bg-card">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <FileText className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Política de Privacidade.pdf</p>
                      <p className="text-xs text-muted-foreground">1.2 MB • Processado há 2 dias</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600 hover:bg-red-50">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg bg-card">
                  <div className="flex items-center gap-3">
                     <div className="p-2 bg-blue-100 rounded-lg">
                      <FileText className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Manual do Produto V2.docx</p>
                      <p className="text-xs text-muted-foreground">850 KB • Processado hoje</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600 hover:bg-red-50">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="urls" className="space-y-4">
              <div className="flex gap-2">
                <Input placeholder="https://suaempresa.com.br/sobre" />
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                O robô irá ler o conteúdo da página e adicionar à base de conhecimento.
              </p>

              <div className="space-y-3 mt-6">
                 <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Links Ativos
                </h4>
                <div className="flex items-center justify-between p-3 border rounded-lg bg-card">
                  <div className="flex items-center gap-3">
                     <div className="p-2 bg-green-100 rounded-lg">
                      <Globe className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">https://melonchat.com.br/precos</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-[10px] bg-green-100 text-green-700 hover:bg-green-100">Sincronizado</Badge>
                        <span className="text-xs text-muted-foreground">Última atualização: 10 min atrás</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon">
                        <RefreshCw className="h-4 w-4 text-muted-foreground" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600 hover:bg-red-50">
                        <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="faq" className="space-y-4">
               <div className="flex justify-between items-center mb-4">
                 <p className="text-sm text-muted-foreground">Adicione perguntas e respostas específicas que o agente deve memorizar.</p>
                 <Button variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Pergunta
                 </Button>
               </div>

               <div className="space-y-4">
                  <div className="border rounded-lg p-4 space-y-3">
                    <div className="space-y-1">
                        <Label>Pergunta</Label>
                        <Input defaultValue="Qual o horário de funcionamento?" />
                    </div>
                    <div className="space-y-1">
                        <Label>Resposta</Label>
                        <Textarea defaultValue="Nosso horário de funcionamento é de segunda a sexta, das 08h às 18h." />
                    </div>
                    <div className="flex justify-end">
                        <Button variant="ghost" size="sm" className="text-red-500 text-xs h-8">Remover</Button>
                    </div>
                  </div>

                  <div className="border rounded-lg p-4 space-y-3">
                    <div className="space-y-1">
                        <Label>Pergunta</Label>
                        <Input defaultValue="Vocês entregam em todo Brasil?" />
                    </div>
                    <div className="space-y-1">
                        <Label>Resposta</Label>
                        <Textarea defaultValue="Sim, realizamos entregas em todo o território nacional via Transportadora X e Y." />
                    </div>
                    <div className="flex justify-end">
                        <Button variant="ghost" size="sm" className="text-red-500 text-xs h-8">Remover</Button>
                    </div>
                  </div>
               </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      <div className="flex justify-end">
        <Button>
            <RefreshCw className="h-4 w-4 mr-2" />
            Salvar e Treinar Base
        </Button>
      </div>
    </div>
  );
}
