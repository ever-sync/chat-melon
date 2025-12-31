import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Trash2, AlertTriangle, Target, GitMerge, MessageSquareQuote } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function InstructionsTab() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personalidade e Objetivos */}
        <Card className="h-full">
            <CardHeader>
                <div className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-purple-600" />
                    <CardTitle>Objetivo & Personalidade</CardTitle>
                </div>
                <CardDescription>Defina quem é o agente e o que ele deve conquistar.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <Label>Objetivo Principal</Label>
                    <Textarea 
                        placeholder="Ex: Agendar uma reunião de demonstração com o lead qualificado."
                        className="h-20"
                    />
                </div>
                <div>
                    <Label>Tom de Voz</Label>
                    <Textarea 
                        placeholder="Ex: Profissional, mas acolhedor. Use emojis ocasionalmente. Seja direto e evite jargões técnicos."
                        className="h-20"
                    />
                </div> 
            </CardContent>
        </Card>

        {/* Regras Negativas */}
        <Card className="h-full border-red-100 dark:border-red-900/20">
            <CardHeader>
                <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    <CardTitle>Regras Negativas (Não faça)</CardTitle>
                </div>
                <CardDescription>Instruções explícitas do que é proibido.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex gap-2">
                    <Input placeholder="Ex: Não mencione preços de concorrentes" />
                    <Button variant="secondary">Adicionar</Button>
                </div>
                <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 bg-red-50 dark:bg-red-900/10 rounded border border-red-100 dark:border-red-900/20">
                        <span className="text-sm text-red-800 dark:text-red-300">Não inventar funcionalidades que não existem</span>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500 hover:text-red-700">
                            <Trash2 className="h-3 w-3" />
                        </Button>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-red-50 dark:bg-red-900/10 rounded border border-red-100 dark:border-red-900/20">
                        <span className="text-sm text-red-800 dark:text-red-300">Não pedir cartão de crédito no chat</span>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500 hover:text-red-700">
                            <Trash2 className="h-3 w-3" />
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
      </div>

      {/* Fluxo de Conversa */}
      <Card>
        <CardHeader>
            <div className="flex items-center gap-2">
                <GitMerge className="h-5 w-5 text-blue-600" />
                <CardTitle>Fluxo de Conversa Ideal</CardTitle>
            </div>
            <CardDescription>Etapas que o agente deve tentar seguir durante o atendimento.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="space-y-4">
                 <div className="flex items-center gap-4">
                    <Badge variant="outline" className="h-8 w-8 rounded-full flex items-center justify-center border-2 border-blue-600 text-blue-600 font-bold shrink-0">1</Badge>
                    <Input defaultValue="Saudação e identificação da necessidade inicial" />
                    <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-muted-foreground" /></Button>
                 </div>
                 <div className="flex justify-center">
                    <div className="h-4 w-0.5 bg-gray-200 dark:bg-gray-800" />
                 </div>
                 <div className="flex items-center gap-4">
                    <Badge variant="outline" className="h-8 w-8 rounded-full flex items-center justify-center border-2 border-blue-600 text-blue-600 font-bold shrink-0">2</Badge>
                    <Input defaultValue="Qualificação (Perguntar tamanho da empresa e cargo)" />
                    <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-muted-foreground" /></Button>
                 </div>
                 <div className="flex justify-center">
                    <div className="h-4 w-0.5 bg-gray-200 dark:bg-gray-800" />
                 </div>
                 <div className="flex items-center gap-4">
                    <Badge variant="outline" className="h-8 w-8 rounded-full flex items-center justify-center border-2 border-blue-600 text-blue-600 font-bold shrink-0">3</Badge>
                    <Input defaultValue="Apresentação da solução baseada na dor do cliente" />
                    <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-muted-foreground" /></Button>
                 </div>
                 <div className="flex justify-center">
                    <Button variant="ghost" size="sm" className="rounded-full h-8 w-8 p-0 border border-dashed border-gray-300">
                        <Plus className="h-4 w-4 text-gray-500" />
                    </Button>
                 </div>
            </div>
        </CardContent>
      </Card>

      {/* Exemplos (Few-Shot) */}
      <Card>
        <CardHeader>
            <div className="flex items-center gap-2">
                <MessageSquareQuote className="h-5 w-5 text-green-600" />
                <CardTitle>Exemplos de Conversa (Few-Shot)</CardTitle>
            </div>
            <CardDescription>
                Ensine pelo exemplo. Mostre pares de pergunta/resposta ideais para calibrar o estilo da IA.
            </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border">
                <div className="space-y-2">
                    <Label className="text-xs uppercase text-muted-foreground font-semibold">Usuário diz:</Label>
                    <div className="bg-white dark:bg-gray-800 p-3 rounded-md text-sm shadow-sm border">
                        "É muito caro, não tenho orçamento."
                    </div>
                </div>
                <div className="space-y-2">
                    <Label className="text-xs uppercase text-muted-foreground font-semibold">Agente responde:</Label>
                     <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-md text-sm shadow-sm border border-green-100 dark:border-green-900/30">
                        "Entendo perfeitamente. O investimento pode parecer alto inicialmente, mas considerando a economia de tempo de 30% que nossos clientes têm, o retorno acontece em 2 meses. Gostaria de ver uma planilha de ROI?"
                    </div>
                </div>
                <div className="md:col-span-2 flex justify-end">
                     <Button variant="ghost" size="sm" className="text-red-500 text-xs">Remover Exemplo</Button>
                </div>
            </div>

            <Button variant="outline" className="w-full border-dashed">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Novo Exemplo
            </Button>
        </CardContent>
      </Card>
    </div>
  );
}
