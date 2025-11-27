import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import type { CustomField } from "@/hooks/useCustomFields";

interface CustomFieldInputProps {
  field: CustomField;
  value?: string;
  onChange: (value: string) => void;
}

export function CustomFieldInput({ field, value = "", onChange }: CustomFieldInputProps) {
  const renderInput = () => {
    switch (field.field_type) {
      case "text":
        return (
          <Input
            placeholder={`Digite ${field.field_label.toLowerCase()}...`}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            required={field.is_required}
          />
        );

      case "number":
        return (
          <Input
            type="number"
            placeholder="0"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            required={field.is_required}
          />
        );

      case "currency":
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

      case "date":
        return (
          <Input
            type="date"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            required={field.is_required}
          />
        );

      case "url":
        return (
          <Input
            type="url"
            placeholder="https://..."
            value={value}
            onChange={(e) => onChange(e.target.value)}
            required={field.is_required}
          />
        );

      case "email":
        return (
          <Input
            type="email"
            placeholder="email@exemplo.com"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            required={field.is_required}
          />
        );

      case "phone":
        return (
          <Input
            type="tel"
            placeholder="(00) 00000-0000"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            required={field.is_required}
          />
        );

      case "boolean":
        return (
          <div className="flex items-center space-x-2">
            <Switch
              checked={value === "true"}
              onCheckedChange={(checked) => onChange(checked ? "true" : "false")}
            />
            <span className="text-sm text-muted-foreground">
              {value === "true" ? "Sim" : "Não"}
            </span>
          </div>
        );

      case "select":
        return (
          <Select value={value} onValueChange={onChange} required={field.is_required}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              {(field.options as string[] || []).map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case "multiselect":
        const selectedValues = value ? value.split(",") : [];
        return (
          <div className="space-y-2">
            {(field.options as string[] || []).map((option) => (
              <div key={option} className="flex items-center space-x-2">
                <Checkbox
                  checked={selectedValues.includes(option)}
                  onCheckedChange={(checked) => {
                    const newValues = checked
                      ? [...selectedValues, option]
                      : selectedValues.filter((v) => v !== option);
                    onChange(newValues.join(","));
                  }}
                />
                <label className="text-sm">{option}</label>
              </div>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-2">
      <Label>
        {field.field_label}
        {field.is_required && <span className="text-destructive ml-1">*</span>}
      </Label>
      {renderInput()}
    </div>
  );
}
