import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { OnboardingGuide } from "./onboarding/OnboardingGuide";
import { PageLoadingSkeleton } from "./LoadingFallback";

interface RequireCompanyProps {
  children: React.ReactNode;
}

export function RequireCompany({ children }: RequireCompanyProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkCompany();
  }, [location.pathname]);

  const checkCompany = async () => {
    try {
      // Check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }

      setIsAuthenticated(true);

      // Check if user has a company
      const { data: companyUsers, error } = await supabase
        .from("company_users")
        .select("company_id, companies(id, name, is_active)")
        .eq("user_id", user.id)
        .eq("is_default", true)
        .maybeSingle();

      if (error && error.code !== "PGRST116") throw error;

      // If no company, show onboarding
      if (!companyUsers) {
        setShowOnboarding(true);
        setLoading(false);
        return;
      }

      // User has a company, allow access
      setShowOnboarding(false);
      setLoading(false);
    } catch (error) {
      console.error("Error checking company:", error);
      setLoading(false);
    }
  };

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    // Refresh the page to load company data
    window.location.reload();
  };

  if (loading) {
    return <PageLoadingSkeleton />;
  }

  if (!isAuthenticated) {
    // User not authenticated, let them see public pages
    return <>{children}</>;
  }

  // Protected pages that require company
  const protectedPaths = [
    "/dashboard",
    "/chat",
    "/crm",
    "/tasks",
    "/templates",
    "/proposals",
    "/automation",
    "/gamification",
    "/contacts",
    "/duplicates",
    "/segments",
    "/settings",
    "/campaigns",
    "/products",
    "/reports",
    "/groups",
  ];

  const isProtectedPath = protectedPaths.some((path) =>
    location.pathname.startsWith(path)
  );

  if (isProtectedPath && showOnboarding) {
    return (
      <OnboardingGuide isOpen={showOnboarding} onComplete={handleOnboardingComplete} />
    );
  }

  return <>{children}</>;
}
