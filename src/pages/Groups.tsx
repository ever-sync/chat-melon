import { MainLayout } from '@/components/MainLayout';
import { GroupManager } from '@/components/chat/GroupManager';
import { GroupDashboard } from '@/components/chat/GroupDashboard';

export default function Groups() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Gerenciar Grupos</h1>
            <p className="text-muted-foreground">Crie e gerencie grupos do WhatsApp</p>
          </div>
          <GroupManager />
        </div>

        <GroupDashboard />
      </div>
    </MainLayout>
  );
}
