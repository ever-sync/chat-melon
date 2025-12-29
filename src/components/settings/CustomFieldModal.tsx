import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { X, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useCustomFields, type CustomField } from '@/hooks/useCustomFields';

type EntityType = 'contact' | 'deal' | 'company';

interface CustomFieldModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityType: EntityType;
  field?: CustomField;
}

const fieldTypes = [
  { value: 'text', label: 'Texto', description: 'Campo de texto livre' },
  { value: 'number', label: 'Número', description: 'Valores numéricos' },
  { value: 'date', label: 'Data', description: 'Seletor de data' },
  { value: 'select', label: 'Seleção', description: 'Lista de opções (uma escolha)' },
  {
    value: 'multiselect',
    label: 'Múltipla Escolha',
    description: 'Lista de opções (várias escolhas)',
  },
  { value: 'boolean', label: 'Sim/Não', description: 'Checkbox verdadeiro/falso' },
  { value: 'url', label: 'URL', description: 'Link web' },
  { value: 'email', label: 'Email', description: 'Endereço de email' },
  { value: 'phone', label: 'Telefone', description: 'Número de telefone' },
  { value: 'currency', label: 'Moeda', description: 'Valor monetário' },
  { value: 'cpf', label: 'CPF', description: 'Cadastro de Pessoa Física (Máscara)' },
  { value: 'cnpj', label: 'CNPJ', description: 'Cadastro de Pessoa Jurídica (Máscara)' },
  { value: 'cep', label: 'CEP', description: 'Código Postal (Busca automática)' },
  { value: 'textarea', label: 'Área de Texto', description: 'Campo de texto longo' },
];

