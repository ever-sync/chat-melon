import { memo, useState, useEffect } from 'react';
import { X, Plus, Trash2, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { NODE_TYPE_INFO, type ChatbotNode, type ChatbotNodeType } from '@/types/chatbot';

interface NodeEditorProps {
  node: ChatbotNode | null;
  onUpdate: (nodeId: string, data: Record<string, unknown>) => void;
  onClose: () => void;
  onDelete: (nodeId: string) => void;
}

export const NodeEditor = memo(function NodeEditor({
  node,
  onUpdate,
  onClose,
  onDelete,
}: NodeEditorProps) {
  const [localData, setLocalData] = useState<Record<string, unknown>>({});

  useEffect(() => {
    if (node) {
      setLocalData(node.data as Record<string, unknown>);
    }
  }, [node]);

  if (!node) return null;

  const nodeInfo = NODE_TYPE_INFO[node.type as ChatbotNodeType];

  const handleChange = (key: string, value: unknown) => {
    const newData = { ...localData, [key]: value };
    setLocalData(newData);
    onUpdate(node.id, newData);
  };

  const renderEditor = () => {
    switch (node.type) {
      case 'start':
        return (
          <div className="space-y-4">
            <div>
              <Label>Rótulo</Label>
              <Input
                value={(localData.label as string) || ''}
                onChange={(e) => handleChange('label', e.target.value)}
                placeholder="Início"
              />
            </div>
          </div>
        );

      case 'message':
        return (
          <div className="space-y-4">
            <div>
              <Label>Mensagem</Label>
              <Textarea
                value={(localData.content as string) || ''}
                onChange={(e) => handleChange('content', e.target.value)}
                placeholder="Digite a mensagem..."
                rows={4}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Use {'{{variavel}}'} para inserir variáveis
              </p>
            </div>

            <div>
              <Label>URL de Mídia (opcional)</Label>
              <Input
                value={(localData.mediaUrl as string) || ''}
                onChange={(e) => handleChange('mediaUrl', e.target.value)}
                placeholder="https://..."
              />
            </div>

            {localData.mediaUrl && (
              <div>
                <Label>Tipo de Mídia</Label>
                <Select
                  value={(localData.mediaType as string) || 'image'}
                  onValueChange={(v) => handleChange('mediaType', v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="image">Imagem</SelectItem>
                    <SelectItem value="video">Vídeo</SelectItem>
                    <SelectItem value="audio">Áudio</SelectItem>
                    <SelectItem value="document">Documento</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <ButtonsEditor
              buttons={(localData.buttons as { id: string; label: string; action: string; value: string }[]) || []}
              onChange={(buttons) => handleChange('buttons', buttons)}
            />
          </div>
        );

      case 'question':
        return (
          <div className="space-y-4">
            <div>
              <Label>Pergunta</Label>
              <Textarea
                value={(localData.question as string) || ''}
                onChange={(e) => handleChange('question', e.target.value)}
                placeholder="Qual é o seu nome?"
                rows={2}
              />
            </div>

            <div>
              <Label>Nome da Variável</Label>
              <Input
                value={(localData.variableName as string) || ''}
                onChange={(e) => handleChange('variableName', e.target.value)}
                placeholder="nome"
              />
            </div>

            <div>
              <Label>Validação</Label>
              <Select
                value={(localData.validation as string) || 'text'}
                onValueChange={(v) => handleChange('validation', v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Texto livre</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="phone">Telefone</SelectItem>
                  <SelectItem value="number">Número</SelectItem>
                  <SelectItem value="date">Data</SelectItem>
                  <SelectItem value="cpf">CPF</SelectItem>
                  <SelectItem value="cnpj">CNPJ</SelectItem>
                  <SelectItem value="custom">Regex personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {localData.validation === 'custom' && (
              <div>
                <Label>Regex de Validação</Label>
                <Input
                  value={(localData.customValidationRegex as string) || ''}
                  onChange={(e) => handleChange('customValidationRegex', e.target.value)}
                  placeholder="^[A-Z]+$"
                />
              </div>
            )}

            <div>
              <Label>Mensagem de Erro</Label>
              <Input
                value={(localData.errorMessage as string) || ''}
                onChange={(e) => handleChange('errorMessage', e.target.value)}
                placeholder="Resposta inválida, tente novamente."
              />
            </div>

            <div>
              <Label>Máximo de Tentativas</Label>
              <Input
                type="number"
                value={(localData.maxRetries as number) || 3}
                onChange={(e) => handleChange('maxRetries', parseInt(e.target.value))}
                min={1}
                max={10}
              />
            </div>
          </div>
        );

      case 'menu':
        return (
          <div className="space-y-4">
            <div>
              <Label>Título do Menu</Label>
              <Input
                value={(localData.title as string) || ''}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder="Escolha uma opção:"
              />
            </div>

            <MenuOptionsEditor
              options={(localData.options as { id: string; label: string; value: string; emoji?: string }[]) || []}
              onChange={(options) => handleChange('options', options)}
            />

            <div className="flex items-center justify-between">
              <div>
                <Label>Permitir resposta digitada</Label>
                <p className="text-xs text-muted-foreground">Aceitar texto além das opções</p>
              </div>
              <Switch
                checked={(localData.allowTypedResponse as boolean) || false}
                onCheckedChange={(v) => handleChange('allowTypedResponse', v)}
              />
            </div>

            <div>
              <Label>Mensagem para opção inválida</Label>
              <Input
                value={(localData.invalidOptionMessage as string) || ''}
                onChange={(e) => handleChange('invalidOptionMessage', e.target.value)}
                placeholder="Opção inválida. Escolha uma das opções acima."
              />
            </div>
          </div>
        );

      case 'condition':
        return (
          <div className="space-y-4">
            <ConditionsEditor
              conditions={(localData.conditions as { id: string; variable: string; operator: string; value: string }[]) || []}
              onChange={(conditions) => handleChange('conditions', conditions)}
            />
          </div>
        );

      case 'delay':
        return (
          <div className="space-y-4">
            <div>
              <Label>Tipo de Delay</Label>
              <Select
                value={(localData.delayType as string) || 'typing'}
                onValueChange={(v) => handleChange('delayType', v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="typing">Simulando digitação</SelectItem>
                  <SelectItem value="fixed">Tempo fixo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Duração (ms)</Label>
              <Input
                type="number"
                value={(localData.delayMs as number) || 1000}
                onChange={(e) => handleChange('delayMs', parseInt(e.target.value))}
                min={100}
                max={30000}
                step={100}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                {((localData.delayMs as number) || 1000) / 1000} segundos
              </p>
            </div>

            {localData.delayType === 'typing' && (
              <div className="flex items-center justify-between">
                <Label>Mostrar indicador de digitação</Label>
                <Switch
                  checked={(localData.showTypingIndicator as boolean) !== false}
                  onCheckedChange={(v) => handleChange('showTypingIndicator', v)}
                />
              </div>
            )}
          </div>
        );

      case 'handoff':
        return (
          <div className="space-y-4">
            <div>
              <Label>Mensagem de Transferência</Label>
              <Textarea
                value={(localData.message as string) || ''}
                onChange={(e) => handleChange('message', e.target.value)}
                placeholder="Transferindo para um atendente. Aguarde um momento!"
                rows={2}
              />
            </div>

            <div>
              <Label>Prioridade</Label>
              <Select
                value={(localData.priority as string) || 'normal'}
                onValueChange={(v) => handleChange('priority', v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Baixa</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="urgent">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Nota para o Atendente</Label>
              <Textarea
                value={(localData.transferNote as string) || ''}
                onChange={(e) => handleChange('transferNote', e.target.value)}
                placeholder="Informações adicionais para o atendente..."
                rows={2}
              />
            </div>
          </div>
        );

      case 'ai_response':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Usar Base de Conhecimento</Label>
                <p className="text-xs text-muted-foreground">Buscar em documentos e FAQs</p>
              </div>
              <Switch
                checked={(localData.useKnowledgeBase as boolean) || false}
                onCheckedChange={(v) => handleChange('useKnowledgeBase', v)}
              />
            </div>

            <div>
              <Label>Prompt Personalizado (opcional)</Label>
              <Textarea
                value={(localData.prompt as string) || ''}
                onChange={(e) => handleChange('prompt', e.target.value)}
                placeholder="Instruções adicionais para a IA..."
                rows={3}
              />
            </div>

            <div>
              <Label>Temperatura</Label>
              <Input
                type="number"
                value={(localData.temperature as number) || 0.7}
                onChange={(e) => handleChange('temperature', parseFloat(e.target.value))}
                min={0}
                max={1}
                step={0.1}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Menor = mais focado, Maior = mais criativo
              </p>
            </div>

            <div>
              <Label>Mensagem de Fallback</Label>
              <Input
                value={(localData.fallbackMessage as string) || ''}
                onChange={(e) => handleChange('fallbackMessage', e.target.value)}
                placeholder="Desculpe, não consegui encontrar uma resposta."
              />
            </div>
          </div>
        );

      case 'webhook':
        return (
          <div className="space-y-4">
            <div>
              <Label>URL</Label>
              <Input
                value={(localData.url as string) || ''}
                onChange={(e) => handleChange('url', e.target.value)}
                placeholder="https://api.example.com/endpoint"
              />
            </div>

            <div>
              <Label>Método</Label>
              <Select
                value={(localData.method as string) || 'POST'}
                onValueChange={(v) => handleChange('method', v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GET">GET</SelectItem>
                  <SelectItem value="POST">POST</SelectItem>
                  <SelectItem value="PUT">PUT</SelectItem>
                  <SelectItem value="PATCH">PATCH</SelectItem>
                  <SelectItem value="DELETE">DELETE</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Body (JSON)</Label>
              <Textarea
                value={(localData.body as string) || ''}
                onChange={(e) => handleChange('body', e.target.value)}
                placeholder='{"nome": "{{nome}}", "email": "{{email}}"}'
                rows={4}
                className="font-mono text-sm"
              />
            </div>

            <div>
              <Label>Variável para Resposta</Label>
              <Input
                value={(localData.responseVariable as string) || ''}
                onChange={(e) => handleChange('responseVariable', e.target.value)}
                placeholder="api_response"
              />
            </div>

            <div>
              <Label>Timeout (ms)</Label>
              <Input
                type="number"
                value={(localData.timeout as number) || 30000}
                onChange={(e) => handleChange('timeout', parseInt(e.target.value))}
                min={1000}
                max={120000}
              />
            </div>
          </div>
        );

      case 'set_variable':
        return (
          <div className="space-y-4">
            <div>
              <Label>Nome da Variável</Label>
              <Input
                value={(localData.variableName as string) || ''}
                onChange={(e) => handleChange('variableName', e.target.value)}
                placeholder="minha_variavel"
              />
            </div>

            <div>
              <Label>Tipo de Valor</Label>
              <Select
                value={(localData.valueType as string) || 'static'}
                onValueChange={(v) => handleChange('valueType', v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="static">Valor estático</SelectItem>
                  <SelectItem value="expression">Expressão</SelectItem>
                  <SelectItem value="from_response">Da última resposta</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Valor</Label>
              <Input
                value={(localData.value as string) || ''}
                onChange={(e) => handleChange('value', e.target.value)}
                placeholder={
                  localData.valueType === 'expression'
                    ? '{{nome}} + " " + {{sobrenome}}'
                    : 'valor'
                }
              />
            </div>
          </div>
        );

      case 'end':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Encerrar Conversa</Label>
                <p className="text-xs text-muted-foreground">Marcar conversa como resolvida</p>
              </div>
              <Switch
                checked={(localData.closeConversation as boolean) || false}
                onCheckedChange={(v) => handleChange('closeConversation', v)}
              />
            </div>

            <div>
              <Label>Mensagem Final (opcional)</Label>
              <Textarea
                value={(localData.endMessage as string) || ''}
                onChange={(e) => handleChange('endMessage', e.target.value)}
                placeholder="Obrigado pelo contato!"
                rows={2}
              />
            </div>
          </div>
        );

      default:
        return (
          <p className="text-sm text-muted-foreground">
            Editor não disponível para este tipo de nó.
          </p>
        );
    }
  };

  return (
    <div className="w-80 border-l bg-background">
      <div className="flex items-center justify-between border-b p-4">
        <div className="flex items-center gap-2">
          <div
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: nodeInfo.color }}
          />
          <span className="font-medium">{nodeInfo.label}</span>
        </div>
        <div className="flex gap-1">
          {node.type !== 'start' && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(node.id)}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <ScrollArea className="h-[calc(100vh-200px)]">
        <div className="p-4">{renderEditor()}</div>
      </ScrollArea>
    </div>
  );
});

// Sub-components for editors

function ButtonsEditor({
  buttons,
  onChange,
}: {
  buttons: { id: string; label: string; action: string; value: string }[];
  onChange: (buttons: { id: string; label: string; action: string; value: string }[]) => void;
}) {
  const addButton = () => {
    onChange([
      ...buttons,
      { id: crypto.randomUUID(), label: '', action: 'next_node', value: '' },
    ]);
  };

  const updateButton = (index: number, field: string, value: string) => {
    const newButtons = [...buttons];
    newButtons[index] = { ...newButtons[index], [field]: value };
    onChange(newButtons);
  };

  const removeButton = (index: number) => {
    onChange(buttons.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>Botões</Label>
        <Button variant="ghost" size="sm" onClick={addButton}>
          <Plus className="mr-1 h-3 w-3" />
          Adicionar
        </Button>
      </div>

      {buttons.map((btn, index) => (
        <div key={btn.id} className="flex items-center gap-2 rounded border p-2">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
          <Input
            value={btn.label}
            onChange={(e) => updateButton(index, 'label', e.target.value)}
            placeholder="Texto do botão"
            className="flex-1"
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => removeButton(index)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  );
}

function MenuOptionsEditor({
  options,
  onChange,
}: {
  options: { id: string; label: string; value: string; emoji?: string }[];
  onChange: (options: { id: string; label: string; value: string; emoji?: string }[]) => void;
}) {
  const addOption = () => {
    onChange([
      ...options,
      { id: crypto.randomUUID(), label: '', value: `option_${options.length + 1}` },
    ]);
  };

  const updateOption = (index: number, field: string, value: string) => {
    const newOptions = [...options];
    newOptions[index] = { ...newOptions[index], [field]: value };
    onChange(newOptions);
  };

  const removeOption = (index: number) => {
    onChange(options.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>Opções</Label>
        <Button variant="ghost" size="sm" onClick={addOption}>
          <Plus className="mr-1 h-3 w-3" />
          Adicionar
        </Button>
      </div>

      {options.map((opt, index) => (
        <div key={opt.id} className="space-y-1 rounded border p-2">
          <div className="flex items-center gap-2">
            <Input
              value={opt.emoji || ''}
              onChange={(e) => updateOption(index, 'emoji', e.target.value)}
              placeholder="1"
              className="w-12 text-center"
            />
            <Input
              value={opt.label}
              onChange={(e) => updateOption(index, 'label', e.target.value)}
              placeholder="Texto da opção"
              className="flex-1"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => removeOption(index)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
          <Input
            value={opt.value}
            onChange={(e) => updateOption(index, 'value', e.target.value)}
            placeholder="valor_interno"
            className="text-xs"
          />
        </div>
      ))}
    </div>
  );
}

function ConditionsEditor({
  conditions,
  onChange,
}: {
  conditions: { id: string; variable: string; operator: string; value: string }[];
  onChange: (conditions: { id: string; variable: string; operator: string; value: string }[]) => void;
}) {
  const addCondition = () => {
    onChange([
      ...conditions,
      { id: crypto.randomUUID(), variable: '', operator: 'equals', value: '' },
    ]);
  };

  const updateCondition = (index: number, field: string, value: string) => {
    const newConditions = [...conditions];
    newConditions[index] = { ...newConditions[index], [field]: value };
    onChange(newConditions);
  };

  const removeCondition = (index: number) => {
    onChange(conditions.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>Condições</Label>
        <Button variant="ghost" size="sm" onClick={addCondition}>
          <Plus className="mr-1 h-3 w-3" />
          Adicionar
        </Button>
      </div>

      {conditions.map((cond, index) => (
        <div key={cond.id} className="space-y-2 rounded border p-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">Se</span>
            <Input
              value={cond.variable}
              onChange={(e) => updateCondition(index, 'variable', e.target.value)}
              placeholder="variavel"
              className="flex-1"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => removeCondition(index)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={cond.operator}
              onValueChange={(v) => updateCondition(index, 'operator', v)}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="equals">igual a</SelectItem>
                <SelectItem value="not_equals">diferente de</SelectItem>
                <SelectItem value="contains">contém</SelectItem>
                <SelectItem value="not_contains">não contém</SelectItem>
                <SelectItem value="greater">maior que</SelectItem>
                <SelectItem value="less">menor que</SelectItem>
                <SelectItem value="exists">existe</SelectItem>
                <SelectItem value="not_exists">não existe</SelectItem>
                <SelectItem value="regex">regex</SelectItem>
              </SelectContent>
            </Select>
            <Input
              value={cond.value}
              onChange={(e) => updateCondition(index, 'value', e.target.value)}
              placeholder="valor"
              className="flex-1"
            />
          </div>
        </div>
      ))}

      {conditions.length > 0 && (
        <p className="text-xs text-muted-foreground">
          Conexões não correspondentes irão para a saída padrão
        </p>
      )}
    </div>
  );
}
