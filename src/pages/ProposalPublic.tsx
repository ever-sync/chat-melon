import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import SignatureCanvas from "react-signature-canvas";
import { toast } from "sonner";

export const ProposalPublic = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [proposal, setProposal] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [clientName, setClientName] = useState("");
  const [clientDocument, setClientDocument] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [processing, setProcessing] = useState(false);
  const signatureRef = useRef<SignatureCanvas>(null);

  useEffect(() => {
    if (slug) {
      loadProposal();
      trackView();
    }
  }, [slug]);

  const loadProposal = async () => {
    try {
      const { data, error } = await supabase
        .from("proposals")
        .select(`
          *,
          deals (
            id,
            title,
            contacts (
              name,
              phone_number,
              company_id
            )
          )
        `)
        .eq("public_link", slug)
        .maybeSingle();

      if (error) throw error;
      setProposal(data);
    } catch (error) {
      console.error("Erro ao carregar proposta:", error);
      toast.error("Proposta não encontrada");
    } finally {
      setLoading(false);
    }
  };

  const trackView = async () => {
    try {
      // Registrar visualização
      await supabase.from("proposal_views").insert({
        proposal_id: proposal?.id,
        session_id: crypto.randomUUID(),
      });

      // Se é primeira visualização, atualizar status
      if (proposal && !proposal.viewed_at) {
        await supabase
          .from("proposals")
          .update({
            viewed_at: new Date().toISOString(),
            status: "viewed",
          })
          .eq("id", proposal.id);
      }
    } catch (error) {
      console.error("Erro ao registrar visualização:", error);
    }
  };

  const handleApprove = async () => {
    if (!clientName.trim() || !signatureRef.current?.isEmpty()) {
      toast.error("Preencha todos os campos e assine");
      return;
    }

    setProcessing(true);
    try {
      const signatureData = signatureRef.current?.toDataURL();

      const { error } = await supabase.functions.invoke("approve-proposal", {
        body: {
          proposalId: proposal.id,
          clientName,
          clientDocument,
          signatureData,
        },
      });

      if (error) throw error;

      toast.success("Proposta aprovada com sucesso!");
      setShowApproveDialog(false);
      loadProposal();
    } catch (error) {
      console.error("Erro ao aprovar:", error);
      toast.error("Erro ao aprovar proposta");
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error("Informe o motivo da rejeição");
      return;
    }

    setProcessing(true);
    try {
      const { error } = await supabase
        .from("proposals")
        .update({
          status: "rejected",
          rejected_at: new Date().toISOString(),
          rejection_reason: rejectionReason,
        })
        .eq("id", proposal.id);

      if (error) throw error;

      toast.success("Resposta enviada ao vendedor");
      setShowRejectDialog(false);
      loadProposal();
    } catch (error) {
      console.error("Erro ao rejeitar:", error);
      toast.error("Erro ao processar solicitação");
    } finally {
      setProcessing(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Proposta não encontrada</h1>
          <p className="text-muted-foreground">O link pode estar inválido ou expirado</p>
        </div>
      </div>
    );
  }

  const items = Array.isArray(proposal.items) ? proposal.items : [];
  const isExpired = proposal.validity_days && 
    new Date(proposal.created_at).getTime() + (proposal.validity_days * 24 * 60 * 60 * 1000) < Date.now();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl mb-2">{proposal.title}</CardTitle>
                <p className="text-muted-foreground">
                  Para: {proposal.deals?.contacts?.name}
                </p>
              </div>
              <Badge variant={proposal.status === 'accepted' ? 'default' : proposal.status === 'rejected' ? 'destructive' : 'secondary'}>
                {proposal.status === 'accepted' ? '✓ Aprovada' : proposal.status === 'rejected' ? '✗ Rejeitada' : 'Pendente'}
              </Badge>
            </div>
          </CardHeader>
        </Card>

        {/* Itens */}
        <Card>
          <CardHeader>
            <CardTitle>Itens da Proposta</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {items.map((item: any, index: number) => (
                <div key={index} className="flex justify-between items-start p-3 bg-muted/30 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">{item.name}</p>
                    {item.description && (
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    )}
                    <p className="text-sm mt-1">
                      {item.quantity}x {formatCurrency(item.unit_price)}
                    </p>
                  </div>
                  <p className="font-semibold">{formatCurrency(item.total)}</p>
                </div>
              ))}
            </div>

            <Separator className="my-4" />

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(proposal.subtotal || 0)}</span>
              </div>
              {proposal.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Desconto</span>
                  <span>- {formatCurrency(proposal.discount)}</span>
                </div>
              )}
              {proposal.tax > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Impostos</span>
                  <span>{formatCurrency(proposal.tax)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>{formatCurrency(proposal.total)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Condições */}
        {proposal.payment_terms && (
          <Card>
            <CardHeader>
              <CardTitle>Condições de Pagamento</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{proposal.payment_terms}</p>
            </CardContent>
          </Card>
        )}

        {proposal.notes && (
          <Card>
            <CardHeader>
              <CardTitle>Observações</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{proposal.notes}</p>
            </CardContent>
          </Card>
        )}

        {/* Ações */}
        {proposal.status === 'draft' || proposal.status === 'sent' || proposal.status === 'viewed' ? (
          <div className="flex gap-4">
            <Button
              size="lg"
              className="flex-1"
              onClick={() => setShowApproveDialog(true)}
              disabled={isExpired}
            >
              <CheckCircle2 className="w-5 h-5 mr-2" />
              Aprovar Proposta
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="flex-1"
              onClick={() => setShowRejectDialog(true)}
            >
              <XCircle className="w-5 h-5 mr-2" />
              Solicitar Ajustes
            </Button>
          </div>
        ) : proposal.status === 'accepted' ? (
          <Card className="bg-green-50 border-green-200">
            <CardContent className="pt-6 text-center">
              <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-2" />
              <p className="font-semibold text-green-900">Proposta Aprovada!</p>
              <p className="text-sm text-green-700 mt-1">Em breve entraremos em contato</p>
            </CardContent>
          </Card>
        ) : proposal.status === 'rejected' && (
          <Card className="bg-orange-50 border-orange-200">
            <CardContent className="pt-6 text-center">
              <XCircle className="w-12 h-12 text-orange-600 mx-auto mb-2" />
              <p className="font-semibold text-orange-900">Ajustes Solicitados</p>
              <p className="text-sm text-orange-700 mt-1">O vendedor está revisando sua solicitação</p>
            </CardContent>
          </Card>
        )}

        {isExpired && (
          <p className="text-center text-sm text-muted-foreground">
            Esta proposta expirou. Entre em contato para uma nova proposta.
          </p>
        )}
      </div>

      {/* Dialog de Aprovação */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Aprovar Proposta</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome Completo *</Label>
              <Input
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Seu nome completo"
              />
            </div>
            <div>
              <Label>CPF/CNPJ (opcional)</Label>
              <Input
                value={clientDocument}
                onChange={(e) => setClientDocument(e.target.value)}
                placeholder="000.000.000-00"
              />
            </div>
            <div>
              <Label>Assinatura Digital *</Label>
              <div className="border rounded-lg bg-white">
                <SignatureCanvas
                  ref={signatureRef}
                  canvasProps={{
                    className: "w-full h-40",
                  }}
                />
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="mt-2"
                onClick={() => signatureRef.current?.clear()}
              >
                Limpar Assinatura
              </Button>
            </div>
            <div className="flex gap-2">
              <Button
                className="flex-1"
                onClick={handleApprove}
                disabled={processing}
              >
                {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirmar Aprovação"}
              </Button>
              <Button variant="outline" onClick={() => setShowApproveDialog(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Rejeição */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Solicitar Ajustes</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Motivo *</Label>
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Descreva os ajustes necessários..."
                rows={4}
              />
            </div>
            <div className="flex gap-2">
              <Button
                className="flex-1"
                onClick={handleReject}
                disabled={processing}
              >
                {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Enviar Solicitação"}
              </Button>
              <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
