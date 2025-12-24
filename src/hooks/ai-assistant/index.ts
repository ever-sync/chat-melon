// Hooks do Assistente de IA
export { useAssistantSettings } from './useAssistantSettings';
export { useAgentPerformance, useTeamPerformance } from './useAgentPerformance';
export { useConversationQuality, useLowQualityConversations } from './useConversationQuality';
export {
  useContextualSuggestions,
  useSuggestionsByType,
  getPriorityWeight,
  sortSuggestions,
} from './useContextualSuggestions';
export {
  useAssistantMonitoring,
  useAssistant,
  AssistantProvider,
} from './useAssistantMonitoring.tsx';
export { usePatternDetection } from './usePatternDetection';
export { useCoachingInsights } from './useCoachingInsights';
