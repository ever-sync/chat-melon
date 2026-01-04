/**
 * EXEMPLO DE USO DO SISTEMA DE VARIÁVEIS AUTOMÁTICAS
 *
 * Este arquivo demonstra como usar variáveis de contato em diferentes contextos
 */

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { VariablesPicker } from '@/components/variables/VariablesPicker';
import { useContactVariables, replaceContactVariables } from '@/hooks/useContactVariables';
import { useVariables } from '@/hooks/useVariables';

// ============================================
// EXEMPLO 1: Usar o componente VariablesPicker
// ============================================

export function ExemploMessageComposer() {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  return (
    <Card className="p-4">
      <h3 className="font-semibold mb-2">Escrever Mensagem</h3>

      {/* Botão para inserir variáveis */}
      <VariablesPicker
        onSelect={(key) => {
          // Inserir a variável no cursor
          const ref = textareaRef.current;
          if (ref) {
            const start = ref.selectionStart || 0;
            const end = ref.selectionEnd || 0;
            const before = message.substring(0, start);
            const after = message.substring(end);
            const variable = `{{${key}}}`;

            setMessage(before + variable + after);

            // Move cursor para depois da variável
            setTimeout(() => {
              ref.focus();
              const newPos = start + variable.length;
              ref.setSelectionRange(newPos, newPos);
            }, 0);
          }
        }}
        buttonText="Inserir Variável"
        buttonVariant="outline"
        showPreview={true}
      />

      <Textarea
        ref={textareaRef}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Olá {{nome}}, tudo bem?"
        rows={4}
        className="mt-2"
      />
    </Card>
  );
}

// ============================================
// EXEMPLO 2: Usar o hook para listar variáveis
// ============================================

