import { useRef, useState } from 'react';
import { useContactVariables } from '@/hooks/useContactVariables';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Code2, Search, Braces } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VariablesPickerProps {
  onSelect: (variableKey: string) => void;
  buttonText?: string;
  buttonVariant?: 'default' | 'outline' | 'ghost' | 'secondary';
  buttonSize?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  showPreview?: boolean;
}

/**
 * Componente para selecionar variáveis de contato
 * Sincronizado automaticamente com custom_fields via triggers no banco de dados
 */
export function VariablesPicker({
  onSelect,
  buttonText = 'Inserir Variável',
  buttonVariant = 'outline',
  buttonSize = 'sm',
  className,
  showPreview = true,
}: VariablesPickerProps) {
  const { allVariables, defaultVariables, companyVariables, customVariables } =
    useContactVariables();
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);

  const filteredVariables = allVariables.filter(
    (v) =>
      v.label.toLowerCase().includes(search.toLowerCase()) ||
      v.key.toLowerCase().includes(search.toLowerCase()) ||
      v.description?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (variableKey: string) => {
    onSelect(variableKey);
    setOpen(false);
    setSearch('');
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant={buttonVariant}
          size={buttonSize}
          className={className}
        >
          <Braces className="h-4 w-4 mr-2" />
          {buttonText}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <div className="flex flex-col">
          <div className="p-3 border-b">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar variável..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          <ScrollArea className="h-[300px]">
            <div className="p-2">
              {/* Variáveis Padrão */}
              {defaultVariables.some((v) =>
                v.label.toLowerCase().includes(search.toLowerCase())
              ) && (
                <div className="mb-3">
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                    VARIÁVEIS PADRÃO
                  </div>
                  {defaultVariables
                    .filter(
                      (v) =>
                        v.label.toLowerCase().includes(search.toLowerCase()) ||
                        v.key.toLowerCase().includes(search.toLowerCase())
                    )
                    .map((variable) => (
                      <button
                        key={variable.key}
                        onClick={() => handleSelect(variable.key)}
                        className="w-full text-left px-2 py-2 rounded hover:bg-accent transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Code2 className="h-4 w-4 text-blue-500 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm">{variable.label}</div>
                            <div className="text-xs text-muted-foreground truncate">
                              {`{{${variable.key}}}`}
                            </div>
                          </div>
                        </div>
                        {showPreview && variable.description && (
                          <div className="mt-1 text-xs text-muted-foreground ml-6">
                            {variable.description}
                          </div>
                        )}
                      </button>
                    ))}
                </div>
              )}

              {/* Variáveis da Empresa */}
              {companyVariables.length > 0 &&
                companyVariables.some((v) =>
                  v.label.toLowerCase().includes(search.toLowerCase())
                ) && (
                  <div className="mb-3">
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                      VARIÁVEIS DA EMPRESA
                    </div>
                    {companyVariables
                      .filter(
                        (v) =>
                          v.label.toLowerCase().includes(search.toLowerCase()) ||
                          v.key.toLowerCase().includes(search.toLowerCase())
                      )
                      .map((variable) => (
                        <button
                          key={variable.key}
                          onClick={() => handleSelect(variable.key)}
                          className="w-full text-left px-2 py-2 rounded hover:bg-accent transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <Code2 className="h-4 w-4 text-purple-500 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm">{variable.label}</div>
                              <div className="text-xs text-muted-foreground truncate">
                                {`{{${variable.key}}}`}
                              </div>
                            </div>
                          </div>
                          {showPreview && variable.value && (
                            <div className="mt-1 text-xs text-muted-foreground ml-6">
                              Valor: {variable.value}
                            </div>
                          )}
                        </button>
                      ))}
                  </div>
                )}

              {/* Campos Personalizados (sincronizados automaticamente) */}
              {customVariables.length > 0 &&
                customVariables.some((v) =>
                  v.label.toLowerCase().includes(search.toLowerCase())
                ) && (
                  <div className="mb-3">
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground flex items-center gap-2">
                      <span>CAMPOS PERSONALIZADOS</span>
                      <span className="text-[10px] bg-green-500/10 text-green-500 px-1.5 py-0.5 rounded">
                        AUTO-SYNC
                      </span>
                    </div>
                    {customVariables
                      .filter(
                        (v) =>
                          v.label.toLowerCase().includes(search.toLowerCase()) ||
                          v.key.toLowerCase().includes(search.toLowerCase())
                      )
                      .map((variable) => (
                        <button
                          key={variable.key}
                          onClick={() => handleSelect(variable.key)}
                          className="w-full text-left px-2 py-2 rounded hover:bg-accent transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <Code2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm">{variable.label}</div>
                              <div className="text-xs text-muted-foreground truncate">
                                {`{{${variable.key}}}`}
                              </div>
                            </div>
                          </div>
                          {showPreview && variable.description && (
                            <div className="mt-1 text-xs text-muted-foreground ml-6">
                              {variable.description}
                            </div>
                          )}
                        </button>
                      ))}
                  </div>
                )}

              {filteredVariables.length === 0 && (
                <div className="text-center py-6 text-sm text-muted-foreground">
                  Nenhuma variável encontrada
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="p-3 border-t bg-muted/30">
            <div className="text-xs text-muted-foreground">
              <p className="font-medium mb-1">Como usar:</p>
              <p>Use {`{{variavel}}`} no texto para inserir valores dinâmicos</p>
              <p className="mt-1 text-green-600 font-medium">
                Campos personalizados sincronizam automaticamente!
              </p>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
