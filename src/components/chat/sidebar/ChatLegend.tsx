export function ChatLegend() {
  return (
    <div className="flex items-center gap-4 px-4 py-2 bg-gray-50 dark:bg-gray-900 border-b border-border text-xs">
      <div className="flex items-center gap-1">
        <div className="w-3 h-3 rounded-full bg-gray-300 dark:bg-gray-600" />
        <span className="text-muted-foreground">Lead</span>
      </div>
      <div className="flex items-center gap-1">
        <div className="w-3 h-3 rounded-full bg-violet-500" />
        <span className="text-muted-foreground">IA</span>
      </div>
      <div className="flex items-center gap-1">
        <div className="w-3 h-3 rounded-full bg-emerald-500" />
        <span className="text-muted-foreground">Atendente</span>
      </div>
    </div>
  );
}
