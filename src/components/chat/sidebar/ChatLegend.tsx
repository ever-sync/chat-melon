// Cores fixas do sistema (não configuráveis pelo usuário)
// Estas cores correspondem às cores usadas nas bolhas de mensagem
export const SYSTEM_COLORS = {
  lead: 'bg-gray-400 dark:bg-gray-500',           // Cinza - mensagens do cliente/lead
  ia: 'bg-gradient-to-br from-emerald-500 to-teal-600',  // Verde/Teal - mensagens da IA
  bot: 'bg-gradient-to-br from-amber-500 to-orange-500', // Âmbar/Laranja - mensagens do chatbot
} as const;

export function ChatLegend() {
  return (
    <div className="flex items-center gap-4 pl-1 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border-b border-border text-xs">
      <div className="flex items-center gap-1">
        <div className={`w-3 h-3 rounded-full ${SYSTEM_COLORS.lead}`} />
        <span className="text-muted-foreground">Lead</span>
      </div>
      <div className="flex items-center gap-1">
        <div className={`w-3 h-3 rounded-full ${SYSTEM_COLORS.ia}`} />
        <span className="text-muted-foreground">IA</span>
      </div>
      <div className="flex items-center gap-1">
        <div className={`w-3 h-3 rounded-full ${SYSTEM_COLORS.bot}`} />
        <span className="text-muted-foreground">Bot</span>
      </div>
    </div>
  );
}
