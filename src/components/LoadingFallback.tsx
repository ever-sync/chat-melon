import { Loader2 } from 'lucide-react';

export function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Carregando...</p>
      </div>
    </div>
  );
}

export function PageLoadingSkeleton() {
  return (
    <div className="flex flex-col h-screen">
      {/* Header Skeleton */}
      <div className="h-16 border-b bg-muted/10 animate-pulse" />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Skeleton */}
        <div className="hidden md:block w-64 border-r bg-muted/10 animate-pulse" />

        {/* Main Content Skeleton */}
        <div className="flex-1 p-6 space-y-4">
          <div className="h-8 bg-muted/20 rounded w-1/4 animate-pulse" />
          <div className="h-64 bg-muted/20 rounded animate-pulse" />
          <div className="h-32 bg-muted/20 rounded animate-pulse" />
        </div>
      </div>
    </div>
  );
}
