import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { useTabulations } from '@/hooks/useTabulations';
import { useCompany } from '@/contexts/CompanyContext';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface TabulationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (tabulationId: string) => void;
  isLoading?: boolean;
}

export const TabulationModal = ({
  open,
  onOpenChange,
  onConfirm,
  isLoading = false,
}: TabulationModalProps) => {
  const { currentCompany } = useCompany();
  const { tabulations, isLoading: loadingTabulations } = useTabulations(currentCompany?.id);
  const [selectedTabulationId, setSelectedTabulationId] = useState<string>('');

  const handleConfirm = () => {
    if (selectedTabulationId) {
      onConfirm(selectedTabulationId);
      setSelectedTabulationId(''); // Reset selection
    }
  };

  const handleCancel = () => {
    setSelectedTabulationId('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] rounded-3xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-green-50">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <DialogTitle className="text-xl">Encerrar Atendimento</DialogTitle>
              <DialogDescription>
                Selecione a tabulação para classificar este atendimento
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="py-4">
          {loadingTabulations ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : tabulations.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Nenhuma tabulação cadastrada. Configure as tabulações em Configurações &gt;
                Tabulação.
              </AlertDescription>
            </Alert>
          ) : (
            <RadioGroup value={selectedTabulationId} onValueChange={setSelectedTabulationId}>
              <div className="space-y-2">
                {tabulations.map((tabulation) => (
                  <div
                    key={tabulation.id}
                    className={`flex items-center space-x-3 p-4 rounded-xl border-2 transition-all cursor-pointer ${
                      selectedTabulationId === tabulation.id
                        ? 'border-indigo-600 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedTabulationId(tabulation.id)}
                  >
                    <RadioGroupItem value={tabulation.id} id={tabulation.id} />
                    <Label
                      htmlFor={tabulation.id}
                      className="flex-1 cursor-pointer flex items-center justify-between"
                    >
                      <div className="space-y-1">
                        <p className="font-medium">{tabulation.name}</p>
                        {tabulation.description && (
                          <p className="text-sm text-muted-foreground">{tabulation.description}</p>
                        )}
                      </div>
                      <Badge
                        style={{
                          backgroundColor: tabulation.color,
                          color: '#fff',
                        }}
                        className="ml-2"
                      >
                        {tabulation.name}
                      </Badge>
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleCancel} disabled={isLoading}>
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={!selectedTabulationId || isLoading || tabulations.length === 0}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Encerrando...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Encerrar Atendimento
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