export function ExemploVariablesList() {
  const {
    allVariables,
    defaultVariables,
    companyVariables,
    customVariables
  } = useContactVariables();

  return (
    <Card className="p-4">
      <h3 className="font-semibold mb-4">Variáveis Disponíveis</h3>

      {/* Variáveis Padrão */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-500 mb-2">PADRÃO DO SISTEMA</h4>
        {defaultVariables.map((v) => (
          <div key={v.key} className="flex items-center gap-2 text-sm py-1">
            <code className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
              {`{{${v.key}}}`}
            </code>
            <span>{v.label}</span>
          </div>
        ))}
      </div>

      {/* Variáveis da Empresa */}
      {companyVariables.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-500 mb-2">DA EMPRESA</h4>
          {companyVariables.map((v) => (
            <div key={v.key} className="flex items-center gap-2 text-sm py-1">
              <code className="bg-purple-100 text-purple-800 px-2 py-1 rounded">
                {`{{${v.key}}}`}
              </code>
              <span>{v.label}</span>
              {v.value && (
                <span className="text-gray-400 text-xs">= {v.value}</span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Campos Personalizados (AUTO-SYNC) */}
      {customVariables.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-500 mb-2">
            CAMPOS PERSONALIZADOS
            <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
              AUTO-SYNC
            </span>
          </h4>
          {customVariables.map((v) => (
            <div key={v.key} className="flex items-center gap-2 text-sm py-1">
              <code className="bg-green-100 text-green-800 px-2 py-1 rounded">
                {`{{${v.key}}}`}
              </code>
              <span>{v.label}</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

// ============================================
// EXEMPLO 3: Substituir variáveis em texto
// ============================================

export function ExemploReplaceVariables() {
  const { variables: companyVariables } = useVariables();
  const [template, setTemplate] = useState('Olá {{nome}}, sua empresa {{empresa}} está confirmada!');

  // Dados de exemplo de um contato
  const exampleContact = {
    name: 'João Silva',
    email: 'joao@empresa.com',
    phone_number: '5511999999999',
    company_data: {
      name: 'Empresa ABC Ltda'
    },
    custom_field_values: {
      cargo: 'Diretor Comercial',
      setor: 'Vendas'
    }
  };

  const replacedText = replaceContactVariables(template, exampleContact, companyVariables);

  return (
    <Card className="p-4">
      <h3 className="font-semibold mb-4">Preview de Substituição</h3>

      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-gray-500">Template:</label>
          <Textarea
            value={template}
            onChange={(e) => setTemplate(e.target.value)}
            rows={3}
            className="mt-1 font-mono text-sm"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-500">Resultado:</label>
          <div className="mt-1 p-3 bg-gray-50 rounded border border-gray-200">
            {replacedText}
          </div>
        </div>
      </div>
    </Card>
  );
}

// ============================================
// EXEMPLO 4: Validar variáveis em um texto
// ============================================

export function ExemploValidateVariables() {
  const [text, setText] = useState('Olá {{nome}}, seu {{campo_invalido}} está pronto!');

  // Mock validation - em produção, use o hook real
  const validateVariables = (text: string) => {
    const pattern = /\{\{(\w+)\}\}/g;
    const matches = Array.from(text.matchAll(pattern));

    // Variáveis conhecidas
    const validKeys = new Set(['nome', 'email', 'telefone', 'empresa']);

    const invalidVariables = matches
      .map(m => m[1])
      .filter(key => !validKeys.has(key));

    return {
      valid: invalidVariables.length === 0,
      invalidVariables: Array.from(new Set(invalidVariables))
    };
  };

  const validation = validateVariables(text);

  return (
    <Card className="p-4">
      <h3 className="font-semibold mb-4">Validação de Variáveis</h3>

      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        className={`mb-2 ${!validation.valid ? 'border-red-500' : 'border-green-500'}`}
      />

      {validation.valid ? (
        <div className="text-sm text-green-600 flex items-center gap-2">
          ✓ Todas as variáveis são válidas
        </div>
      ) : (
        <div className="text-sm text-red-600">
          ✗ Variáveis inválidas: {validation.invalidVariables.join(', ')}
        </div>
      )}
    </Card>
  );
}

// ============================================
// EXEMPLO 5: Usar em formulário com múltiplos campos
// ============================================

export function ExemploFormWithVariables() {
  const [formData, setFormData] = useState({
    subject: '',
    body: '',
    footer: ''
  });

  const subjectRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const footerRef = useRef<HTMLTextAreaElement>(null);

  const insertVariable = (field: 'subject' | 'body' | 'footer', variableKey: string) => {
    const refs = {
      subject: subjectRef,
      body: bodyRef,
      footer: footerRef
    };

    const ref = refs[field].current;
    const currentValue = formData[field];

    if (ref) {
      const start = ref.selectionStart || 0;
      const end = ref.selectionEnd || 0;
      const before = currentValue.substring(0, start);
      const after = currentValue.substring(end);
      const variable = `{{${variableKey}}}`;

      setFormData({
        ...formData,
        [field]: before + variable + after
      });

      setTimeout(() => {
        ref.focus();
        const newPos = start + variable.length;
        ref.setSelectionRange(newPos, newPos);
      }, 0);
    }
  };

  return (
    <Card className="p-4">
      <h3 className="font-semibold mb-4">Email com Variáveis</h3>

      <div className="space-y-4">
        {/* Assunto */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium">Assunto</label>
            <VariablesPicker
              onSelect={(key) => insertVariable('subject', key)}
              buttonSize="sm"
              buttonVariant="ghost"
            />
          </div>
          <Input
            ref={subjectRef}
            value={formData.subject}
            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            placeholder="Olá {{nome}}"
          />
        </div>

        {/* Corpo */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium">Mensagem</label>
            <VariablesPicker
              onSelect={(key) => insertVariable('body', key)}
              buttonSize="sm"
              buttonVariant="ghost"
            />
          </div>
          <Textarea
            ref={bodyRef}
            value={formData.body}
            onChange={(e) => setFormData({ ...formData, body: e.target.value })}
            placeholder="Prezado {{nome}}, sua empresa {{empresa}}..."
            rows={6}
          />
        </div>

        {/* Rodapé */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium">Rodapé</label>
            <VariablesPicker
              onSelect={(key) => insertVariable('footer', key)}
              buttonSize="sm"
              buttonVariant="ghost"
            />
          </div>
          <Textarea
            ref={footerRef}
            value={formData.footer}
            onChange={(e) => setFormData({ ...formData, footer: e.target.value })}
            placeholder="Atenciosamente, {{nome_empresa}}"
            rows={2}
          />
        </div>

        <Button className="w-full">
          Enviar Email
        </Button>
      </div>
    </Card>
  );
}

// ============================================
// EXEMPLO 6: Usar variáveis na IA
// ============================================

import { getContactVariablesContext, buildAIVariablesPrompt } from '@/lib/ai/contactVariablesContext';

export async function exemploUsoNaIA(contactId: string, companyId: string) {
  // 1. Buscar contexto de variáveis do contato
  const context = await getContactVariablesContext(contactId, companyId);

  if (!context) {
    console.error('Não foi possível obter contexto de variáveis');
    return;
  }

  // 2. Montar prompt com as variáveis disponíveis
  const variablesPrompt = buildAIVariablesPrompt(context);

  // 3. Usar no prompt da IA
  const fullPrompt = `
${variablesPrompt}

TAREFA:
Gerar uma mensagem de follow-up profissional para o cliente, usando as variáveis apropriadas.
  `;

  console.log('Prompt para IA:', fullPrompt);

  // 4. Enviar para a IA (exemplo)
  // const aiResponse = await callAI(fullPrompt);

  // A resposta da IA pode incluir variáveis como:
  // "Olá {{nome}}, espero que esteja bem. Vi que você trabalha em {{empresa}} como {{cargo}}..."
}

// ============================================
// EXEMPLO DE PÁGINA COMPLETA
// ============================================

export function PaginaExemploVariaveis() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Exemplos de Uso de Variáveis</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ExemploMessageComposer />
        <ExemploVariablesList />
        <ExemploReplaceVariables />
        <ExemploValidateVariables />
      </div>

      <ExemploFormWithVariables />
    </div>
  );
}
