import { MainLayout } from '@/components/MainLayout';
import { TemplatesManager } from '@/components/chat/TemplatesManager';
import { ProposalTemplatesManager } from '@/components/chat/ProposalTemplatesManager';
import { VariablesManager } from '@/components/settings/VariablesManager';
import { EmailTemplatesManager } from '@/components/email/EmailTemplatesManager';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  FileText,
  MessageSquare,
  Sliders,
  Sparkles,
  Type,
  Layout,
  Mail
} from 'lucide-react';

export default function Templates() {
  return (
    <MainLayout>
      <div className="space-y-8 p-6">
        {/* Header Section */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 backdrop-blur-sm">
                <Layout className="h-7 w-7 text-indigo-600" />
              </div>
              <div>
                <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  Central de Templates
                </h1>
                <p className="text-gray-500 mt-1 text-base">
                  Crie e gerencie seus modelos reutilizáveis em um só lugar
                </p>
              </div>
            </div>
          </div>
        </div>

        <Tabs defaultValue="messages" className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8">
          {/* Sidebar Navigation */}
          <div className="space-y-4">
            <TabsList className="flex flex-col h-auto bg-white rounded-3xl shadow-sm border border-gray-100 p-3 space-y-1.5">
              <div className="w-full px-3 py-2 text-left">
                <p className="text-[10px] font-bold text-indigo-900/40 uppercase tracking-widest">
                  Modelos de Escrita
                </p>
              </div>

              <TabsTrigger
                value="messages"
                className="w-full justify-start gap-3 px-4 py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-2xl transition-all duration-300 hover:scale-[1.02] hover:bg-gray-50 flex items-center"
              >
                <div className="p-1 rounded-lg bg-indigo-50/50 group-data-[state=active]:bg-white/20">
                  <MessageSquare className="h-4 w-4" />
                </div>
                <span className="font-semibold text-sm">Respostas do Chat</span>
              </TabsTrigger>

              <TabsTrigger
                value="proposals"
                className="w-full justify-start gap-3 px-4 py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-2xl transition-all duration-300 hover:scale-[1.02] hover:bg-gray-50 flex items-center"
              >
                <div className="p-1 rounded-lg bg-emerald-50/50 group-data-[state=active]:bg-white/20">
                  <FileText className="h-4 w-4" />
                </div>
                <span className="font-semibold text-sm">Propostas PDF/Web</span>
              </TabsTrigger>

              <TabsTrigger
                value="emails"
                className="w-full justify-start gap-3 px-4 py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-rose-500 data-[state=active]:to-pink-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-2xl transition-all duration-300 hover:scale-[1.02] hover:bg-gray-50 flex items-center"
              >
                <div className="p-1 rounded-lg bg-rose-50/50 group-data-[state=active]:bg-white/20">
                  <Mail className="h-4 w-4" />
                </div>
                <span className="font-semibold text-sm">Templates de Email</span>
              </TabsTrigger>

              <Separator className="my-2 bg-gray-50" />

              <div className="w-full px-3 py-2 text-left">
                <p className="text-[10px] font-bold text-indigo-900/40 uppercase tracking-widest">
                  Elementos Dinâmicos
                </p>
              </div>

              <TabsTrigger
                value="variables"
                className="w-full justify-start gap-3 px-4 py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-2xl transition-all duration-300 hover:scale-[1.02] hover:bg-gray-50 flex items-center"
              >
                <div className="p-1 rounded-lg bg-indigo-50/50 group-data-[state=active]:bg-white/20">
                  <Type className="h-4 w-4" />
                </div>
                <span className="font-semibold text-sm">Variáveis Globais</span>
              </TabsTrigger>

              <div className="mt-8 p-4 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100/50 relative overflow-hidden group">
                <Sparkles className="absolute -right-2 -bottom-2 h-12 w-12 text-indigo-600/10 group-hover:scale-110 transition-transform" />
                <p className="text-xs font-bold text-indigo-900/70 mb-1">Dica de Produtividade</p>
                <p className="text-[10px] text-gray-500 leading-relaxed italic">
                  "Use Variáveis Globais para manter dados como preços, endereços e links sempre atualizados em todos os seus templates."
                </p>
              </div>
            </TabsList>
          </div>

          {/* Content Area */}
          <div className="space-y-6 min-h-[600px]">
            <TabsContent value="messages" className="m-0 focus-visible:outline-none animate-in fade-in slide-in-from-bottom-2 duration-300">
              <TemplatesManager />
            </TabsContent>

            <TabsContent value="proposals" className="m-0 focus-visible:outline-none animate-in fade-in slide-in-from-bottom-2 duration-300">
              <ProposalTemplatesManager />
            </TabsContent>

            <TabsContent value="emails" className="m-0 focus-visible:outline-none animate-in fade-in slide-in-from-bottom-2 duration-300">
              <EmailTemplatesManager />
            </TabsContent>

            <TabsContent value="variables" className="m-0 focus-visible:outline-none animate-in fade-in slide-in-from-bottom-2 duration-300">
              <VariablesManager />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </MainLayout>
  );
}
