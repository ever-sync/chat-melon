import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/CompanyContext";

export type FeatureKey =
  | "chat"
  | "quick_replies"
  | "queues"
  | "products"
  | "contacts"
  | "deals_pipeline"
  | "custom_fields"
  | "proposals"
  | "faq"
  | "workflows"
  | "campaigns"
  | "chatbot"
  | "reports_basic"
  | "reports_advanced"
  | "team_performance"
  | "api_public"
  | "webhooks"
  | "multi_company"
  | "white_label"
  | "gamification"
  | "groups"
  | "automation"
  | "segments"
  | "duplicates"
  | "ai_assistant"
  | "documents"
  | "knowledge_base"
  | "chatbots"
  | "cadences"
  | "orders"
  | "integrations"
  | "security"
  | "channels"
  | "reports_sales";


interface PlatformFeature {
  id: string;
  feature_key: FeatureKey;
  name: string;
  description: string | null;
  category: string;
  is_global_enabled: boolean;
  icon: string | null;
  order_index: number;
}

export const useFeatureFlags = () => {
  const { currentCompany } = useCompany();

  const { data: features = [], isLoading } = useQuery({
    queryKey: ["feature-flags", currentCompany?.id, currentCompany?.plan_id],
    queryFn: async () => {
      // 1. Buscar todas as features globalmente habilitadas
      const { data: allFeatures, error: featuresError } = await supabase
        .from("platform_features")
        .select("*")
        .eq("is_global_enabled", true)
        .order("order_index");

      if (featuresError) throw featuresError;
      if (!allFeatures || allFeatures.length === 0) return [];

      // 2. Se não tem empresa selecionada ou não tem plano, retorna todas as features globais
      if (!currentCompany?.id || !currentCompany?.plan_id) {
        console.log("🏢 Empresa sem plano definido - mostrando todas as features globais");
        return allFeatures;
      }

      // 3. Buscar features habilitadas para o plano da empresa
      const { data: planFeatures, error: planFeaturesError } = await supabase
        .from("plan_features")
        .select("feature_id, is_enabled")
        .eq("plan_id", currentCompany.plan_id);

      if (planFeaturesError) {
        console.error("Erro ao buscar features do plano:", planFeaturesError);
        return allFeatures;
      }

      // 4. Se não há configuração de features para o plano, retorna todas as globais
      if (!planFeatures || planFeatures.length === 0) {
        console.log("📋 Plano sem configuração de features - mostrando todas as features globais");
        return allFeatures;
      }

      // 5. Filtrar features: deve estar global_enabled E habilitada no plano
      const enabledFeatureIds = new Set(
        (planFeatures as { feature_id: string; is_enabled: boolean }[])
          .filter((pf) => pf.is_enabled)
          .map((pf) => pf.feature_id)
      );

      const filteredFeatures = allFeatures.filter((feature: any) =>
        enabledFeatureIds.has(feature.id)
      );

      console.log(`✅ Features habilitadas para o plano: ${filteredFeatures.length}/${allFeatures.length}`);

      return filteredFeatures;
    },
    enabled: true,
  });

  const isFeatureEnabled = (featureKey: FeatureKey): boolean => {
    return features.some((f: any) => f.feature_key === featureKey);
  };

  return {
    features,
    isFeatureEnabled,
    isLoading,
  };
};
