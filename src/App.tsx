import { lazy, Suspense } from 'react';
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { CompanyProvider } from "@/contexts/CompanyContext";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { UpdatePrompt } from "@/components/mobile/UpdatePrompt";
import ErrorBoundary from "@/components/ErrorBoundary";
import { PageLoadingSkeleton } from "@/components/LoadingFallback";
import { RequireCompany } from "@/components/RequireCompany";

// Lazy load de páginas - carregadas apenas quando necessário
const Landing = lazy(() => import("./pages/Landing"));
const Pricing = lazy(() => import("./pages/Pricing"));
const Auth = lazy(() => import("./pages/Auth"));
const SignUp = lazy(() => import("./pages/SignUp"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const Chat = lazy(() => import("./pages/Chat"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const CRM = lazy(() => import("./pages/CRM"));
const Tasks = lazy(() => import("./pages/Tasks"));
const Templates = lazy(() => import("@/pages/Templates"));
const Proposals = lazy(() => import("@/pages/Proposals"));
const ProposalTemplates = lazy(() => import("@/pages/ProposalTemplates"));
const Automation = lazy(() => import("@/pages/Automation"));
const Gamification = lazy(() => import("./pages/Gamification"));
const Companies = lazy(() => import("./pages/Companies"));
const NewSettings = lazy(() => import("./pages/NewSettings"));
const SuperAdmin = lazy(() => import("./pages/SuperAdmin"));
const Contacts = lazy(() => import("./pages/Contacts"));
const Duplicates = lazy(() => import("./pages/Duplicates"));
const Segments = lazy(() => import("./pages/Segments"));
const QueuesSettings = lazy(() => import("./pages/QueuesSettings"));
const Campaigns = lazy(() => import("./pages/Campaigns"));
const CampaignDetail = lazy(() => import("./pages/CampaignDetail"));
const PipelineSettings = lazy(() => import("./pages/PipelineSettings"));
const Products = lazy(() => import("./pages/Products"));
const Reports = lazy(() => import("./pages/Reports"));
const TeamPerformancePage = lazy(() => import("./pages/reports/TeamPerformancePage"));
const UsersPage = lazy(() => import("./pages/settings/UsersPage"));
const AISettingsPage = lazy(() => import("./pages/settings/AISettingsPage"));
const SetPassword = lazy(() => import("./pages/SetPassword"));
const Groups = lazy(() => import("./pages/Groups"));
const InstanceSetup = lazy(() => import("./pages/InstanceSetup"));
const ProposalPublic = lazy(() => import("@/pages/ProposalPublic").then(m => ({ default: m.ProposalPublic })));
const Upgrade = lazy(() => import("./pages/Upgrade"));
const PilotoPro = lazy(() => import("./pages/PilotoProPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

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
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/signup" element={<SignUp />} />
                    <Route path="/onboarding" element={<Onboarding />} />
                    <Route path="/set-password" element={<SetPassword />} />
                    <Route path="/dashboard" element={<ErrorBoundary context="dashboard"><Dashboard /></ErrorBoundary>} />
                    <Route path="/chat" element={<ErrorBoundary context="chat"><Chat /></ErrorBoundary>} />
                    <Route path="/groups" element={<ErrorBoundary context="groups"><Groups /></ErrorBoundary>} />
                    <Route path="/crm" element={<ErrorBoundary context="crm"><CRM /></ErrorBoundary>} />
                    <Route path="/tasks" element={<ErrorBoundary context="tasks"><Tasks /></ErrorBoundary>} />
                    <Route path="/templates" element={<Templates />} />
                    <Route path="/proposals" element={<Proposals />} />
                    <Route path="/settings/proposal-templates" element={<ProposalTemplates />} />
                    <Route path="/automation" element={<ErrorBoundary context="automation"><Automation /></ErrorBoundary>} />
                    <Route path="/gamification" element={<Gamification />} />
                    <Route path="/contacts" element={<ErrorBoundary context="contacts"><Contacts /></ErrorBoundary>} />
                    <Route path="/duplicates" element={<Duplicates />} />
                    <Route path="/segments" element={<Segments />} />
                    <Route path="/settings/queues" element={<QueuesSettings />} />
                    <Route path="/settings/pipelines" element={<PipelineSettings />} />
                    <Route path="/settings/users" element={<UsersPage />} />
                    <Route path="/settings/ai" element={<AISettingsPage />} />
                    <Route path="/configuracoes/ai" element={<Navigate to="/settings/ai" replace />} />
                    <Route path="/configurações/ai" element={<Navigate to="/settings/ai" replace />} />
                    <Route path="/products" element={<Products />} />
                    <Route path="/reports" element={<ErrorBoundary context="reports"><Reports /></ErrorBoundary>} />
                    <Route path="/reports/team" element={<TeamPerformancePage />} />
                    <Route path="/campaigns" element={<ErrorBoundary context="campaigns"><Campaigns /></ErrorBoundary>} />
                    <Route path="/campaigns/:id" element={<CampaignDetail />} />
                    <Route path="/settings" element={<NewSettings />} />
                    <Route path="/instance-setup" element={<InstanceSetup />} />
                    <Route path="/companies" element={<Companies />} />
                    <Route path="/super-admin" element={<SuperAdmin />} />
                    <Route path="/upgrade" element={<Upgrade />} />
                    <Route path="/piloto-pro" element={<PilotoPro />} />
                    <Route path="/p/:slug" element={<ProposalPublic />} />
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
