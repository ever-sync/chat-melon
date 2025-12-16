import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyQuery } from "./crm/useCompanyQuery";
import { startOfDay, endOfDay } from "date-fns";

interface ActivityFilters {
  startDate: Date;
  endDate: Date;
  userId?: string;
  activityType?: string;
}

type MessageRow = { id: string; user_id: string; timestamp: string };
type ProposalRow = { id: string; created_by: string | null; created_at: string; status: string };
type TaskRow = { id: string; assigned_to: string; completed_at: string | null; title: string };
type ActivityRow = { id: string; user_id: string | null; activity_type: string; description: string | null; created_at: string; metadata: any };

export const useActivityReport = (filters: ActivityFilters) => {
  const { companyId } = useCompanyQuery();

  const { data, isLoading } = useQuery({
    queryKey: ["activity-report", companyId, filters],
    queryFn: async () => {
      if (!companyId) throw new Error("No company selected");

      const start = startOfDay(filters.startDate).toISOString();
      const end = endOfDay(filters.endDate).toISOString();

      // Cast to any to bypass TypeScript deep type inference issues
      const db: any = supabase;

      // Fetch messages
      let messages: MessageRow[] | null = null;
      if (filters.userId) {
        const result = await db.from("messages")
          .select("id, user_id, timestamp")
          .eq("company_id", companyId)
          .eq("is_from_me", true)
          .eq("user_id", filters.userId)
          .gte("timestamp", start)
          .lte("timestamp", end);
        messages = result.data;
      } else {
        const result = await db.from("messages")
          .select("id, user_id, timestamp")
          .eq("company_id", companyId)
          .eq("is_from_me", true)
          .gte("timestamp", start)
          .lte("timestamp", end);
        messages = result.data;
      }

      // Fetch proposals
      let proposals: ProposalRow[] | null = null;
      if (filters.userId) {
        const result = await db.from("proposals")
          .select("id, created_by, created_at, status")
          .eq("company_id", companyId)
          .eq("created_by", filters.userId)
          .gte("created_at", start)
          .lte("created_at", end);
        proposals = result.data;
      } else {
        const result = await db.from("proposals")
          .select("id, created_by, created_at, status")
          .eq("company_id", companyId)
          .gte("created_at", start)
          .lte("created_at", end);
        proposals = result.data;
      }

      // Fetch tasks
      let tasks: TaskRow[] | null = null;
      if (filters.userId) {
        const result = await db.from("tasks")
          .select("id, assigned_to, completed_at, title")
          .eq("company_id", companyId)
          .eq("status", "completed")
          .eq("assigned_to", filters.userId)
          .gte("completed_at", start)
          .lte("completed_at", end);
        tasks = result.data;
      } else {
        const result = await db.from("tasks")
          .select("id, assigned_to, completed_at, title")
          .eq("company_id", companyId)
          .eq("status", "completed")
          .gte("completed_at", start)
          .lte("completed_at", end);
        tasks = result.data;
      }

      // Fetch activities
      let dealActivities: ActivityRow[] | null = null;
      if (filters.userId) {
        const result = await db.from("deal_activities")
          .select("id, user_id, activity_type, description, created_at, metadata")
          .eq("user_id", filters.userId)
          .gte("created_at", start)
          .lte("created_at", end);
        dealActivities = result.data;
      } else {
        const result = await db.from("deal_activities")
          .select("id, user_id, activity_type, description, created_at, metadata")
          .gte("created_at", start)
          .lte("created_at", end);
        dealActivities = result.data;
      }

      // Fetch profiles
      const userIds = new Set<string>();
      messages?.forEach(m => userIds.add(m.user_id));
      proposals?.forEach(p => p.created_by && userIds.add(p.created_by));
      tasks?.forEach(t => userIds.add(t.assigned_to));
      dealActivities?.forEach(a => a.user_id && userIds.add(a.user_id));

      const { data: profiles } = await supabase.from("profiles").select("id, full_name").in("id", Array.from(userIds));
      const profileMap = new Map(profiles?.map(p => [p.id, p.full_name]) || []);

      // Summary
      const summary = {
        messages: messages?.length || 0,
        calls: dealActivities?.filter(a => a.activity_type === "call_made").length || 0,
        meetings: dealActivities?.filter(a => a.activity_type === "meeting").length || 0,
        proposals: proposals?.length || 0,
        tasks: tasks?.length || 0,
        dealsWon: dealActivities?.filter(a => a.activity_type === "deal_won").length || 0,
        dealsLost: dealActivities?.filter(a => a.activity_type === "deal_lost").length || 0,
      };

      // By day
      const dayMap = new Map<string, any>();
      messages?.forEach(msg => {
        const date = new Date(msg.timestamp).toISOString().split('T')[0];
        if (!dayMap.has(date)) dayMap.set(date, { date, messages: 0, calls: 0, meetings: 0, proposals: 0, tasks: 0 });
        dayMap.get(date).messages++;
      });
      proposals?.forEach(prop => {
        const date = new Date(prop.created_at).toISOString().split('T')[0];
        if (!dayMap.has(date)) dayMap.set(date, { date, messages: 0, calls: 0, meetings: 0, proposals: 0, tasks: 0 });
        dayMap.get(date).proposals++;
      });
      tasks?.forEach(task => {
        const date = new Date(task.completed_at!).toISOString().split('T')[0];
        if (!dayMap.has(date)) dayMap.set(date, { date, messages: 0, calls: 0, meetings: 0, proposals: 0, tasks: 0 });
        dayMap.get(date).tasks++;
      });
      dealActivities?.forEach(act => {
        const date = new Date(act.created_at).toISOString().split('T')[0];
        if (!dayMap.has(date)) dayMap.set(date, { date, messages: 0, calls: 0, meetings: 0, proposals: 0, tasks: 0 });
        if (act.activity_type === "call_made") dayMap.get(date).calls++;
        if (act.activity_type === "meeting") dayMap.get(date).meetings++;
      });
      const byDay = Array.from(dayMap.values()).sort((a, b) => a.date.localeCompare(b.date));

      // By user
      const userMap = new Map<string, any>();
      messages?.forEach(msg => {
        if (!userMap.has(msg.user_id)) {
          userMap.set(msg.user_id, { userId: msg.user_id, userName: profileMap.get(msg.user_id) || "Desconhecido", messages: 0, calls: 0, meetings: 0, proposals: 0, tasks: 0 });
        }
        userMap.get(msg.user_id).messages++;
      });
      proposals?.forEach(prop => {
        if (prop.created_by && !userMap.has(prop.created_by)) {
          userMap.set(prop.created_by, { userId: prop.created_by, userName: profileMap.get(prop.created_by) || "Desconhecido", messages: 0, calls: 0, meetings: 0, proposals: 0, tasks: 0 });
        }
        if (prop.created_by) userMap.get(prop.created_by).proposals++;
      });
      tasks?.forEach(task => {
        if (!userMap.has(task.assigned_to)) {
          userMap.set(task.assigned_to, { userId: task.assigned_to, userName: profileMap.get(task.assigned_to) || "Desconhecido", messages: 0, calls: 0, meetings: 0, proposals: 0, tasks: 0 });
        }
        userMap.get(task.assigned_to).tasks++;
      });
      dealActivities?.forEach(act => {
        if (act.user_id && !userMap.has(act.user_id)) {
          userMap.set(act.user_id, { userId: act.user_id, userName: profileMap.get(act.user_id) || "Desconhecido", messages: 0, calls: 0, meetings: 0, proposals: 0, tasks: 0 });
        }
        if (act.user_id) {
          if (act.activity_type === "call_made") userMap.get(act.user_id).calls++;
          if (act.activity_type === "meeting") userMap.get(act.user_id).meetings++;
        }
      });
      const byUser = Array.from(userMap.values()).sort((a, b) => b.messages - a.messages);

      // Detailed activities
      const detailedActivities: any[] = [];
      messages?.forEach(msg => detailedActivities.push({ id: msg.id, timestamp: msg.timestamp, userId: msg.user_id, userName: profileMap.get(msg.user_id) || "Desconhecido", type: "message", description: "Mensagem enviada" }));
      proposals?.forEach(prop => detailedActivities.push({ id: prop.id, timestamp: prop.created_at, userId: prop.created_by!, userName: profileMap.get(prop.created_by!) || "Desconhecido", type: "proposal", description: `Proposta ${prop.status === "sent" ? "enviada" : "criada"}` }));
      tasks?.forEach(task => detailedActivities.push({ id: task.id, timestamp: task.completed_at!, userId: task.assigned_to, userName: profileMap.get(task.assigned_to) || "Desconhecido", type: "task", description: `Tarefa concluída: ${task.title}` }));
      dealActivities?.forEach(act => {
        let desc = act.description || "";
        if (act.activity_type === "call_made") desc = "Ligação realizada";
        else if (act.activity_type === "meeting") desc = "Reunião realizada";
        else if (act.activity_type === "deal_won") desc = "Negócio ganho";
        else if (act.activity_type === "deal_lost") desc = "Negócio perdido";
        else if (act.activity_type === "stage_change") desc = "Negócio movido";
        detailedActivities.push({ id: act.id, timestamp: act.created_at, userId: act.user_id!, userName: profileMap.get(act.user_id!) || "Desconhecido", type: act.activity_type, description: desc, metadata: act.metadata });
      });
      detailedActivities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      return { summary, byDay, byUser, detailedActivities };
    },
    enabled: !!companyId,
  });

  return {
    summary: data?.summary,
    byDay: data?.byDay || [],
    byUser: data?.byUser || [],
    detailedActivities: data?.detailedActivities || [],
    isLoading,
  };
};
