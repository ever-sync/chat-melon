import React from 'react';
import { MainLayout } from '@/components/MainLayout';
import { ManagerDashboard } from '@/components/ai-assistant/ManagerDashboard';
import { useCompanyQuery } from '@/hooks/crm/useCompanyQuery';
import { usePermissions } from '@/hooks/usePermissions';
import { Navigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

export default function AIInsights() {
  const { companyId } = useCompanyQuery();
  const { isAdmin, isManager, isLoading: isLoadingPermissions } = usePermissions();

  // Verificar permissões - apenas admin e manager podem acessar
  if (!isLoadingPermissions && !isAdmin && !isManager) {
    return (
      <MainLayout>
        <div className="p-8">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <AlertTriangle className="h-12 w-12 text-yellow-500 mb-4" />
              <h2 className="text-xl font-semibold mb-2">Acesso Restrito</h2>
              <p className="text-muted-foreground text-center max-w-md">
                Esta página é exclusiva para gestores e administradores.
                Entre em contato com seu administrador se você precisa de acesso.
              </p>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  if (!companyId) {
    return (
      <MainLayout>
        <div className="p-8">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <p className="text-muted-foreground">Carregando...</p>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-6">
        <ManagerDashboard companyId={companyId} />
      </div>
    </MainLayout>
  );
}
