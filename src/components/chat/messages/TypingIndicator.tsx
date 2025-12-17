import { Bot, User } from 'lucide-react';

interface TypingIndicatorProps {
  isAI?: boolean;
  name?: string;
}

export function TypingIndicator({ isAI, name }: TypingIndicatorProps) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 text-sm text-gray-500">
      <div
        className={`p-1 rounded-full ${isAI ? 'bg-violet-100 dark:bg-violet-900' : 'bg-emerald-100 dark:bg-emerald-900'}`}
      >
        {isAI ? (
          <Bot className="h-4 w-4 text-violet-600 dark:text-violet-400" />
        ) : (
          <User className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
        )}
      </div>
      <span>{isAI ? 'IA' : name || 'Atendente'} está digitando</span>
      <div className="flex gap-1">
        <div
          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
          style={{ animationDelay: '0ms' }}
        />
        <div
          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
          style={{ animationDelay: '150ms' }}
        />
        <div
          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
          style={{ animationDelay: '300ms' }}
        />
      </div>
    </div>
  );
}
