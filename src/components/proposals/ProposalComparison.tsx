import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Proposal, ProposalItem } from '@/hooks/chat/useProposals';
import { Badge } from '@/components/ui/badge';
import { Plus, Minus, Edit } from 'lucide-react';

interface ProposalComparisonProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  version1: Proposal;
  version2: Proposal;
}

export const ProposalComparison = ({
  open,
  onOpenChange,
  version1,
  version2,
}: ProposalComparisonProps) => {
  // Determine which is older
  const [olderVersion, newerVersion] =
    version1.version < version2.version ? [version1, version2] : [version2, version1];

  // Find differences in items
  const getDifferences = () => {
    const added: ProposalItem[] = [];
    const removed: ProposalItem[] = [];
    const modified: { old: ProposalItem; new: ProposalItem }[] = [];

    const olderItems = new Map(olderVersion.items.map((item) => [item.product_id, item]));
    const newerItems = new Map(newerVersion.items.map((item) => [item.product_id, item]));

    // Find added and modified
    newerVersion.items.forEach((newItem) => {
      const oldItem = olderItems.get(newItem.product_id);
      if (!oldItem) {
        added.push(newItem);
      } else if (
        oldItem.quantity !== newItem.quantity ||
        oldItem.unit_price !== newItem.unit_price
      ) {
        modified.push({ old: oldItem, new: newItem });
      }
    });

    // Find removed
    olderVersion.items.forEach((oldItem) => {
      if (!newerItems.has(oldItem.product_id)) {
        removed.push(oldItem);
      }
    });

    return { added, removed, modified };
  };

  const { added, removed, modified } = getDifferences();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>
            Comparação: v{olderVersion.version} → v{newerVersion.version}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[600px] pr-4">
          <div className="space-y-6">
            {/* Summary */}
            <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg">
              <div>
                <div className="text-sm text-muted-foreground mb-1">Versão Anterior</div>
                <div className="font-semibold">v{olderVersion.version}</div>
                <div className="text-sm">Total: {formatCurrency(olderVersion.total)}</div>
                <div className="text-xs text-muted-foreground">
                  {olderVersion.items.length} itens
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Versão Atual</div>
                <div className="font-semibold">v{newerVersion.version}</div>
                <div className="text-sm">Total: {formatCurrency(newerVersion.total)}</div>
                <div className="text-xs text-muted-foreground">
                  {newerVersion.items.length} itens
                </div>
              </div>
            </div>

            {/* Change Notes */}
            {newerVersion.change_notes && (
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-sm font-medium mb-1">Notas de Alteração</div>
                <p className="text-sm text-muted-foreground italic">
                  "{newerVersion.change_notes}"
                </p>
              </div>
            )}

            {/* Added Items */}
            {added.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Plus className="h-5 w-5 text-green-600" />
                  <h3 className="font-semibold">Itens Adicionados ({added.length})</h3>
                </div>
                <div className="space-y-2">
                  {added.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 border border-green-200 bg-green-50 rounded-md"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium">{item.name}</div>
                          {item.description && (
                            <div className="text-sm text-muted-foreground">{item.description}</div>
                          )}
                        </div>
                        <Badge className="bg-green-600 text-white">Novo</Badge>
                      </div>
                      <div className="flex gap-4 mt-2 text-sm">
                        <span>Qtd: {item.quantity}</span>
                        <span>Unit: {formatCurrency(item.unit_price)}</span>
                        <span className="font-semibold">Total: {formatCurrency(item.total)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Removed Items */}
            {removed.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Minus className="h-5 w-5 text-red-600" />
                  <h3 className="font-semibold">Itens Removidos ({removed.length})</h3>
                </div>
                <div className="space-y-2">
                  {removed.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 border border-red-200 bg-red-50 rounded-md opacity-75"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium line-through">{item.name}</div>
                          {item.description && (
                            <div className="text-sm text-muted-foreground line-through">
                              {item.description}
                            </div>
                          )}
                        </div>
                        <Badge className="bg-red-600 text-white">Removido</Badge>
                      </div>
                      <div className="flex gap-4 mt-2 text-sm line-through">
                        <span>Qtd: {item.quantity}</span>
                        <span>Unit: {formatCurrency(item.unit_price)}</span>
                        <span className="font-semibold">Total: {formatCurrency(item.total)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Modified Items */}
            {modified.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Edit className="h-5 w-5 text-yellow-600" />
                  <h3 className="font-semibold">Itens Modificados ({modified.length})</h3>
                </div>
                <div className="space-y-2">
                  {modified.map(({ old: oldItem, new: newItem }) => (
                    <div
                      key={newItem.id}
                      className="p-3 border border-yellow-200 bg-yellow-50 rounded-md"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="font-medium">{newItem.name}</div>
                        <Badge className="bg-yellow-600 text-white">Modificado</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Anterior</div>
                          <div className="space-y-1">
                            <div>Qtd: {oldItem.quantity}</div>
                            <div>Unit: {formatCurrency(oldItem.unit_price)}</div>
                            <div className="font-semibold">
                              Total: {formatCurrency(oldItem.total)}
                            </div>
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Novo</div>
                          <div className="space-y-1">
                            <div
                              className={
                                oldItem.quantity !== newItem.quantity
                                  ? 'text-yellow-700 font-semibold'
                                  : ''
                              }
                            >
                              Qtd: {newItem.quantity}
                            </div>
                            <div
                              className={
                                oldItem.unit_price !== newItem.unit_price
                                  ? 'text-yellow-700 font-semibold'
                                  : ''
                              }
                            >
                              Unit: {formatCurrency(newItem.unit_price)}
                            </div>
                            <div className="font-semibold text-yellow-700">
                              Total: {formatCurrency(newItem.total)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Financial Summary */}
            <div className="p-4 border rounded-lg bg-muted/50">
              <h3 className="font-semibold mb-3">Resumo Financeiro</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Diferença no Subtotal:</span>
                  <span
                    className={
                      newerVersion.subtotal - olderVersion.subtotal > 0
                        ? 'text-green-600 font-semibold'
                        : 'text-red-600 font-semibold'
                    }
                  >
                    {formatCurrency(newerVersion.subtotal - olderVersion.subtotal)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Diferença no Desconto:</span>
                  <span
                    className={
                      newerVersion.discount - olderVersion.discount > 0
                        ? 'text-red-600 font-semibold'
                        : 'text-green-600 font-semibold'
                    }
                  >
                    {formatCurrency(newerVersion.discount - olderVersion.discount)}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t">
                  <span className="font-semibold">Diferença Total:</span>
                  <span
                    className={
                      newerVersion.total - olderVersion.total > 0
                        ? 'text-green-600 font-bold text-lg'
                        : 'text-red-600 font-bold text-lg'
                    }
                  >
                    {formatCurrency(newerVersion.total - olderVersion.total)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
