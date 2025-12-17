import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { useCustomFields } from '@/hooks/useCustomFields';
import { toast } from 'sonner';

interface Contact {
  id: string;
  name: string | null;
  phone_number: string;
  email?: string | null;
  company_cnpj: string | null;
  created_at: string;
  [key: string]: any;
}

interface ContactExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contacts: Contact[];
}

export const ContactExportDialog = ({ open, onOpenChange, contacts }: ContactExportDialogProps) => {
  const { fields: customFields } = useCustomFields('contact');

  const [format, setFormat] = useState<'csv' | 'excel'>('csv');
  const [selectedFields, setSelectedFields] = useState<string[]>([
    'name',
    'phone_number',
    'email',
    'company_cnpj',
    'created_at',
  ]);

  const availableFields = [
    { id: 'name', label: 'Nome' },
    { id: 'phone_number', label: 'Telefone' },
    { id: 'email', label: 'Email' },
    { id: 'company_cnpj', label: 'CNPJ' },
    { id: 'created_at', label: 'Data de Cadastro' },
    ...customFields.map((cf) => ({
      id: `custom_${cf.id}`,
      label: cf.field_label,
    })),
  ];

  const toggleField = (fieldId: string) => {
    setSelectedFields((prev) =>
      prev.includes(fieldId) ? prev.filter((f) => f !== fieldId) : [...prev, fieldId]
    );
  };

  const handleExport = () => {
    if (selectedFields.length === 0) {
      toast.error('Selecione pelo menos um campo para exportar');
      return;
    }

    // Prepare data
    const exportData = contacts.map((contact) => {
      const row: Record<string, any> = {};

      availableFields.forEach((field) => {
        if (selectedFields.includes(field.id)) {
          if (field.id.startsWith('custom_')) {
            // Handle custom fields (would need to fetch from custom_field_values)
            row[field.label] = '';
          } else {
            let value = contact[field.id];

            // Format dates
            if (field.id === 'created_at' && value) {
              value = new Date(value).toLocaleDateString('pt-BR');
            }

            row[field.label] = value || '';
          }
        }
      });

      return row;
    });

    if (format === 'csv') {
      // Export as CSV
      const csv = Papa.unparse(exportData);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);

      link.setAttribute('href', url);
      link.setAttribute('download', `contatos_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // Export as Excel
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Contatos');

      // Auto-size columns
      const maxWidth = 50;
      const wscols = Object.keys(exportData[0] || {}).map((key) => ({
        wch: Math.min(
          Math.max(key.length, ...exportData.map((row) => String(row[key] || '').length)),
          maxWidth
        ),
      }));
      ws['!cols'] = wscols;

      XLSX.writeFile(wb, `contatos_${new Date().toISOString().split('T')[0]}.xlsx`);
    }

    toast.success(`${contacts.length} contatos exportados com sucesso!`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Exportar Contatos</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <Label className="mb-3 block">Formato de exportação</Label>
            <RadioGroup value={format} onValueChange={(value: any) => setFormat(value)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="csv" id="csv" />
                <Label htmlFor="csv" className="cursor-pointer">
                  CSV (Excel, Google Sheets)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="excel" id="excel" />
                <Label htmlFor="excel" className="cursor-pointer">
                  Excel (.xlsx)
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div>
            <Label className="mb-3 block">Campos a exportar</Label>
            <div className="space-y-3 max-h-60 overflow-y-auto border rounded-lg p-3">
              {availableFields.map((field) => (
                <div key={field.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={field.id}
                    checked={selectedFields.includes(field.id)}
                    onCheckedChange={() => toggleField(field.id)}
                  />
                  <Label htmlFor={field.id} className="cursor-pointer font-normal">
                    {field.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              {contacts.length} contato{contacts.length !== 1 ? 's' : ''} será
              {contacts.length !== 1 ? 'ão' : ''} exportado{contacts.length !== 1 ? 's' : ''}
            </div>
            <Button onClick={handleExport} disabled={selectedFields.length === 0}>
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
