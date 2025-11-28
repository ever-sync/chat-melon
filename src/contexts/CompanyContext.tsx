import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Json } from "@/integrations/supabase/types";

interface Company {
  id: string;
  name: string;
  cnpj: string | null;
  email: string | null;
  phone: string | null;
  is_active: boolean;
  logo_url?: string | null;
  business_status?: string | null;
  business_hours?: Json;
  subscription_status?: string | null;
  trial_started_at?: string | null;
  trial_ends_at?: string | null;
}

interface CompanyContextType {
  currentCompany: Company | null;
  companies: Company[];
  switchCompany: (companyId: string) => void;
  refreshCompanies: () => Promise<void>;
  loading: boolean;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export const useCompany = () => {
  const context = useContext(CompanyContext);
  if (!context) {
    throw new Error("useCompany must be used within CompanyProvider");
  }
  return context;
};

interface CompanyProviderProps {
  children: ReactNode;
}

export const CompanyProvider = ({ children }: CompanyProviderProps) => {
  const [currentCompany, setCurrentCompany] = useState<Company | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCompanies = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("companies")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setCompanies(data || []);

      // Set current company from localStorage or first available
      const savedCompanyId = localStorage.getItem("currentCompanyId");
      if (savedCompanyId && data) {
        const saved = data.find((c) => c.id === savedCompanyId);
        if (saved) {
          setCurrentCompany(saved);
        } else if (data.length > 0) {
          setCurrentCompany(data[0]);
          localStorage.setItem("currentCompanyId", data[0].id);
        }
      } else if (data && data.length > 0) {
        setCurrentCompany(data[0]);
        localStorage.setItem("currentCompanyId", data[0].id);
      }
    } catch (error: any) {
      console.error("Error fetching companies:", error);
      toast.error("Erro ao carregar empresas");
    } finally {
      setLoading(false);
    }
  };

  const switchCompany = (companyId: string) => {
    const company = companies.find((c) => c.id === companyId);
    if (company) {
      setCurrentCompany(company);
      localStorage.setItem("currentCompanyId", companyId);
      toast.success(`Empresa alterada para ${company.name}`);
      // Reload to refresh all data for the new company
      window.location.reload();
    }
  };

  const refreshCompanies = async () => {
    await fetchCompanies();
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  return (
    <CompanyContext.Provider
      value={{
        currentCompany,
        companies,
        switchCompany,
        refreshCompanies,
        loading,
      }}
    >
      {children}
    </CompanyContext.Provider>
  );
};