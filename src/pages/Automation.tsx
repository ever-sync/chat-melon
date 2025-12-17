import { MainLayout } from '@/components/MainLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlaybookList } from '@/components/automation/PlaybookList';
import { PlaybookExecutions } from '@/components/automation/PlaybookExecutions';

export default function Automation() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Automações</h1>
          <p className="text-muted-foreground">
            Configure playbooks para automatizar processos e aumentar a produtividade
          </p>
        </div>

        <Tabs defaultValue="playbooks" className="space-y-6">
          <TabsList>
            <TabsTrigger value="playbooks">Playbooks</TabsTrigger>
            <TabsTrigger value="executions">Execuções</TabsTrigger>
          </TabsList>

          <TabsContent value="playbooks" className="space-y-6">
            <PlaybookList />
          </TabsContent>

          <TabsContent value="executions" className="space-y-6">
            <PlaybookExecutions />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
