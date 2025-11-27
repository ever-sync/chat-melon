import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/CompanyContext";

export type FeatureKey =
  | "proposals"
  | "gamification"
  | "campaigns"
  | "automation"
  | "segments"
  | "duplicates"
  | "groups"
  | "ai_assistant"
  | "reports_advanced"
  | "products";

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
    queryKey: ["feature-flags", currentCompany?.id],
    queryFn: async () => {
      // Busca todas as features globalmente habilitadas
      const { data: allFeatures, error: featuresError } = await supabase
        .from("platform_features")
        .select("*")
        .eq("is_global_enabled", true)
        .order("order_index");

      if (featuresError) throw featuresError;

      return allFeatures || [];
    },
    enabled: true,
  });

  const isFeatureEnabled = (featureKey: FeatureKey): boolean => {
    return features.some((f) => f.feature_key === featureKey);
  };

  return {
    features,
    isFeatureEnabled,
    isLoading,
  };
};
