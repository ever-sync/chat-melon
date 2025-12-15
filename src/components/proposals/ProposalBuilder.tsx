import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useProducts, Product } from "@/hooks/crm/useProducts";
import { useProposals, ProposalItem, Proposal } from "@/hooks/chat/useProposals";
import { useProposalTemplates, ProposalTemplate } from "@/hooks/useProposalTemplates";
import { ProposalTemplateGallery } from "./ProposalTemplateGallery";
import { ProposalVersionDialog } from "./ProposalVersionDialog";
import { Search, Plus, Trash2, Send, Link as LinkIcon, FileText } from "lucide-react";
import { toast } from "sonner";

interface ProposalBuilderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dealId: string;
  dealTitle: string;
  editingProposal?: Proposal;
}

export const ProposalBuilder = ({ open, onOpenChange, dealId, dealTitle, editingProposal }: ProposalBuilderProps) => {
  const { products } = useProducts();
  const { createProposal, generatePublicLink, updateProposal, createVersion, sendViaWhatsApp } = useProposals();
  const { incrementUsage } = useProposalTemplates();
  
  const [showTemplateGallery, setShowTemplateGallery] = useState(false);
  const [showVersionDialog, setShowVersionDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ProposalTemplate | null>(null);
  const [title, setTitle] = useState("");
  const [items, setItems] = useState<ProposalItem[]>([]);
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">("fixed");
  const [tax, setTax] = useState(0);
  const [paymentTerms, setPaymentTerms] = useState("");
  const [validityDays, setValidityDays] = useState(30);
  const [searchTerm, setSearchTerm] = useState("");
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [notes, setNotes] = useState("");
  const [contactPhone, setContactPhone] = useState("");

  useEffect(() => {
    if (open && dealTitle) {
      if (editingProposal) {
        // Load existing proposal data
        setTitle(editingProposal.title);
        setItems(editingProposal.items);
        setDiscount(editingProposal.discount);
        setDiscountType(editingProposal.discount_type);
        setTax(editingProposal.tax);
        setPaymentTerms(editingProposal.payment_terms || "");
        setValidityDays(editingProposal.validity_days);
        
        // Load contact phone from deal
        if (editingProposal.deals?.contacts?.phone_number) {
          setContactPhone(editingProposal.deals.contacts.phone_number);
        }
      } else {
        setTitle(`Proposta - ${dealTitle}`);
        // Show template gallery on first open
        setShowTemplateGallery(true);
      }
    }
  }, [open, dealTitle, editingProposal]);

  const handleSelectTemplate = async (template: ProposalTemplate) => {
    setSelectedTemplate(template);
    
    // Apply template settings
    if (template.content.sections) {
      const termsSection = template.content.sections.find(s => s.type === "terms");
      if (termsSection?.content) {
        setPaymentTerms(termsSection.content.replace("{{validade}}", validityDays.toString()));
      }
    }
    
    // Increment usage count
    await incrementUsage(template.id);
    toast.success(`Template "${template.name}" aplicado!`);
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addItem = (product: Product) => {
    const existingItem = items.find(i => i.product_id === product.id);
    if (existingItem) {
      setItems(items.map(i =>
        i.product_id === product.id
          ? { ...i, quantity: i.quantity + 1, total: (i.quantity + 1) * i.unit_price }
          : i
      ));
    } else {
      setItems([...items, {
        id: crypto.randomUUID(),
        product_id: product.id,
        name: product.name,
        description: product.description || undefined,
        quantity: 1,
        unit_price: product.price,
        total: product.price,
      }]);
    }
    setSearchTerm("");
  };

  const updateQuantity = (id: string, quantity: number) => {
    setItems(items.map(item =>
      item.id === id
        ? { ...item, quantity, total: quantity * item.unit_price }
        : item
    ));
  };

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const discountAmount = discountType === "percentage"
      ? subtotal * (discount / 100)
      : discount;
    const afterDiscount = subtotal - discountAmount;
    const taxAmount = afterDiscount * (tax / 100);
    const total = afterDiscount + taxAmount;

    return { subtotal, discountAmount, taxAmount, total };
  };

  const { subtotal, discountAmount, taxAmount, total } = calculateTotals();

  const handleSave = async (andSend: boolean = false) => {
    if (!title.trim()) {
      toast.error("Informe o título da proposta");
      return;
    }

    if (items.length === 0) {
      toast.error("Adicione pelo menos um item");
      return;
    }

    // Check if editing a sent proposal - need to create version
    if (editingProposal && editingProposal.status !== "draft") {
      setShowVersionDialog(true);
      return;
    }

    setSaving(true);
    try {
      if (editingProposal) {
        // Update existing draft
        await updateProposal({
          id: editingProposal.id,
          title,
          items: items as any,
          subtotal,
          discount: discountAmount,
          discount_type: discountType,
          tax: taxAmount,
          total,
          payment_terms: paymentTerms || null,
          validity_days: validityDays,
          status: andSend ? "sent" : "draft",
        });
      } else {
        // Create new proposal
        const proposal = await createProposal({
          deal_id: dealId,
          title,
          items: items as any,
          subtotal,
          discount: discountAmount,
          discount_type: discountType,
          tax: taxAmount,
          total,
          payment_terms: paymentTerms || null,
          validity_days: validityDays,
          status: andSend ? "sent" : "draft",
        });

        if (andSend && proposal) {
          const updated = await generatePublicLink(proposal.id);
          const publicUrl = `${window.location.origin}/p/${updated.public_link}`;
          navigator.clipboard.writeText(publicUrl);
          toast.success("Link copiado para área de transferência!");
        }
      }

      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleCreateVersion = async (changeNotes: string) => {
    if (!editingProposal) return;

    setSaving(true);
    try {
      const newVersion = await createVersion({
        originalProposalId: editingProposal.id,
        changeNotes,
      });

      // Now update the new version with current data
      await updateProposal({
        id: newVersion.id,
        title,
        items: items as any,
        subtotal,
        discount: discountAmount,
        discount_type: discountType,
        tax: taxAmount,
        total,
        payment_terms: paymentTerms || null,
        validity_days: validityDays,
      });

      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleSendViaWhatsApp = async () => {
    if (!editingProposal) {
      toast.error("Salve a proposta antes de enviar");
      return;
    }

    if (!contactPhone) {
      toast.error("Número de telefone do contato não encontrado");
      return;
    }

    setSending(true);
    try {
      await sendViaWhatsApp({
        proposalId: editingProposal.id,
        contactPhone,
      });
    } catch (error) {
      console.error(error);
    } finally {
      setSending(false);
    }
  };

  const resetForm = () => {
    setTitle("");
    setItems([]);
    setDiscount(0);
    setTax(0);
    setPaymentTerms("");
    setValidityDays(30);
    setSearchTerm("");
    setNotes("");
    setSelectedTemplate(null);
    setContactPhone("");
  };

  return (
    <>
      <ProposalTemplateGallery
        open={showTemplateGallery}
        onOpenChange={setShowTemplateGallery}
        onSelectTemplate={handleSelectTemplate}
      />

      <ProposalVersionDialog
        open={showVersionDialog}
        onOpenChange={setShowVersionDialog}
        onConfirm={handleCreateVersion}
        proposalTitle={title}
      />

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Criar Proposta Comercial</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Template Info */}
            {selectedTemplate && (
              <div className="flex items-center gap-2 p-3 bg-primary/10 border border-primary/20 rounded-md">
                <FileText className="h-4 w-4 text-primary" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Template: {selectedTemplate.name}</p>
                  {selectedTemplate.description && (
                    <p className="text-xs text-muted-foreground">{selectedTemplate.description}</p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowTemplateGallery(true)}
                >
                  Trocar
                </Button>
              </div>
            )}
          {/* Título */}
          <div>
            <Label>Título da Proposta</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Proposta - Implementação CRM"
            />
          </div>

          {/* Busca de Produtos */}
          <div>
            <Label>Adicionar Produtos</Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar produtos..."
                className="pl-9"
              />
            </div>
            {searchTerm && (
              <div className="mt-2 border rounded-md max-h-48 overflow-y-auto">
                {filteredProducts.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => addItem(product)}
                    className="w-full px-4 py-2 text-left hover:bg-accent flex justify-between items-center"
                  >
                    <div>
                      <div className="font-medium">{product.name}</div>
                      <div className="text-sm text-muted-foreground">{product.description}</div>
                    </div>
                    <div className="font-semibold">
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(product.price)}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Lista de Itens */}
          {items.length > 0 && (
            <div className="border rounded-md">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-2">Produto</th>
                    <th className="text-center p-2 w-24">Qtd</th>
                    <th className="text-right p-2 w-32">Preço Unit.</th>
                    <th className="text-right p-2 w-32">Total</th>
                    <th className="w-12"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} className="border-t">
                      <td className="p-2">
                        <div className="font-medium">{item.name}</div>
                        {item.description && (
                          <div className="text-sm text-muted-foreground">{item.description}</div>
                        )}
                      </td>
                      <td className="p-2">
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 1)}
                          className="w-20 text-center"
                        />
                      </td>
                      <td className="p-2 text-right">
                        {new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        }).format(item.unit_price)}
                      </td>
                      <td className="p-2 text-right font-semibold">
                        {new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        }).format(item.total)}
                      </td>
                      <td className="p-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItem(item.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Cálculos */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Desconto</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  min="0"
                  value={discount}
                  onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                />
                <Select value={discountType} onValueChange={(v: any) => setDiscountType(v)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">R$</SelectItem>
                    <SelectItem value="percentage">%</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Impostos (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={tax}
                onChange={(e) => setTax(parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>

          <div>
            <Label>Condições de Pagamento</Label>
            <Textarea
              value={paymentTerms}
              onChange={(e) => setPaymentTerms(e.target.value)}
              placeholder="Ex: 50% na assinatura, 50% na entrega"
              rows={2}
            />
          </div>

          <div>
            <Label>Validade (dias)</Label>
            <Input
              type="number"
              min="1"
              value={validityDays}
              onChange={(e) => setValidityDays(parseInt(e.target.value) || 30)}
            />
          </div>

          <div>
            <Label>Observações (opcional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notas internas sobre esta proposta..."
              rows={2}
            />
          </div>

          {/* Totais */}
          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span className="font-semibold">
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(subtotal)}
              </span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Desconto:</span>
                <span>
                  -{new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(discountAmount)}
                </span>
              </div>
            )}
            {taxAmount > 0 && (
              <div className="flex justify-between">
                <span>Impostos:</span>
                <span>
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(taxAmount)}
                </span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold border-t pt-2">
              <span>Total:</span>
              <span>
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(total)}
              </span>
            </div>
          </div>

          {/* Ações */}
          <div className="flex gap-2 justify-end">
            {editingProposal && contactPhone && (
              <Button
                variant="default"
                onClick={handleSendViaWhatsApp}
                disabled={sending}
              >
                <Send className="mr-2 h-4 w-4" />
                {sending ? "Enviando..." : "Enviar por WhatsApp"}
              </Button>
            )}
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              variant="secondary"
              onClick={() => handleSave(false)}
              disabled={saving}
            >
              Salvar Rascunho
            </Button>
            <Button onClick={() => handleSave(true)} disabled={saving}>
              <Send className="h-4 w-4 mr-2" />
              Gerar Link e Enviar
            </Button>
          </div>
        </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
