import { lazy, Suspense } from 'react';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { CompanyProvider } from '@/contexts/CompanyContext';
import { InstallPrompt } from '@/components/pwa/InstallPrompt';
import { UpdatePrompt } from '@/components/mobile/UpdatePrompt';
import ErrorBoundary from '@/components/ErrorBoundary';
import { PageLoadingSkeleton } from '@/components/LoadingFallback';
import { RequireCompany } from '@/components/RequireCompany';
import Dashboard from './pages/Dashboard';
import { FeatureGate } from '@/components/auth/FeatureGate';

// Lazy load de páginas - carregadas apenas quando necessário
const Landing = lazy(() => import('./pages/Landing'));
const Pricing = lazy(() => import('./pages/Pricing'));
const Auth = lazy(() => import('./pages/Auth'));
const SignUp = lazy(() => import('./pages/SignUp'));
const Onboarding = lazy(() => import('./pages/Onboarding'));
const Chat = lazy(() => import('./pages/Chat'));

const CRM = lazy(() => import('./pages/CRM'));
const CRMDashboard = lazy(() => import('./pages/CRMDashboard'));
const Tasks = lazy(() => import('./pages/Tasks'));
const Agenda = lazy(() => import('./pages/Agenda'));
const Templates = lazy(() => import('@/pages/Templates'));
const Proposals = lazy(() => import('@/pages/Proposals'));
const ProposalTemplates = lazy(() => import('@/pages/ProposalTemplates'));
const Automation = lazy(() => import('@/pages/Automation'));
const Gamification = lazy(() => import('./pages/Gamification'));
const Companies = lazy(() => import('./pages/Companies'));
const NewSettings = lazy(() => import('./pages/NewSettings'));
const SuperAdmin = lazy(() => import('./pages/SuperAdmin'));
const Contacts = lazy(() => import('./pages/Contacts'));
const Duplicates = lazy(() => import('./pages/Duplicates'));
const Segments = lazy(() => import('./pages/Segments'));
const QueuesSettings = lazy(() => import('./pages/QueuesSettings'));
const Campaigns = lazy(() => import('./pages/Campaigns'));
const CampaignDetail = lazy(() => import('./pages/CampaignDetail'));
const PipelineSettings = lazy(() => import('./pages/PipelineSettings'));
const Products = lazy(() => import('./pages/Products'));
const Reports = lazy(() => import('./pages/Reports'));
const ReportsAtendimento = lazy(() => import('./pages/ReportsAtendimento'));
const TeamPerformancePage = lazy(() => import('./pages/reports/TeamPerformancePage'));
const UsersPage = lazy(() => import('./pages/settings/UsersPage'));
const AISettingsPage = lazy(() => import('./pages/settings/AISettingsPage'));
const SetPassword = lazy(() => import('./pages/SetPassword'));
const Groups = lazy(() => import('./pages/Groups'));
const InstanceSetup = lazy(() => import('./pages/InstanceSetup'));
const ProposalPublic = lazy(() =>
  import('@/pages/ProposalPublic').then((m) => ({ default: m.ProposalPublic }))
);
const Upgrade = lazy(() => import('./pages/Upgrade'));
const PilotoPro = lazy(() => import('./pages/PilotoProPage'));
const NotFound = lazy(() => import('./pages/NotFound'));
const FAQ = lazy(() => import('./pages/FAQ'));
const Documents = lazy(() => import('./pages/Documents'));
const APIDocumentation = lazy(() => import('./pages/APIDocumentation'));
const WebhooksSettings = lazy(() => import('./pages/WebhooksSettings'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const TermsOfService = lazy(() => import('./pages/TermsOfService'));
const KnowledgeBase = lazy(() => import('./pages/KnowledgeBase'));
const ChatbotsPage = lazy(() => import('./pages/ChatbotsPage'));
const ChatbotBuilder = lazy(() => import('./pages/ChatbotBuilder'));
const Cadences = lazy(() => import('./pages/Cadences'));
const Orders = lazy(() => import('./pages/Orders'));
const Integrations = lazy(() => import('./pages/Integrations'));
const Channels = lazy(() => import('./pages/Channels'));
const AIInsights = lazy(() => import('./pages/AIInsights'));
const Marketing = lazy(() => import('./pages/Marketing'));
const Biblioteca = lazy(() => import('./pages/Biblioteca'));
const IA = lazy(() => import('./pages/IA'));
const AIAgentsPage = lazy(() => import('./pages/AIAgentsPage'));
const Imobiliarias = lazy(() => import('./pages/Imobiliarias'));
const Concessionarias = lazy(() => import('./pages/Concessionarias'));
const Educacao = lazy(() => import('./pages/Educacao'));
const PoliticaPrivacidade = lazy(() => import('./pages/PoliticaPrivacidade'));
const TermosUso = lazy(() => import('./pages/TermosUso'));
const TestEmailConfig = lazy(() => import('./pages/TestEmailConfig'));
const AuthCallback = lazy(() => import('./pages/auth/AuthCallback'));
const GmailCallback = lazy(() => import('./pages/oauth/GmailCallback'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos
      gcTime: 10 * 60 * 1000, // 10 minutos (cache time)
      retry: 1, // Reduzir retries
      refetchOnWindowFocus: false, // Desabilitar refetch ao focar janela
      refetchOnMount: false,
      refetchOnReconnect: true,
    },
  },
});

