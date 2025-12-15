import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyQuery } from "@/hooks/crm/useCompanyQuery";
import { EvolutionInstanceManager } from "@/components/evolution/EvolutionInstanceManager";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Link } from "react-router-dom";

export function InstancesList() {
  const { companyId } = useCompanyQuery();

  const { data: instances, isLoading, refetch } = useQuery({
    queryKey: ['evolution-instances', companyId],
    queryFn: async () => {
      if (!companyId) return [];

      const { data, error } = await supabase
        .from('evolution_settings')
        .select('*')
        .eq('company_id', companyId);

      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Instâncias WhatsApp</h2>
          <p className="text-muted-foreground">
            Gerencie suas conexões com o WhatsApp
          </p>
        </div>
        <Button asChild>
          <Link to="/instance-setup">
            <Plus className="h-4 w-4 mr-2" />
            Nova Instância
          </Link>
        </Button>
      </div>

      {!instances || instances.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Nenhuma instância configurada</CardTitle>
            <CardDescription>
              Crie sua primeira instância para começar a usar o WhatsApp
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link to="/instance-setup">
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeira Instância
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {instances.map((instance) => (
            <EvolutionInstanceManager
              key={instance.id}
              companyId={companyId!}
              instanceName={instance.instance_name}
              instanceStatus={instance.instance_status}
              qrCode={instance.qr_code}
              onStatusUpdate={refetch}
            />
          ))}
        </div>
      )}
    </div>
  );
}
