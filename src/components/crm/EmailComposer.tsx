import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useEmailTemplates } from '@/hooks/useEmailTemplates';
import DOMPurify from 'dompurify';
import { Send, Eye } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface EmailComposerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  toEmail: string;
  contactId?: string;
  dealId?: string;
  contactName?: string;
  dealTitle?: string;
}

export const EmailComposer = ({
  open,
  onOpenChange,
  toEmail,
  contactId,
  dealId,
  contactName,
  dealTitle,
}: EmailComposerProps) => {
  const { templates, sendEmail } = useEmailTemplates();
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find((t) => t.id === templateId);
    if (template) {
      setSelectedTemplateId(templateId);
      setSubject(replaceVariables(template.subject));
      setBody(replaceVariables(template.body));
    }
  };

  const replaceVariables = (text: string): string => {
    return text
      .replace(/\{\{nome\}\}/g, contactName || 'Cliente')
      .replace(/\{\{empresa\}\}/g, '')
      .replace(/\{\{negocio\}\}/g, dealTitle || '')
      .replace(/\{\{data\}\}/g, new Date().toLocaleDateString('pt-BR'));
  };

  const handleSend = async () => {
    await sendEmail.mutateAsync({
      to_email: toEmail,
      subject,
      body,
      contact_id: contactId,
      deal_id: dealId,
      template_id: selectedTemplateId || undefined,
    });
    onOpenChange(false);
    setSubject('');
    setBody('');
    setSelectedTemplateId('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Enviar Email</DialogTitle>
          <DialogDescription>Para: {toEmail}</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="compose" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="compose">Compor</TabsTrigger>
            <TabsTrigger value="preview" onClick={() => setShowPreview(true)}>
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </TabsTrigger>
          </TabsList>

          <TabsContent value="compose" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Template (Opcional)</Label>
              <Select value={selectedTemplateId} onValueChange={handleTemplateSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um template..." />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Assunto *</Label>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Digite o assunto do email"
              />
            </div>

            <div className="space-y-2">
              <Label>Mensagem (HTML) *</Label>
              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="<p>Digite sua mensagem aqui...</p>"
                rows={12}
              />
              <p className="text-xs text-muted-foreground">
                Você pode usar HTML e variáveis como {`{{nome}}`}, {`{{empresa}}`}, {`{{negocio}}`}
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleSend}
                disabled={!subject || !body || sendEmail.isPending}
                className="flex-1"
              >
                <Send className="h-4 w-4 mr-2" />
                {sendEmail.isPending ? 'Enviando...' : 'Enviar Email'}
              </Button>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="preview" className="mt-4">
            <div className="border rounded-lg p-6 bg-card">
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Para:</p>
                  <p className="font-medium">{toEmail}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Assunto:</p>
                  <p className="font-medium">{subject || '(sem assunto)'}</p>
                </div>
                <div className="border-t pt-4">
                  <div
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{
                      __html: DOMPurify.sanitize(body || '<p>(corpo vazio)</p>'),
                    }}
                  />
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
