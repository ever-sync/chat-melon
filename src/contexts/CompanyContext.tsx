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
  subscription_id?: string | null;
  plan_id?: string | null;
  trial_started_at?: string | null;
  trial_ends_at?: string | null;
  evolution_api_url?: string | null;
  evolution_api_key?: string | null;
  evolution_instance_name?: string | null;
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
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("companies")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Buscar evolution_settings para cada empresa e mesclar o instance_name
      const companiesWithSettings = await Promise.all(
        (data || []).map(async (company) => {
          const { data: evolutionSettings } = await supabase
            .from("evolution_settings")
            .select("instance_name")
            .eq("company_id", company.id)
            .single();

          return {
            ...company,
            evolution_instance_name: evolutionSettings?.instance_name || company.evolution_instance_name
          };
        })
      );

      setCompanies(companiesWithSettings);

      // Selecionar empresa automaticamente ao logar
      // 1. Primeiro verifica se há empresa salva no localStorage
      // 2. Se não houver ou não for válida, seleciona a primeira empresa disponível
      const savedCompanyId = localStorage.getItem("currentCompanyId");

      if (companiesWithSettings && companiesWithSettings.length > 0) {
        let selectedCompany: Company | undefined;

        // Tenta usar a empresa salva no localStorage
        if (savedCompanyId) {
          selectedCompany = companiesWithSettings.find((c) => c.id === savedCompanyId);
        }

        // Se não encontrou, seleciona a primeira empresa
        if (!selectedCompany) {
          selectedCompany = companiesWithSettings[0];
          console.log("🏢 Selecionando empresa automaticamente:", selectedCompany.name);
        }

        setCurrentCompany(selectedCompany);
        localStorage.setItem("currentCompanyId", selectedCompany.id);
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
    // Carregar empresas na montagem inicial
    fetchCompanies();

    // Escutar mudanças de autenticação para recarregar empresas quando usuário logar
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        // Usuário acabou de logar - recarregar empresas
        console.log("🔐 Login detectado - carregando empresas...");
        fetchCompanies();
      } else if (event === "SIGNED_OUT") {
        // Usuário deslogou - limpar estado
        setCurrentCompany(null);
        setCompanies([]);
        localStorage.removeItem("currentCompanyId");
      }
    });

    return () => subscription.unsubscribe();
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