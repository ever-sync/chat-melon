import { useState } from 'react';
import { MainLayout } from '@/components/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Users, Trash2, Edit, Filter } from 'lucide-react';
import { useSegments } from '@/hooks/useSegments';
import { SegmentBuilder } from '@/components/contacts/SegmentBuilder';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';

export default function Segments() {
  const { segments, isLoading, deleteSegment } = useSegments();
  const navigate = useNavigate();
  const [builderOpen, setBuilderOpen] = useState(false);
  const [selectedSegment, setSelectedSegment] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [segmentToDelete, setSegmentToDelete] = useState<string | null>(null);

  const handleEdit = (segment: any) => {
    setSelectedSegment(segment);
    setBuilderOpen(true);
  };

  const handleDelete = (segmentId: string) => {
    setSegmentToDelete(segmentId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (segmentToDelete) {
      deleteSegment(segmentToDelete);
      setDeleteDialogOpen(false);
      setSegmentToDelete(null);
    }
  };

  const handleViewContacts = (segment: any) => {
    navigate(`/contacts?segment=${segment.id}`);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Segmentos de Contatos</h1>
            <p className="text-muted-foreground">
              Crie segmentos para organizar e filtrar seus contatos
            </p>
          </div>
          <Button
            onClick={() => {
              setSelectedSegment(null);
              setBuilderOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Segmento
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : segments.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent className="space-y-4">
              <div className="flex justify-center">
                <Filter className="h-16 w-16 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Nenhum segmento criado</h3>
                <p className="text-muted-foreground">
                  Crie seu primeiro segmento para organizar seus contatos
                </p>
              </div>
              <Button
                onClick={() => {
                  setSelectedSegment(null);
                  setBuilderOpen(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeiro Segmento
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {segments.map((segment) => (
              <Card key={segment.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">{segment.name}</CardTitle>
                      {segment.description && (
                        <CardDescription className="mt-2">{segment.description}</CardDescription>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(segment)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(segment.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-2xl font-bold">
                      <Users className="h-6 w-6 text-primary" />
                      {segment.contact_count || 0}
                      <span className="text-sm font-normal text-muted-foreground">contatos</span>
                    </div>

                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div>{segment.filters?.length || 0} regra(s) ativa(s)</div>
                      {segment.is_dynamic && (
                        <div className="flex items-center gap-1">
                          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                          Atualização automática
                        </div>
                      )}
                    </div>

                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => handleViewContacts(segment)}
                    >
                      Ver Contatos
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <SegmentBuilder open={builderOpen} onOpenChange={setBuilderOpen} segment={selectedSegment} />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Segmento</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este segmento? Esta ação não pode ser desfeita. Os
              contatos não serão afetados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
