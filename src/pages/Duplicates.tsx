import { MainLayout } from '@/components/MainLayout';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useContactDuplicates } from '@/hooks/useContactDuplicates';
import { useState } from 'react';
import {
  User,
  Phone,
  Mail,
  Building2,
  Search,
  GitMerge,
  X,
  Loader2,
  RefreshCw,
} from 'lucide-react';

interface MergeSelection {
  [key: string]: 'contact1' | 'contact2' | 'both';
}

export default function Duplicates() {
  const {
    duplicates,
    isLoading,
    detectDuplicates,
    isDetecting,
    mergeDuplicate,
    isMerging,
    ignoreDuplicate,
  } = useContactDuplicates();

  const [selectedDuplicate, setSelectedDuplicate] = useState<any>(null);
  const [mergeSelection, setMergeSelection] = useState<MergeSelection>({});

  const handleSelectDuplicate = (duplicate: any) => {
    setSelectedDuplicate(duplicate);
    // Inicializar seleções com contato 1 como padrão
    setMergeSelection({
      name: 'contact1',
      phone_number: 'contact1',
      email: 'contact1',
      company_cnpj: 'contact1',
      linkedin_url: 'contact1',
    });
  };

  const handleMerge = () => {
    if (!selectedDuplicate) return;

    const contact1 = selectedDuplicate.contact_1;
    const contact2 = selectedDuplicate.contact_2;

    // Construir dados mesclados baseado na seleção
    const mergedData: any = {};

    Object.keys(mergeSelection).forEach((field) => {
      const selection = mergeSelection[field];

      if (selection === 'contact1') {
        mergedData[field] = contact1[field];
      } else if (selection === 'contact2') {
        mergedData[field] = contact2[field];
      } else if (selection === 'both') {
        // Combinar valores (ex: notas)
        const val1 = contact1[field] || '';
        const val2 = contact2[field] || '';
        mergedData[field] = val1 && val2 ? `${val1}\n${val2}` : val1 || val2;
      }
    });

    mergeDuplicate({
      duplicateId: selectedDuplicate.id,
      keepContactId: contact1.id,
      discardContactId: contact2.id,
      mergedData,
    });

    setSelectedDuplicate(null);
    setMergeSelection({});
  };

  const handleIgnore = () => {
    if (!selectedDuplicate) return;
    ignoreDuplicate(selectedDuplicate.id);
    setSelectedDuplicate(null);
  };

  const getMatchReasonBadge = (reason: string) => {
    const badges: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> =
      {
        phone: { label: 'Mesmo Telefone', variant: 'default' },
        email: { label: 'Mesmo Email', variant: 'default' },
        name: { label: 'Nome Similar', variant: 'secondary' },
        multiple: { label: 'Múltiplos Critérios', variant: 'outline' },
      };

    const config = badges[reason] || { label: reason, variant: 'secondary' };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (selectedDuplicate) {
    const contact1 = selectedDuplicate.contact_1;
    const contact2 = selectedDuplicate.contact_2;

    return (
      <MainLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Mesclar Contatos</h1>
              <p className="text-muted-foreground">Escolha qual valor manter para cada campo</p>
            </div>
            <Button variant="ghost" onClick={() => setSelectedDuplicate(null)}>
              <X className="mr-2 h-4 w-4" />
              Cancelar
            </Button>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">
                    Similaridade: {(selectedDuplicate.similarity_score * 100).toFixed(0)}%
                  </p>
                  {getMatchReasonBadge(selectedDuplicate.match_reason)}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Nome */}
              <div className="space-y-3">
                <Label className="text-base font-semibold flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Nome
                </Label>
                <RadioGroup
                  value={mergeSelection.name}
                  onValueChange={(val) =>
                    setMergeSelection({ ...mergeSelection, name: val as any })
                  }
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2 p-4 border rounded-lg">
                      <RadioGroupItem value="contact1" id="name1" />
                      <Label htmlFor="name1" className="flex-1 cursor-pointer">
                        <div className="flex items-center gap-2">
                          <Avatar>
                            <AvatarFallback>
                              {contact1.name?.substring(0, 2).toUpperCase() || '?'}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{contact1.name || 'Sem nome'}</span>
                        </div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-4 border rounded-lg">
                      <RadioGroupItem value="contact2" id="name2" />
                      <Label htmlFor="name2" className="flex-1 cursor-pointer">
                        <div className="flex items-center gap-2">
                          <Avatar>
                            <AvatarFallback>
                              {contact2.name?.substring(0, 2).toUpperCase() || '?'}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{contact2.name || 'Sem nome'}</span>
                        </div>
                      </Label>
                    </div>
                  </div>
                </RadioGroup>
              </div>

              <Separator />

              {/* Telefone */}
              <div className="space-y-3">
                <Label className="text-base font-semibold flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Telefone
                </Label>
                <RadioGroup
                  value={mergeSelection.phone_number}
                  onValueChange={(val) =>
                    setMergeSelection({ ...mergeSelection, phone_number: val as any })
                  }
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2 p-4 border rounded-lg">
                      <RadioGroupItem value="contact1" id="phone1" />
                      <Label htmlFor="phone1" className="flex-1 cursor-pointer">
                        {contact1.phone_number}
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-4 border rounded-lg">
                      <RadioGroupItem value="contact2" id="phone2" />
                      <Label htmlFor="phone2" className="flex-1 cursor-pointer">
                        {contact2.phone_number}
                      </Label>
                    </div>
                  </div>
                </RadioGroup>
              </div>

              {/* Email (se existir) */}
              {(contact1.email || contact2.email) && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <Label className="text-base font-semibold flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email
                    </Label>
                    <RadioGroup
                      value={mergeSelection.email}
                      onValueChange={(val) =>
                        setMergeSelection({ ...mergeSelection, email: val as any })
                      }
                    >
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center space-x-2 p-4 border rounded-lg">
                          <RadioGroupItem value="contact1" id="email1" />
                          <Label htmlFor="email1" className="flex-1 cursor-pointer">
                            {contact1.email || <span className="text-muted-foreground">Vazio</span>}
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2 p-4 border rounded-lg">
                          <RadioGroupItem value="contact2" id="email2" />
                          <Label htmlFor="email2" className="flex-1 cursor-pointer">
                            {contact2.email || <span className="text-muted-foreground">Vazio</span>}
                          </Label>
                        </div>
                      </div>
                    </RadioGroup>
                  </div>
                </>
              )}

              {/* CNPJ (se existir) */}
              {(contact1.company_cnpj || contact2.company_cnpj) && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <Label className="text-base font-semibold flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      CNPJ da Empresa
                    </Label>
                    <RadioGroup
                      value={mergeSelection.company_cnpj}
                      onValueChange={(val) =>
                        setMergeSelection({ ...mergeSelection, company_cnpj: val as any })
                      }
                    >
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center space-x-2 p-4 border rounded-lg">
                          <RadioGroupItem value="contact1" id="cnpj1" />
                          <Label htmlFor="cnpj1" className="flex-1 cursor-pointer">
                            {contact1.company_cnpj || (
                              <span className="text-muted-foreground">Vazio</span>
                            )}
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2 p-4 border rounded-lg">
                          <RadioGroupItem value="contact2" id="cnpj2" />
                          <Label htmlFor="cnpj2" className="flex-1 cursor-pointer">
                            {contact2.company_cnpj || (
                              <span className="text-muted-foreground">Vazio</span>
                            )}
                          </Label>
                        </div>
                      </div>
                    </RadioGroup>
                  </div>
                </>
              )}

              <Separator />

              <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={handleIgnore}>
                  Não são duplicados
                </Button>
                <Button onClick={handleMerge} disabled={isMerging}>
                  {isMerging && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <GitMerge className="mr-2 h-4 w-4" />
                  Mesclar Contatos
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Contatos Duplicados</h1>
            <p className="text-muted-foreground">
              Revise e mescle contatos que podem ser duplicados
            </p>
          </div>
          <Button onClick={() => detectDuplicates()} disabled={isDetecting}>
            {isDetecting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Detectar Duplicados
          </Button>
        </div>

        <Card>
          <CardContent className="pt-6">
            {isLoading ? (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-muted-foreground" />
                <p className="text-muted-foreground">Carregando...</p>
              </div>
            ) : duplicates.length === 0 ? (
              <div className="text-center py-8">
                <Search className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">Nenhum duplicado encontrado</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Clique em "Detectar Duplicados" para buscar
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {duplicates.map((duplicate: any) => (
                  <div
                    key={duplicate.id}
                    className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          {(duplicate.similarity_score * 100).toFixed(0)}% similar
                        </span>
                        {getMatchReasonBadge(duplicate.match_reason)}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Avatar>
                            <AvatarFallback>
                              {duplicate.contact_1?.name?.substring(0, 2).toUpperCase() || '?'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{duplicate.contact_1?.name || 'Sem nome'}</p>
                            <p className="text-sm text-muted-foreground">
                              {duplicate.contact_1?.phone_number}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Avatar>
                            <AvatarFallback>
                              {duplicate.contact_2?.name?.substring(0, 2).toUpperCase() || '?'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{duplicate.contact_2?.name || 'Sem nome'}</p>
                            <p className="text-sm text-muted-foreground">
                              {duplicate.contact_2?.phone_number}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-4">
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => handleSelectDuplicate(duplicate)}
                      >
                        <GitMerge className="mr-2 h-4 w-4" />
                        Revisar e Mesclar
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => ignoreDuplicate(duplicate.id)}
                      >
                        Não são duplicados
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
