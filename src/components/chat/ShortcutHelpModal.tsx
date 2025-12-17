import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Keyboard, Zap, Star, Tag } from 'lucide-react';

interface ShortcutHelpModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ShortcutHelpModal = ({ open, onOpenChange }: ShortcutHelpModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Atalhos de Teclado
          </DialogTitle>
          <DialogDescription>Use atalhos para aumentar sua produtividade no chat</DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-6">
            {/* Atalhos de Mensagem */}
            <section>
              <h3 className="font-semibold flex items-center gap-2 mb-3">
                <Zap className="h-4 w-4 text-primary" />
                Atalhos de Mensagem
              </h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                  <div>
                    <span className="font-medium">/</span>
                    <span className="text-muted-foreground ml-2">
                      Inicia modo de atalhos rápidos
                    </span>
                  </div>
                  <Badge variant="outline" className="font-mono">
                    /
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                  <div>
                    <span className="font-medium">/agend</span>
                    <span className="text-muted-foreground ml-2">
                      Exemplo: insere template de agendamento
                    </span>
                  </div>
                  <Badge variant="outline" className="font-mono">
                    /agend
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                  <div>
                    <span className="font-medium">/preco</span>
                    <span className="text-muted-foreground ml-2">
                      Exemplo: insere template de preços
                    </span>
                  </div>
                  <Badge variant="outline" className="font-mono">
                    /preco
                  </Badge>
                </div>
              </div>
            </section>

            {/* Navegação */}
            <section>
              <h3 className="font-semibold flex items-center gap-2 mb-3">
                <Keyboard className="h-4 w-4 text-blue-500" />
                Navegação nos Atalhos
              </h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                  <span className="text-muted-foreground">Navegar para cima</span>
                  <Badge variant="outline" className="font-mono">
                    ↑
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                  <span className="text-muted-foreground">Navegar para baixo</span>
                  <Badge variant="outline" className="font-mono">
                    ↓
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                  <span className="text-muted-foreground">Selecionar atalho</span>
                  <div className="flex gap-1">
                    <Badge variant="outline" className="font-mono">
                      Enter
                    </Badge>
                    <span className="text-muted-foreground">ou</span>
                    <Badge variant="outline" className="font-mono">
                      Tab
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                  <span className="text-muted-foreground">Fechar sugestões</span>
                  <Badge variant="outline" className="font-mono">
                    Esc
                  </Badge>
                </div>
              </div>
            </section>

            {/* Atalhos Gerais */}
            <section>
              <h3 className="font-semibold flex items-center gap-2 mb-3">
                <Star className="h-4 w-4 text-yellow-500" />
                Atalhos Gerais do Chat
              </h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                  <span className="text-muted-foreground">Nota interna</span>
                  <Badge variant="outline" className="font-mono">
                    Ctrl+Shift+N
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                  <span className="text-muted-foreground">Abrir labels</span>
                  <Badge variant="outline" className="font-mono">
                    L
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                  <span className="text-muted-foreground">Enviar mensagem</span>
                  <Badge variant="outline" className="font-mono">
                    Enter
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                  <span className="text-muted-foreground">Nova linha</span>
                  <Badge variant="outline" className="font-mono">
                    Shift+Enter
                  </Badge>
                </div>
              </div>
            </section>

            {/* Variáveis */}
            <section>
              <h3 className="font-semibold flex items-center gap-2 mb-3">
                <Tag className="h-4 w-4 text-green-500" />
                Variáveis Disponíveis
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 rounded-md bg-muted/50">
                  <Badge variant="outline" className="font-mono mb-1">
                    {'{{nome}}'}
                  </Badge>
                  <p className="text-xs text-muted-foreground">Nome do contato</p>
                </div>
                <div className="p-2 rounded-md bg-muted/50">
                  <Badge variant="outline" className="font-mono mb-1">
                    {'{{empresa}}'}
                  </Badge>
                  <p className="text-xs text-muted-foreground">Empresa do contato</p>
                </div>
                <div className="p-2 rounded-md bg-muted/50">
                  <Badge variant="outline" className="font-mono mb-1">
                    {'{{telefone}}'}
                  </Badge>
                  <p className="text-xs text-muted-foreground">Telefone do contato</p>
                </div>
                <div className="p-2 rounded-md bg-muted/50">
                  <Badge variant="outline" className="font-mono mb-1">
                    {'{{vendedor}}'}
                  </Badge>
                  <p className="text-xs text-muted-foreground">Nome do vendedor</p>
                </div>
                <div className="p-2 rounded-md bg-muted/50">
                  <Badge variant="outline" className="font-mono mb-1">
                    {'{{data}}'}
                  </Badge>
                  <p className="text-xs text-muted-foreground">Data atual</p>
                </div>
                <div className="p-2 rounded-md bg-muted/50">
                  <Badge variant="outline" className="font-mono mb-1">
                    {'{{hora}}'}
                  </Badge>
                  <p className="text-xs text-muted-foreground">Hora atual</p>
                </div>
              </div>
            </section>

            {/* Dica */}
            <section className="bg-primary/5 border border-primary/20 rounded-lg p-4">
              <h4 className="font-medium text-primary mb-2">💡 Dica</h4>
              <p className="text-sm text-muted-foreground">
                Você pode criar seus próprios atalhos! Vá em <strong>Templates</strong> e adicione
                um atalho (ex: /agend) ao criar ou editar um template.
              </p>
            </section>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
