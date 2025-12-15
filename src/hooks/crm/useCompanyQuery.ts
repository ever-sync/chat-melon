import { useCompany } from "@/contexts/CompanyContext";

/**
 * Hook para garantir que todas as queries filtrem por company_id
 * CRÍTICO: Nunca fazer queries sem filtrar por empresa!
 */
export const useCompanyQuery = () => {
  const { currentCompany } = useCompany();

  /**
   * Adiciona filtro de company_id a uma query do Supabase
   * Lança erro se não houver empresa selecionada
   */
  const withCompanyFilter = (query: any) => {
    if (!currentCompany?.id) {
      throw new Error("Nenhuma empresa selecionada. Impossível executar query.");
    }
    return query.eq("company_id", currentCompany.id);
  };

  /**
   * Helper para queries que precisam inserir dados com company_id
   */
  const getCompanyId = (): string => {
    if (!currentCompany?.id) {
      throw new Error("Nenhuma empresa selecionada.");
    }
    return currentCompany.id;
  };

  return {
    companyId: currentCompany?.id,
    withCompanyFilter,
    getCompanyId,
  };
};
