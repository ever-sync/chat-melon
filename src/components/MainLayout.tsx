import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Header } from '@/components/Header';
import { TrialBanner } from '@/components/TrialBanner';
import { MobileBottomNav } from '@/components/mobile/MobileBottomNav';
import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useIsMobile } from '@/hooks/ui/use-mobile';

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout = ({ children }: MainLayoutProps) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const isMobile = useIsMobile();
  const location = useLocation();
  const isFullHeightPage = location.pathname === '/chat';

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
      } else {
        setLoading(false);
      }
    };

    checkAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate('/auth');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full overflow-hidden bg-[#111111]">
        {!isMobile && <AppSidebar />}

        <div className="flex flex-1 flex-col overflow-hidden h-screen p-2 pl-0">
          <div className="flex-1 flex flex-col bg-[#F3F4F6] rounded-[32px] overflow-hidden shadow-2xl relative">
            {!isMobile && <Header />}
            <TrialBanner />
            <main
              className={
                isMobile
                  ? 'flex-1 overflow-auto'
                  : isFullHeightPage
                    ? 'flex-1 overflow-auto'
                    : 'flex-1 p-6 overflow-auto'
              }
            >
              {children}
            </main>
          </div>
        </div>
      </div>
      {isMobile && <MobileBottomNav />}
    </SidebarProvider>
  );
};