const App = () => {
  return (
    <ErrorBoundary context="app-root">
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <CompanyProvider>
              <RequireCompany>
                <Toaster />
                <InstallPrompt />
                <UpdatePrompt />
                <Suspense fallback={<PageLoadingSkeleton />}>
                  <Routes>
                    <Route path="/" element={<Landing />} />
                    <Route path="/pricing" element={<Pricing />} />
                    <Route path="/educacao" element={<Educacao />} />
                    <Route path="/imobiliarias" element={<Imobiliarias />} />
                    <Route path="/concessionarias" element={<Concessionarias />} />
                    <Route path="/politica-privacidade" element={<PoliticaPrivacidade />} />
                    <Route path="/termos-uso" element={<TermosUso />} />
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/auth/callback" element={<AuthCallback />} />
                    <Route path="/oauth/gmail-callback" element={<GmailCallback />} />
                    <Route path="/signup" element={<SignUp />} />
                    <Route path="/onboarding" element={<Onboarding />} />
                    <Route path="/set-password" element={<SetPassword />} />
                    <Route path="/test-email-config" element={<TestEmailConfig />} />
                    <Route
                      path="/dashboard"
                      element={
                        <ErrorBoundary context="dashboard">
                          <Dashboard />
                        </ErrorBoundary>
                      }
                    />
                    {/* Update routes */}
                    <Route
                      path="/chat"
                      element={
                        <ErrorBoundary context="chat">
                          <FeatureGate feature="chat">
                            <Chat />
                          </FeatureGate>
                        </ErrorBoundary>
                      }
                    />
                    <Route
                      path="/groups"
                      element={
                        <ErrorBoundary context="groups">
                          <FeatureGate feature="groups">
                            <Groups />
                          </FeatureGate>
                        </ErrorBoundary>
                      }
                    />
                    <Route
                      path="/crm"
                      element={
                        <ErrorBoundary context="crm">
                          <FeatureGate feature="deals_pipeline">
                            <CRM />
                          </FeatureGate>
                        </ErrorBoundary>
                      }
                    />
                    <Route
                      path="/crm/dashboard"
                      element={
                        <FeatureGate feature="reports_sales">
                          <CRMDashboard />
                        </FeatureGate>
                      }
                    />
                    <Route
                      path="/tasks"
                      element={
                        <ErrorBoundary context="tasks">
                          <Tasks />
                        </ErrorBoundary>
                      }
                    />
                    <Route
                      path="/agenda"
                      element={
                        <ErrorBoundary context="agenda">
                          <Agenda />
                        </ErrorBoundary>
                      }
                    />
                    <Route path="/templates" element={<Templates />} />
                    <Route
                      path="/proposals"
                      element={
                        <FeatureGate feature="proposals">
                          <Proposals />
                        </FeatureGate>
                      }
                    />
                    <Route
                      path="/settings/proposal-templates"
                      element={
                        <FeatureGate feature="proposals">
                          <ProposalTemplates />
                        </FeatureGate>
                      }
                    />
                    <Route
                      path="/automation"
                      element={
                        <ErrorBoundary context="automation">
                          <FeatureGate feature="workflows">
                            <Automation />
                          </FeatureGate>
                        </ErrorBoundary>
                      }
                    />
                    <Route
                      path="/gamification"
                      element={
                        <FeatureGate feature="gamification">
                          <Gamification />
                        </FeatureGate>
                      }
                    />
                    <Route
                      path="/contacts"
                      element={
                        <ErrorBoundary context="contacts">
                          <FeatureGate feature="contacts">
                            <Contacts />
                          </FeatureGate>
                        </ErrorBoundary>
                      }
                    />
                    <Route
                      path="/duplicates"
                      element={
                        <FeatureGate feature="duplicates">
                          <Duplicates />
                        </FeatureGate>
                      }
                    />
                    <Route
                      path="/segments"
                      element={
                        <FeatureGate feature="segments">
                          <Segments />
                        </FeatureGate>
                      }
                    />
                    <Route
                      path="/settings/queues"
                      element={
                        <FeatureGate feature="queues">
                          <QueuesSettings />
                        </FeatureGate>
                      }
                    />
                    <Route
                      path="/settings/pipelines"
                      element={
                        <FeatureGate feature="deals_pipeline">
                          <PipelineSettings />
                        </FeatureGate>
                      }
                    />
                    <Route path="/settings/users" element={<UsersPage />} />
                    <Route path="/settings/ai" element={<AISettingsPage />} />
                    <Route
                      path="/configuracoes/ai"
                      element={<Navigate to="/settings/ai" replace />}
                    />
                    <Route
                      path="/configurações/ai"
                      element={<Navigate to="/settings/ai" replace />}
                    />
                    <Route
                      path="/products"
                      element={
                        <FeatureGate feature="products">
                          <Products />
                        </FeatureGate>
                      }
                    />
                    <Route
                      path="/reports"
                      element={
                        <ErrorBoundary context="reports">
                          <FeatureGate feature="reports_basic">
                            <Reports />
                          </FeatureGate>
                        </ErrorBoundary>
                      }
                    />
                    <Route
                      path="/reports/atendimento"
                      element={
                        <ErrorBoundary context="reports-atendimento">
                          <FeatureGate feature="reports_basic">
                            <ReportsAtendimento />
                          </FeatureGate>
                        </ErrorBoundary>
                      }
                    />
                    <Route
                      path="/reports/team"
                      element={
                        <FeatureGate feature="team_performance">
                          <TeamPerformancePage />
                        </FeatureGate>
                      }
                    />
                    <Route
                      path="/campaigns"
                      element={
                        <ErrorBoundary context="campaigns">
                          <FeatureGate feature="campaigns">
                            <Campaigns />
                          </FeatureGate>
                        </ErrorBoundary>
                      }
                    />
                    <Route
                      path="/campaigns/:id"
                      element={
                        <FeatureGate feature="campaigns">
                          <CampaignDetail />
                        </FeatureGate>
                      }
                    />
                    <Route
                      path="/marketing"
                      element={
                        <ErrorBoundary context="marketing">
                          <FeatureGate feature="marketing">
                            <Marketing />
                          </FeatureGate>
                        </ErrorBoundary>
                      }
                    />
                    <Route path="/biblioteca" element={<Biblioteca />} />
                    <Route path="/ia" element={<IA />} />
                    <Route path="/ia/agentes" element={<AIAgentsPage />} />
                    <Route path="/settings" element={<NewSettings />} />
                    <Route path="/instance-setup" element={<InstanceSetup />} />
                    <Route path="/companies" element={<Companies />} />
                    <Route path="/super-admin" element={<SuperAdmin />} />
                    <Route path="/upgrade" element={<Upgrade />} />
                    <Route path="/piloto-pro" element={<PilotoPro />} />
                    <Route path="/p/:slug" element={<ProposalPublic />} />
                    <Route
                      path="/faq"
                      element={
                        <FeatureGate feature="faq">
                          <FAQ />
                        </FeatureGate>
                      }
                    />
                    <Route
                      path="/documents"
                      element={
                        <FeatureGate feature="documents">
                          <Documents />
                        </FeatureGate>
                      }
                    />
                    <Route
                      path="/docs/api"
                      element={
                        <FeatureGate feature="api_public">
                          <APIDocumentation />
                        </FeatureGate>
                      }
                    />
                    <Route
                      path="/settings/webhooks"
                      element={
                        <FeatureGate feature="webhooks">
                          <WebhooksSettings />
                        </FeatureGate>
                      }
                    />
                    <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                    <Route path="/terms-of-service" element={<TermsOfService />} />
                    <Route
                      path="/knowledge-base"
                      element={
                        <FeatureGate feature="knowledge_base">
                          <KnowledgeBase />
                        </FeatureGate>
                      }
                    />
                    <Route
                      path="/chatbots"
                      element={
                        <FeatureGate feature="chatbots">
                          <ChatbotsPage />
                        </FeatureGate>
                      }
                    />
                    <Route
                      path="/chatbots/:id"
                      element={
                        <FeatureGate feature="chatbots">
                          <ChatbotBuilder />
                        </FeatureGate>
                      }
                    />
                    <Route
                      path="/cadences"
                      element={
                        <FeatureGate feature="cadences">
                          <Cadences />
                        </FeatureGate>
                      }
                    />
                    <Route
                      path="/orders"
                      element={
                        <FeatureGate feature="orders">
                          <Orders />
                        </FeatureGate>
                      }
                    />
                    <Route
                      path="/integrations"
                      element={
                        <FeatureGate feature="integrations">
                          <Integrations />
                        </FeatureGate>
                      }
                    />
                    <Route
                      path="/security"
                      element={<Navigate to="/settings?tab=security" replace />}
                    />
                    <Route
                      path="/channels"
                      element={
                        <FeatureGate feature="channels">
                          <Channels />
                        </FeatureGate>
                      }
                    />
                    <Route
                      path="/ai-insights"
                      element={
                        <ErrorBoundary context="ai-insights">
                          <AIInsights />
                        </ErrorBoundary>
                      }
                    />
                    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </RequireCompany>
            </CompanyProvider>
          </TooltipProvider>
        </QueryClientProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
};

export default App;
