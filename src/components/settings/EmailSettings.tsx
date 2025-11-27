import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Plus, Trash2 } from "lucide-react";
import { useEmailTemplates } from "@/hooks/useEmailTemplates";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

export const EmailSettings = () => {
  const { templates, isLoading, createTemplate, deleteTemplate } = useEmailTemplates();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    name: "",
    subject: "",
    body: "",
    category: "",
  });

  const handleCreateTemplate = async () => {
    await createTemplate.mutateAsync(newTemplate);
    setIsModalOpen(false);
    setNewTemplate({ name: "", subject: "", body: "", category: "" });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Configurações de Email
          </CardTitle>
          <CardDescription>
            Configure templates de email e gerenciamento de envios
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Email Remetente</Label>
            <Input
              type="email"
              placeholder="seu-email@empresa.com"
              value="onboarding@resend.dev"
              disabled
            />
            <p className="text-sm text-muted-foreground">
              Usando Resend para envio de emails. Configure seu domínio no Resend para usar seu próprio email.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Assinatura Padrão</Label>
            <Textarea
              placeholder="Atenciosamente,&#10;Seu Nome&#10;Sua Empresa"
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Templates de Email</CardTitle>
              <CardDescription>
                Crie templates reutilizáveis com variáveis dinâmicas
              </CardDescription>
            </div>
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Template
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Criar Template de Email</DialogTitle>
                  <DialogDescription>
                    Use variáveis como {`{{nome}}`}, {`{{empresa}}`}, {`{{valor}}`}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Nome do Template</Label>
                    <Input
                      value={newTemplate.name}
                      onChange={(e) =>
                        setNewTemplate({ ...newTemplate, name: e.target.value })
                      }
                      placeholder="Ex: Proposta Comercial"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Categoria</Label>
                    <Input
                      value={newTemplate.category}
                      onChange={(e) =>
                        setNewTemplate({ ...newTemplate, category: e.target.value })
                      }
                      placeholder="Ex: Vendas"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Assunto</Label>
                    <Input
                      value={newTemplate.subject}
                      onChange={(e) =>
                        setNewTemplate({ ...newTemplate, subject: e.target.value })
                      }
                      placeholder="Ex: Proposta para {{empresa}}"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Corpo do Email (HTML)</Label>
                    <Textarea
                      value={newTemplate.body}
                      onChange={(e) =>
                        setNewTemplate({ ...newTemplate, body: e.target.value })
                      }
                      placeholder="<p>Olá {{nome}},</p><p>Segue nossa proposta...</p>"
                      rows={10}
                    />
                  </div>
                  <Button
                    onClick={handleCreateTemplate}
                    disabled={!newTemplate.name || !newTemplate.subject || !newTemplate.body}
                    className="w-full"
                  >
                    Criar Template
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Carregando templates...
            </div>
          ) : templates.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum template criado ainda
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {templates.map((template) => (
                  <Card key={template.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium">{template.name}</h4>
                          {template.category && (
                            <span className="text-xs text-muted-foreground">
                              {template.category}
                            </span>
                          )}
                          <p className="text-sm text-muted-foreground mt-1">
                            {template.subject}
                          </p>
                          {template.variables && template.variables.length > 0 && (
                            <div className="flex gap-1 mt-2">
                              {template.variables.map((v) => (
                                <span
                                  key={v}
                                  className="text-xs bg-muted px-2 py-1 rounded"
                                >
                                  {`{{${v}}}`}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteTemplate.mutate(template.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
};