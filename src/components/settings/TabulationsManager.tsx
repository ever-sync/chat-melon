import { useState } from 'react';
import { useTabulations } from '@/hooks/useTabulations';
import { useCompany } from '@/contexts/CompanyContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, CheckCircle2 } from 'lucide-react';
import type { Tabulation } from '@/hooks/useTabulations';

export const TabulationsManager = () => {
  const { currentCompany } = useCompany();
  const { tabulations, isLoading, createTabulation, updateTabulation, deleteTabulation } =
    useTabulations(currentCompany?.id);

  const [showDialog, setShowDialog] = useState(false);
  const [editingTabulation, setEditingTabulation] = useState<Tabulation | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#6B7280',
  });

  const handleOpenDialog = (tabulation?: Tabulation) => {
    if (tabulation) {
      setEditingTabulation(tabulation);
      setFormData({
        name: tabulation.name,
        description: tabulation.description || '',
        color: tabulation.color,
      });
    } else {
      setEditingTabulation(null);
      setFormData({
        name: '',
        description: '',
        color: '#6B7280',
      });
    }
    setShowDialog(true);
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
    setEditingTabulation(null);
    setFormData({
      name: '',
      description: '',
      color: '#6B7280',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentCompany?.id) {
      return;
    }

    if (editingTabulation) {
      await updateTabulation.mutateAsync({
        id: editingTabulation.id,
        data: formData,
      });
    } else {
      await createTabulation.mutateAsync({
        ...formData,
        company_id: currentCompany.id,
      });
    }

    handleCloseDialog();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja remover esta tabulação?')) {
      await deleteTabulation.mutateAsync(id);
    }
  };

  const colorOptions = [
    { value: '#6B7280', label: 'Cinza' },
    { value: '#3B82F6', label: 'Azul' },
    { value: '#10B981', label: 'Verde' },
    { value: '#F59E0B', label: 'Laranja' },
    { value: '#EF4444', label: 'Vermelho' },
    { value: '#8B5CF6', label: 'Roxo' },
    { value: '#EC4899', label: 'Rosa' },
    { value: '#14B8A6', label: 'Turquesa' },
  ];

  return (
    <Card className="border-0 shadow-lg rounded-3xl overflow-hidden bg-white">
      <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white shadow-sm">
              <CheckCircle2 className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <CardTitle className="text-2xl">Tabulações</CardTitle>
              <CardDescription className="text-base">
                Gerencie as categorias de encerramento de atendimento
              </CardDescription>
            </div>
          </div>
          <Button
            onClick={() => handleOpenDialog()}
            className="rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova Tabulação
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : tabulations.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500 mb-4">Nenhuma tabulação cadastrada</p>
            <Button
              onClick={() => handleOpenDialog()}
              variant="outline"
              className="rounded-xl"
            >
              <Plus className="w-4 h-4 mr-2" />
              Criar primeira tabulação
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Cor</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tabulations.map((tabulation) => (
                <TableRow key={tabulation.id}>
                  <TableCell className="font-medium">{tabulation.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {tabulation.description || '-'}
                  </TableCell>
                  <TableCell>
                    <Badge
                      style={{
                        backgroundColor: tabulation.color,
                        color: '#fff',
                      }}
                    >
                      {colorOptions.find((c) => c.value === tabulation.color)?.label || 'Cor'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenDialog(tabulation)}
                        className="rounded-lg"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(tabulation.id)}
                        className="rounded-lg text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      {/* Dialog para criar/editar */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-[500px] rounded-3xl">
          <DialogHeader>
            <DialogTitle>
              {editingTabulation ? 'Editar Tabulação' : 'Nova Tabulação'}
            </DialogTitle>
            <DialogDescription>
              {editingTabulation
                ? 'Atualize as informações da tabulação'
                : 'Crie uma nova categoria de encerramento de atendimento'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Problema Resolvido"
                  required
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descrição opcional da tabulação"
                  rows={3}
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="color">Cor</Label>
                <div className="grid grid-cols-4 gap-2">
                  {colorOptions.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, color: color.value })}
                      className={`flex items-center gap-2 p-2 rounded-lg border-2 transition-all ${
                        formData.color === color.value
                          ? 'border-indigo-600 bg-indigo-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div
                        className="w-5 h-5 rounded-full"
                        style={{ backgroundColor: color.value }}
                      />
                      <span className="text-xs">{color.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
              >
                {editingTabulation ? 'Atualizar' : 'Criar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
