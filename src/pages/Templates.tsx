import { MainLayout } from '@/components/MainLayout';
import { TemplatesManager } from '@/components/chat/TemplatesManager';

export default function Templates() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Templates de Mensagem</h1>
          <p className="text-muted-foreground">
            Crie e gerencie templates reutilizáveis com variáveis dinâmicas
          </p>
        </div>

        <TemplatesManager />
      </div>
    </MainLayout>
  );
}
