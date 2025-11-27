import { Shield } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SuperAdminGate } from "@/components/auth/SuperAdminGate";
import { FeatureFlagsManager } from "@/components/super-admin/FeatureFlagsManager";
import { PlanFeaturesEditor } from "@/components/super-admin/PlanFeaturesEditor";
import { PlatformMetrics } from "@/components/super-admin/PlatformMetrics";
import { PlatformCompanies } from "@/components/super-admin/PlatformCompanies";
import { MainLayout } from "@/components/MainLayout";

export default function SuperAdmin() {
  return (
    <SuperAdminGate>
      <MainLayout>
        <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-lg bg-primary/10">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Painel Super Admin</h1>
            <p className="text-muted-foreground">
              Controle de features e configurações da plataforma
            </p>
          </div>
        </div>

        <Tabs defaultValue="features" className="space-y-4">
          <TabsList>
            <TabsTrigger value="features">Features Globais</TabsTrigger>
            <TabsTrigger value="plans">Planos</TabsTrigger>
            <TabsTrigger value="companies">Empresas</TabsTrigger>
            <TabsTrigger value="metrics">Métricas</TabsTrigger>
          </TabsList>

          <TabsContent value="features">
            <Card>
              <CardHeader>
                <CardTitle>Gerenciar Features</CardTitle>
                <CardDescription>
                  Ative ou desative funcionalidades globalmente na plataforma
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FeatureFlagsManager />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="plans">
            <Card>
              <CardHeader>
                <CardTitle>Configurar Planos</CardTitle>
                <CardDescription>
                  Defina quais features cada plano possui
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PlanFeaturesEditor />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="companies">
            <Card>
              <CardHeader>
                <CardTitle>Empresas da Plataforma</CardTitle>
                <CardDescription>
                  Visualize e gerencie todas as empresas cadastradas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PlatformCompanies />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="metrics">
            <Card>
              <CardHeader>
                <CardTitle>Métricas da Plataforma</CardTitle>
                <CardDescription>
                  Acompanhe o uso e crescimento da plataforma
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PlatformMetrics />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        </div>
      </MainLayout>
    </SuperAdminGate>
  );
}