export function CustomFieldModal({ open, onOpenChange, entityType, field }: CustomFieldModalProps) {
  const { createField, updateField } = useCustomFields(entityType);

  const [fieldLabel, setFieldLabel] = useState('');
  const [fieldName, setFieldName] = useState('');
  const [fieldType, setFieldType] = useState<string>('text');
  const [isRequired, setIsRequired] = useState(false);
  const [defaultValue, setDefaultValue] = useState('');
  const [options, setOptions] = useState<string[]>([]);
  const [newOption, setNewOption] = useState('');

  useEffect(() => {
    if (field) {
      setFieldLabel(field.field_label);
      setFieldName(field.field_name);
      setFieldType(field.field_type);
      setIsRequired(field.is_required);
      setDefaultValue(field.default_value || '');
      setOptions((field.options as string[]) || []);
    } else {
      resetForm();
    }
  }, [field, open]);

  const resetForm = () => {
    setFieldLabel('');
    setFieldName('');
    setFieldType('text');
    setIsRequired(false);
    setDefaultValue('');
    setOptions([]);
    setNewOption('');
  };

  const generateFieldName = (label: string) => {
    return label
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
  };

  const handleLabelChange = (value: string) => {
    setFieldLabel(value);
    if (!field) {
      setFieldName(generateFieldName(value));
    }
  };

  const handleAddOption = () => {
    if (newOption.trim()) {
      setOptions([...options, newOption.trim()]);
      setNewOption('');
    }
  };

  const handleRemoveOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    const data = {
      field_label: fieldLabel,
      field_name: fieldName,
      field_type: fieldType as any,
      is_required: isRequired,
      default_value: defaultValue || undefined,
      options: ['select', 'multiselect'].includes(fieldType) ? (options as any) : undefined,
    } as any;

    if (field) {
      updateField.mutate({ id: field.id, ...data });
    } else {
      createField.mutateAsync(data).then(() => {
        if (fieldType === 'cep') {
          const addressFields = [
            { name: `${fieldName}_rua`, label: `${fieldLabel}: Rua` },
            { name: `${fieldName}_numero`, label: `${fieldLabel}: Número` },
            { name: `${fieldName}_bairro`, label: `${fieldLabel}: Bairro` },
            { name: `${fieldName}_cidade`, label: `${fieldLabel}: Cidade` },
            { name: `${fieldName}_uf`, label: `${fieldLabel}: UF` },
          ];

          addressFields.forEach(async (addr) => {
            await createField.mutateAsync({
              ...data,
              field_name: addr.name,
              field_label: addr.label,
              field_type: 'text',
              is_required: false,
            });
          });
          toast.success("Campos de endereço criados automaticamente!");
        }
      });
    }

    onOpenChange(false);
    resetForm();
  };

  const isSelectType = ['select', 'multiselect'].includes(fieldType);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{field ? 'Editar Campo' : 'Novo Campo Customizado'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Label */}
          <div className="space-y-2">
            <Label htmlFor="field-label">Label de Exibição *</Label>
            <Input
              id="field-label"
              placeholder="Ex: Cargo na Empresa"
              value={fieldLabel}
              onChange={(e) => handleLabelChange(e.target.value)}
            />
          </div>

          {/* Nome interno */}
          <div className="space-y-2">
            <Label htmlFor="field-name">Nome Interno (slug)</Label>
            <Input
              id="field-name"
              placeholder="cargo_empresa"
              value={fieldName}
              onChange={(e) => setFieldName(e.target.value)}
              disabled={!!field}
            />
            <p className="text-xs text-muted-foreground">
              Usado para identificar o campo. Não pode ser alterado após criação.
            </p>
          </div>

          {/* Tipo */}
          <div className="space-y-2">
            <Label htmlFor="field-type">Tipo de Campo *</Label>
            <Select value={fieldType} onValueChange={setFieldType}>
              <SelectTrigger id="field-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {fieldTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div>
                      <div className="font-medium">{type.label}</div>
                      <div className="text-xs text-muted-foreground">{type.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Opções (se select/multiselect) */}
          {isSelectType && (
            <div className="space-y-2">
              <Label>Opções</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Digite uma opção"
                  value={newOption}
                  onChange={(e) => setNewOption(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddOption();
                    }
                  }}
                />
                <Button type="button" onClick={handleAddOption} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {options.map((option, index) => (
                  <Badge key={index} variant="secondary" className="gap-1">
                    {option}
                    <button
                      type="button"
                      onClick={() => handleRemoveOption(index)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Valor padrão */}
          <div className="space-y-2">
            <Label htmlFor="default-value">Valor Padrão (opcional)</Label>
            {fieldType === 'boolean' ? (
              <Switch
                checked={defaultValue === 'true'}
                onCheckedChange={(checked) => setDefaultValue(checked ? 'true' : 'false')}
              />
            ) : isSelectType ? (
              <Select value={defaultValue} onValueChange={setDefaultValue}>
                <SelectTrigger id="default-value">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {options.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                id="default-value"
                type={fieldType === 'number' ? 'number' : fieldType === 'date' ? 'date' : 'text'}
                value={defaultValue}
                onChange={(e) => setDefaultValue(e.target.value)}
              />
            )}
          </div>

          {/* Obrigatório */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Campo Obrigatório</Label>
              <p className="text-xs text-muted-foreground">Usuários devem preencher este campo</p>
            </div>
            <Switch checked={isRequired} onCheckedChange={setIsRequired} />
          </div>

          {/* Preview */}
          <div className="border-t pt-4">
            <Label className="text-sm text-muted-foreground">Preview</Label>
            <div className="mt-2 p-4 border rounded-lg bg-muted/30">
              <Label>
                {fieldLabel || 'Nome do Campo'}
                {isRequired && <span className="text-destructive ml-1">*</span>}
              </Label>
              <div className="mt-2">
                {fieldType === 'text' && <Input placeholder="Texto..." disabled />}
                {fieldType === 'number' && <Input type="number" placeholder="0" disabled />}
                {fieldType === 'date' && <Input type="date" disabled />}
                {fieldType === 'boolean' && <Switch disabled />}
                {fieldType === 'url' && <Input placeholder="https://..." disabled />}
                {fieldType === 'email' && <Input placeholder="email@exemplo.com" disabled />}
                {fieldType === 'phone' && <Input placeholder="(00) 00000-0000" disabled />}
                {fieldType === 'currency' && <Input placeholder="R$ 0,00" disabled />}
                {isSelectType && (
                  <Select disabled>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                  </Select>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!fieldLabel || !fieldName || (isSelectType && options.length === 0)}
          >
            {field ? 'Atualizar' : 'Criar'} Campo
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
