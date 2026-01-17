import { Hand, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface TakeConversationBannerProps {
  onTake: () => void;
  isLoading?: boolean;
  className?: string;
}

export const TakeConversationBanner = ({
  onTake,
  isLoading,
  className,
}: TakeConversationBannerProps) => {
  return (
    <div className={cn(
      "absolute inset-0 z-50 flex items-center justify-center bg-white/40 backdrop-blur-[6px] transition-all animate-in fade-in duration-500",
      className
    )}>
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-8 rounded-3xl shadow-2xl border border-white/50 dark:border-slate-800/50 flex flex-col items-center gap-6 max-w-sm w-full mx-4 text-center transform transition-all hover:scale-[1.02]">
        <div className="w-16 h-16 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-inner">
          <Hand className="w-8 h-8 animate-bounce" />
        </div>
        
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Conversa Livre</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Esta conversa ainda não tem um atendente responsável. Assuma o atendimento para começar a responder.
          </p>
        </div>

        <Button
          onClick={onTake}
          disabled={isLoading}
          className="w-full h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-lg shadow-lg shadow-indigo-200 dark:shadow-none transition-all active:scale-95 group"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Assumindo...
            </>
          ) : (
            <>
              <Hand className="mr-2 h-5 w-5 group-hover:rotate-12 transition-transform" />
              Pegar Conversa
            </>
          )}
        </Button>
        
        <p className="text-[10px] text-slate-400 uppercase tracking-widest font-medium">
          Sistema de Atendimento Melon
        </p>
      </div>
    </div>
  );
};
