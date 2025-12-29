import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { IMaskInput } from 'react-imask';
import { toast } from 'sonner';
import type { CustomField } from '@/hooks/useCustomFields';

interface CustomFieldInputProps {
  field: CustomField;
  value?: string;
  onChange: (value: string) => void;
  allFields?: CustomField[];
  onUpdateFields?: (updates: Record<string, string>) => void;
}

export function CustomFieldInput({ 
  field, 
  value = '', 
  onChange,
  allFields,
  onUpdateFields
}: CustomFieldInputProps) {
  const [error, setError] = useState<string | null>(null);

  const validateCPF = (cpf: string) => {
    const cleanCPF = cpf.replace(/\D/g, '');
    if (cleanCPF.length !== 11) return false;
    if (/^(\d)\1+$/.test(cleanCPF)) return false;
    
    let sum = 0;
    let remainder;
    for (let i = 1; i <= 9; i++) sum += parseInt(cleanCPF.substring(i - 1, i)) * (11 - i);
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleanCPF.substring(9, 10))) return false;
    
    sum = 0;
    for (let i = 1; i <= 10; i++) sum += parseInt(cleanCPF.substring(i - 1, i)) * (12 - i);
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleanCPF.substring(10, 11))) return false;
    return true;
  };

  const validateCNPJ = (cnpj: string) => {
    const cleanCNPJ = cnpj.replace(/\D/g, '');
    if (cleanCNPJ.length !== 14) return false;
    if (/^(\d)\1+$/.test(cleanCNPJ)) return false;
    
    let size = cleanCNPJ.length - 2;
    let numbers = cleanCNPJ.substring(0, size);
    const digits = cleanCNPJ.substring(size);
    let sum = 0;
    let pos = size - 7;
    for (let i = size; i >= 1; i--) {
      sum += parseInt(numbers.charAt(size - i)) * pos--;
      if (pos < 2) pos = 9;
    }
    let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (result !== parseInt(digits.charAt(0))) return false;
    
    size = size + 1;
    numbers = cleanCNPJ.substring(0, size);
    sum = 0;
    pos = size - 7;
    for (let i = size; i >= 1; i--) {
      sum += parseInt(numbers.charAt(size - i)) * pos--;
      if (pos < 2) pos = 9;
    }
    result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (result !== parseInt(digits.charAt(1))) return false;
    return true;
  };

  const renderInput = () => {
    switch (field.field_type) {
      case 'text':
        return (
          <Input
            placeholder={`Digite ${field.field_label.toLowerCase()}...`}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            required={field.is_required}
          />
        );

      case 'number':
        return (
          <Input
            type="number"
            placeholder="0"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            required={field.is_required}
          />
        );

      case 'currency':
        return (
          <Input
            type="number"
            placeholder="0.00"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            required={field.is_required}
            step="0.01"
            min="0"
          />
        );

      case 'date':
        return (
          <Input
            type="date"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            required={field.is_required}
          />
        );

      case 'url':
        return (
          <Input
            type="url"
            placeholder="https://..."
            value={value}
            onChange={(e) => onChange(e.target.value)}
            required={field.is_required}
          />
        );

      case 'email':
        return (
          <Input
            type="email"
            placeholder="email@exemplo.com"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            required={field.is_required}
          />
        );

      case 'phone':
        return (
          <Input
            type="tel"
            placeholder="(00) 00000-0000"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            required={field.is_required}
          />
        );

      case 'boolean':
        return (
          <div className="flex items-center space-x-2">
            <Switch
              checked={value === 'true'}
              onCheckedChange={(checked) => onChange(checked ? 'true' : 'false')}
            />
            <span className="text-sm text-muted-foreground">
              {value === 'true' ? 'Sim' : 'Não'}
            </span>
          </div>
        );

      case 'select':
        return (
          <Select value={value} onValueChange={onChange} required={field.is_required}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              {((field.options as string[]) || []).map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'multiselect': {
        const selectedValues = value ? value.split(',') : [];
        return (
          <div className="space-y-2">
            {((field.options as string[]) || []).map((option) => (
              <div key={option} className="flex items-center space-x-2">
                <Checkbox
                  id={`${field.id}-${option}`}
                  checked={selectedValues.includes(option)}
                  onCheckedChange={(checked) => {
                    const newValues = checked
                      ? [...selectedValues, option]
                      : selectedValues.filter((v) => v !== option);
                    onChange(newValues.join(','));
                  }}
                />
                <label 
                  htmlFor={`${field.id}-${option}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {option}
                </label>
              </div>
            ))}
          </div>
        );
      }

      case 'cpf':
        return (
          <IMaskInput
            mask="000.000.000-00"
            radix="."
            value={value}
            unmask={false}
            onAccept={(val) => {
              onChange(val);
              if (val.replace(/\D/g, '').length === 11 && !validateCPF(val)) {
                setError('CPF inválido');
              } else {
                setError(null);
              }
            }}
            className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${error ? 'border-destructive' : ''}`}
            placeholder="000.000.000-00"
            required={field.is_required}
          />
        );

      case 'cnpj':
        return (
          <IMaskInput
            mask="00.000.000/0000-00"
            radix="."
            value={value}
            unmask={false}
            onAccept={(val) => {
              onChange(val);
              if (val.replace(/\D/g, '').length === 14 && !validateCNPJ(val)) {
                setError('CNPJ inválido');
              } else {
                setError(null);
              }
            }}
            className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${error ? 'border-destructive' : ''}`}
            placeholder="00.000.000/0000-00"
            required={field.is_required}
          />
        );

      case 'cep': {
        const handleCepChange = async (cep: string) => {
          onChange(cep);
          const cleanCep = cep.replace(/\D/g, '');
          if (cleanCep.length === 8) {
            setError(null);
            try {
              const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
              const data = await res.json();
              if (data.erro) {
                setError('CEP não encontrado');
              } else {
                toast.info(`Endereço: ${data.logradouro}, ${data.bairro} - ${data.localidade}/${data.uf}`);
                
                if (onUpdateFields && allFields) {
                  const updates: Record<string, string> = {};
                  const fieldPrefix = field.field_name;
                  
                  // Find related fields by name convention (slug_rua, slug_bairro, etc)
                  const ruaField = allFields.find(f => f.field_name === `${fieldPrefix}_rua`);
                  const bairroField = allFields.find(f => f.field_name === `${fieldPrefix}_bairro`);
                  const cidadeField = allFields.find(f => f.field_name === `${fieldPrefix}_cidade`);
                  const ufField = allFields.find(f => f.field_name === `${fieldPrefix}_uf`);
                  
                  if (ruaField) updates[ruaField.id] = data.logradouro;
                  if (bairroField) updates[bairroField.id] = data.bairro;
                  if (cidadeField) updates[cidadeField.id] = data.localidade;
                  if (ufField) updates[ufField.id] = data.uf;
                  
                  if (Object.keys(updates).length > 0) {
                    onUpdateFields(updates);
                  }
                }
              }
            } catch (err) {
              console.error('Erro ao buscar CEP:', err);
            }
          } else if (cleanCep.length > 0 && cleanCep.length < 8) {
             setError('CEP incompleto');
          } else {
             setError(null);
          }
        };

        return (
          <IMaskInput
            mask="00000-000"
            value={value}
            unmask={false}
            onAccept={(val) => handleCepChange(val)}
            className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${error ? 'border-destructive' : ''}`}
            placeholder="00000-000"
            required={field.is_required}
          />
        );
      }

      case 'textarea':
        return (
          <Textarea
            placeholder={`Digite ${field.field_label.toLowerCase()}...`}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            required={field.is_required}
            className="min-h-[100px]"
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <Label>
          {field.field_label}
          {field.is_required && <span className="text-destructive ml-1">*</span>}
        </Label>
        {error && <span className="text-[10px] text-destructive font-medium uppercase">{error}</span>}
      </div>
      {renderInput()}
    </div>
  );
}
