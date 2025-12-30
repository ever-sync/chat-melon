import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2, Users } from 'lucide-react';
import { useSegments, type SegmentFilter } from '@/hooks/useSegments';
import { useCustomFields } from '@/hooks/useCustomFields';
import { Skeleton } from '@/components/ui/skeleton';

interface SegmentBuilderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  segment?: any;
}

const FIELD_OPTIONS = [
  { value: 'created_at', label: 'Data de Criação', type: 'date' },
  { value: 'updated_at', label: 'Última Interação', type: 'date' },
  { value: 'name', label: 'Nome', type: 'text' },
  { value: 'phone_number', label: 'Telefone', type: 'text' },
  { value: 'email', label: 'Email', type: 'text' },
  { value: 'is_business', label: 'É Empresa', type: 'boolean' },
];

const OPERATORS_BY_TYPE: Record<string, Array<{ value: string; label: string }>> = {
  text: [
    { value: 'equals', label: 'igual a' },
    { value: 'not_equals', label: 'diferente de' },
    { value: 'contains', label: 'contém' },
    { value: 'starts_with', label: 'começa com' },
    { value: 'ends_with', label: 'termina com' },
    { value: 'is_empty', label: 'está vazio' },
    { value: 'is_not_empty', label: 'não está vazio' },
  ],
  number: [
    { value: 'equals', label: 'igual a' },
    { value: 'not_equals', label: 'diferente de' },
    { value: 'greater_than', label: 'maior que' },
    { value: 'less_than', label: 'menor que' },
  ],
  date: [
    { value: 'before', label: 'antes de' },
    { value: 'after', label: 'depois de' },
  ],
  boolean: [{ value: 'equals', label: 'é' }],
};

export function SegmentBuilder({ open, onOpenChange, segment }: SegmentBuilderProps) {
  const { createSegment, updateSegment, previewSegment } = useSegments();
  const { fields: customFields } = useCustomFields('contact');

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [filters, setFilters] = useState<SegmentFilter[]>([
    { field: 'created_at', operator: 'after', value: '', logic: 'AND' },
  ]);
  const [preview, setPreview] = useState({ count: 0, contacts: [] });
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  useEffect(() => {
    if (segment) {
      setName(segment.name);
      setDescription(segment.description || '');
      setFilters(segment.filters || []);
    }
  }, [segment]);

  useEffect(() => {
    const loadPreview = async () => {
      // Filtros válidos: campo e operador definidos, valor preenchido OU operador que não precisa de valor
      const validFilters = filters.filter((f) =>
        f.field && f.operator &&
        (f.value !== '' || ['is_empty', 'is_not_empty'].includes(f.operator))
      );
      if (validFilters.length > 0) {
        setIsLoadingPreview(true);
        const result = await previewSegment(validFilters);
        setPreview(result);
        setIsLoadingPreview(false);
      } else {
        setPreview({ count: 0, contacts: [] });
      }
    };

    const debounce = setTimeout(loadPreview, 500);
    return () => clearTimeout(debounce);
  }, [filters]);

  const addFilter = () => {
    setFilters([...filters, { field: 'created_at', operator: 'after', value: '', logic: 'AND' }]);
  };

  const removeFilter = (index: number) => {
    setFilters(filters.filter((_, i) => i !== index));
  };

  const updateFilter = (index: number, updates: Partial<SegmentFilter>) => {
    const newFilters = [...filters];
    newFilters[index] = { ...newFilters[index], ...updates };
    setFilters(newFilters);
  };

  const getFieldType = (field: string) => {
    const standardField = FIELD_OPTIONS.find((f) => f.value === field);
    if (standardField) return standardField.type;

    const customField = customFields.find((f) => f.field_name === field);
    if (customField) {
      if (customField.field_type === 'date') return 'date';
      if (customField.field_type === 'number') return 'number';
      if (customField.field_type === 'boolean') return 'boolean';
    }

    return 'text';
  };

  const handleSave = () => {
    // Filtros válidos: campo e operador definidos, valor preenchido OU operador que não precisa de valor
    const validFilters = filters.filter((f) =>
      f.field && f.operator &&
      (f.value !== '' || ['is_empty', 'is_not_empty'].includes(f.operator))
    );

    const segmentData: any = {
      name,
      description,
      filters: validFilters,
      contact_count: preview.count,
      is_dynamic: true,
    };

    if (segment) {
      updateSegment({ id: segment.id, ...segmentData });
    } else {
      createSegment(segmentData);
    }

    onOpenChange(false);
    resetForm();
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setFilters([{ field: 'created_at', operator: 'after', value: '', logic: 'AND' }]);
  };

  const allFieldOptions = [
    ...FIELD_OPTIONS,
    ...customFields.map((cf) => ({
      value: cf.field_name,
      label: cf.field_label,
      type: cf.field_type,
    })),
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{segment ? 'Editar Segmento' : 'Novo Segmento'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nome do Segmento *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Clientes VIP"
              />
            </div>

            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descreva o objetivo deste segmento"
                rows={2}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Regras de Segmentação</Label>
              <Button onClick={addFilter} variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Regra
              </Button>
            </div>

            <div className="space-y-3">
              {filters.map((filter, index) => (
                <div
                  key={index}
                  className="flex items-start gap-2 p-4 border rounded-lg bg-muted/50"
                >
                  {index > 0 && (
                    <Select
                      value={filter.logic}
                      onValueChange={(value) =>
                        updateFilter(index, { logic: value as 'AND' | 'OR' })
                      }
                    >
                      <SelectTrigger className="w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AND">E</SelectItem>
                        <SelectItem value="OR">OU</SelectItem>
                      </SelectContent>
                    </Select>
                  )}

                  <Select
                    value={filter.field}
                    onValueChange={(value) => updateFilter(index, { field: value, value: '' })}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Selecione campo" />
                    </SelectTrigger>
                    <SelectContent>
                      {allFieldOptions.map((field) => (
                        <SelectItem key={field.value} value={field.value}>
                          {field.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={filter.operator}
                    onValueChange={(value) => updateFilter(index, { operator: value })}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Operador" />
                    </SelectTrigger>
                    <SelectContent>
                      {OPERATORS_BY_TYPE[getFieldType(filter.field)]?.map((op) => (
                        <SelectItem key={op.value} value={op.value}>
                          {op.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {!['is_empty', 'is_not_empty'].includes(filter.operator) && (
                    <Input
                      value={filter.value}
                      onChange={(e) => updateFilter(index, { value: e.target.value })}
                      placeholder="Valor"
                      type={getFieldType(filter.field) === 'date' ? 'date' : 'text'}
                      className="flex-1"
                    />
                  )}

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFilter(index)}
                    disabled={filters.length === 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">
                  {isLoadingPreview ? (
                    <Skeleton className="h-5 w-32" />
                  ) : (
                    `Este segmento tem ${preview.count} contatos`
                  )}
                </span>
              </div>
            </div>

            {preview.contacts.length > 0 && (
              <div className="space-y-2">
                <Label>Preview (primeiros 10)</Label>
                <div className="border rounded-lg divide-y max-h-60 overflow-y-auto">
                  {preview.contacts.map((contact: any) => (
                    <div key={contact.id} className="p-3 hover:bg-muted/50">
                      <div className="font-medium">{contact.name || 'Sem nome'}</div>
                      <div className="text-sm text-muted-foreground">{contact.phone_number}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={!name || filters.length === 0}>
              {segment ? 'Atualizar' : 'Criar'} Segmento
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
