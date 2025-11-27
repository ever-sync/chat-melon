import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

export type Insight = Tables<"ai_insights">;

export const useInsights = () => {
  const queryClient = useQueryClient();

  const { data: insights = [], isLoading } = useQuery({
    queryKey: ["ai-insights"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_insights")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Insight[];
    },
  });

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ["ai-insights-unread"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("ai_insights")
        .select("*", { count: "exact", head: true })
        .eq("is_read", false);

      if (error) throw error;
      return count || 0;
    },
  });

  const markAsRead = useMutation({
    mutationFn: async (insightId: string) => {
      const { error } = await supabase
        .from("ai_insights")
        .update({ is_read: true })
        .eq("id", insightId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-insights"] });
      queryClient.invalidateQueries({ queryKey: ["ai-insights-unread"] });
    },
  });

  const deleteInsight = useMutation({
    mutationFn: async (insightId: string) => {
      const { error } = await supabase
        .from("ai_insights")
        .delete()
        .eq("id", insightId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-insights"] });
      queryClient.invalidateQueries({ queryKey: ["ai-insights-unread"] });
      toast.success("Insight removido");
    },
    onError: () => {
      toast.error("Erro ao remover insight");
    },
  });

  const executeAction = useMutation({
    mutationFn: async ({ 
      insightId, 
      actionType, 
      actionData 
    }: { 
      insightId: string; 
      actionType: string; 
      actionData: any;
    }) => {
      // Mark as read first
      await markAsRead.mutateAsync(insightId);

      // Execute the action based on type
      switch (actionType) {
        case "create_task":
          // Navigate or open task modal with pre-filled data
          break;
        case "view_deal":
          // Navigate to deal
          break;
        case "send_message":
          // Navigate to chat
          break;
        default:
          break;
      }
      
      return { actionType, actionData };
    },
    onSuccess: () => {
      toast.success("Ação executada");
    },
  });

  return {
    insights,
    unreadCount,
    isLoading,
    markAsRead,
    deleteInsight,
    executeAction,
  };
};
