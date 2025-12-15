import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, FileText, AlertTriangle, CheckCircle2, ArrowRight, ArrowLeft } from "lucide-react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { useCustomFields } from "@/hooks/useCustomFields";
import { useCompanyQuery } from "@/hooks/crm/useCompanyQuery";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ImportContact {
  rowIndex: number;
  data: Record<string, string>;
  mapped?: {
    name?: string;
    phone_number?: string;
    email?: string;
    company?: string;
    position?: string;
    customFields?: Record<string, string>;
  };
  errors?: string[];
  isDuplicate?: boolean;
  existingId?: string;
}

interface ContactImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete: () => void;
}

export const ContactImportDialog = ({ open, onOpenChange, onImportComplete }: ContactImportDialogProps) => {
  const { companyId } = useCompanyQuery();
  const { fields: customFields } = useCustomFields("contact");
  
  const [step, setStep] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [previewRows, setPreviewRows] = useState<string[][]>([]);
  const [allRows, setAllRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [contacts, setContacts] = useState<ImportContact[]>([]);
  const [duplicateAction, setDuplicateAction] = useState<"skip" | "update" | "create">("skip");
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [importResult, setImportResult] = useState<{ success: number; errors: number } | null>(null);

  const systemFields = [
    { value: "name", label: "Nome", required: true },
    { value: "phone_number", label: "Telefone", required: true },
    { value: "email", label: "Email", required: false },
    { value: "company", label: "Empresa", required: false },
    { value: "position", label: "Cargo", required: false },
    ...customFields.map(cf => ({
      value: `custom_${cf.id}`,
      label: cf.field_label,
      required: cf.is_required || false
    }))
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    
    const isCSV = uploadedFile.name.endsWith(".csv");
    const isExcel = uploadedFile.name.endsWith(".xlsx") || uploadedFile.name.endsWith(".xls");

    if (isCSV) {
      Papa.parse(uploadedFile, {
        complete: (results) => {
          const data = results.data as string[][];
          setHeaders(data[0]);
          setPreviewRows(data.slice(1, 6));
          setAllRows(data.slice(1));
          autoMapHeaders(data[0]);
          setStep(2);
        },
        skipEmptyLines: true
      });
    } else if (isExcel) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as string[][];
        
        setHeaders(data[0]);
        setPreviewRows(data.slice(1, 6));
        setAllRows(data.slice(1));
        autoMapHeaders(data[0]);
        setStep(2);
      };
      reader.readAsBinaryString(uploadedFile);
    } else {
      toast.error("Formato não suportado. Use CSV ou Excel (.xlsx)");
    }
  };

  const autoMapHeaders = (fileHeaders: string[]) => {
    const autoMapping: Record<string, string> = {};
    
    fileHeaders.forEach((header) => {
      const normalized = header.toLowerCase().trim();
      
      if (normalized.includes("nome") || normalized === "name") {
        autoMapping[header] = "name";
      } else if (normalized.includes("telefone") || normalized.includes("phone") || normalized.includes("celular")) {
        autoMapping[header] = "phone_number";
      } else if (normalized.includes("email") || normalized.includes("e-mail")) {
        autoMapping[header] = "email";
      } else if (normalized.includes("empresa") || normalized.includes("company")) {
        autoMapping[header] = "company";
      } else if (normalized.includes("cargo") || normalized.includes("position")) {
        autoMapping[header] = "position";
      }
    });
    
    setMapping(autoMapping);
  };

  const validateAndMapContacts = async () => {
    const mappedContacts: ImportContact[] = [];
    
    for (let i = 0; i < allRows.length; i++) {
      const row = allRows[i];
      const contactData: Record<string, string> = {};
      
      headers.forEach((header, index) => {
        contactData[header] = row[index] || "";
      });

      const mapped: ImportContact["mapped"] = {};
      const errors: string[] = [];

      // Map fields
      Object.entries(mapping).forEach(([fileHeader, systemField]) => {
        const value = contactData[fileHeader];
        
        if (systemField.startsWith("custom_")) {
          if (!mapped.customFields) mapped.customFields = {};
          mapped.customFields[systemField.replace("custom_", "")] = value;
        } else {
          (mapped as any)[systemField] = value;
        }
      });

      // Validate required fields
      if (!mapped.name || mapped.name.trim() === "") {
        errors.push("Nome é obrigatório");
      }
      if (!mapped.phone_number || mapped.phone_number.trim() === "") {
        errors.push("Telefone é obrigatório");
      }

      // Validate phone format
      if (mapped.phone_number) {
        const phoneClean = mapped.phone_number.replace(/\D/g, "");
        if (phoneClean.length < 10 || phoneClean.length > 11) {
          errors.push("Telefone inválido");
        }
      }

      // Check for duplicates in database
      if (mapped.phone_number && !errors.length) {
        const { data: existing } = await supabase
          .from("contacts")
          .select("id")
          .eq("company_id", companyId!)
          .eq("phone_number", mapped.phone_number)
          .maybeSingle();

        if (existing) {
          mappedContacts.push({
            rowIndex: i,
            data: contactData,
            mapped,
            errors,
            isDuplicate: true,
            existingId: existing.id
          });
          continue;
        }
      }

      mappedContacts.push({
        rowIndex: i,
        data: contactData,
        mapped,
        errors
      });
    }

    setContacts(mappedContacts);
    setStep(3);
  };

  const processImport = async () => {
    setImporting(true);
    setStep(4);
    
    let successCount = 0;
    let errorCount = 0;
    
    const contactsToProcess = contacts.filter(c => {
      if (c.errors && c.errors.length > 0) return false;
      if (c.isDuplicate && duplicateAction === "skip") return false;
      return true;
    });

    for (let i = 0; i < contactsToProcess.length; i++) {
      const contact = contactsToProcess[i];
      setProgress(((i + 1) / contactsToProcess.length) * 100);

      try {
        if (contact.isDuplicate && duplicateAction === "update") {
          // Update existing
          const { error } = await supabase
            .from("contacts")
            .update({
              name: contact.mapped?.name,
              email: contact.mapped?.email,
              updated_at: new Date().toISOString()
            })
            .eq("id", contact.existingId!);

          if (error) throw error;
        } else {
          // Create new
          const { error } = await supabase
            .from("contacts")
            .insert({
              company_id: companyId!,
              name: contact.mapped?.name,
              phone_number: contact.mapped?.phone_number,
              email: contact.mapped?.email || null
            });

          if (error) throw error;
        }
        
        successCount++;
      } catch (error) {
        console.error("Erro ao importar contato:", error);
        errorCount++;
      }
    }

    setImportResult({ success: successCount, errors: errorCount });
    setImporting(false);
  };

  const resetDialog = () => {
    setStep(1);
    setFile(null);
    setHeaders([]);
    setPreviewRows([]);
    setAllRows([]);
    setMapping({});
    setContacts([]);
    setProgress(0);
    setImportResult(null);
    setDuplicateAction("skip");
  };

  const handleClose = () => {
    resetDialog();
    onOpenChange(false);
    if (importResult && importResult.success > 0) {
      onImportComplete();
    }
  };

  const validContacts = contacts.filter(c => !c.errors || c.errors.length === 0);
  const errorContacts = contacts.filter(c => c.errors && c.errors.length > 0);
  const duplicateContacts = contacts.filter(c => c.isDuplicate);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Importar Contatos - Etapa {step} de 4
          </DialogTitle>
        </DialogHeader>

        {/* ETAPA 1: UPLOAD */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="border-2 border-dashed rounded-lg p-12 text-center hover:border-primary/50 transition-colors">
              <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Escolha um arquivo</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Arraste e solte ou clique para selecionar
              </p>
              <p className="text-xs text-muted-foreground mb-4">
                Formatos aceitos: CSV, Excel (.xlsx)
              </p>
              <Input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileUpload}
                className="max-w-xs mx-auto cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* ETAPA 2: MAPEAMENTO */}
        {step === 2 && (
          <div className="space-y-4">
            <Alert>
              <FileText className="h-4 w-4" />
              <AlertDescription>
                Mapeie as colunas do seu arquivo para os campos do sistema
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              {headers.map((header) => (
                <div key={header} className="flex items-center gap-4">
                  <Label className="w-1/3 font-mono text-sm">{header}</Label>
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  <Select
                    value={mapping[header] || ""}
                    onValueChange={(value) => setMapping({ ...mapping, [header]: value })}
                  >
                    <SelectTrigger className="w-2/3">
                      <SelectValue placeholder="Selecione um campo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Não importar</SelectItem>
                      {systemFields.map((field) => (
                        <SelectItem key={field.value} value={field.value}>
                          {field.label} {field.required && <span className="text-destructive">*</span>}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>

            <div className="border rounded-lg p-4">
              <h4 className="font-semibold mb-2">Preview (5 primeiras linhas)</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      {headers.map((header) => (
                        <th key={header} className="text-left p-2">{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((row, i) => (
                      <tr key={i} className="border-b">
                        {row.map((cell, j) => (
                          <td key={j} className="p-2">{cell}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
              <Button onClick={validateAndMapContacts}>
                Próximo
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* ETAPA 3: VALIDAÇÃO */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{validContacts.length}</div>
                <div className="text-sm text-muted-foreground">Contatos válidos</div>
              </div>
              <div className="p-4 bg-orange-50 dark:bg-orange-950 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{duplicateContacts.length}</div>
                <div className="text-sm text-muted-foreground">Duplicados</div>
              </div>
              <div className="p-4 bg-red-50 dark:bg-red-950 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{errorContacts.length}</div>
                <div className="text-sm text-muted-foreground">Com erros</div>
              </div>
            </div>

            {duplicateContacts.length > 0 && (
              <div className="space-y-2">
                <Label>Ação para contatos duplicados:</Label>
                <Select value={duplicateAction} onValueChange={(value: any) => setDuplicateAction(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="skip">Ignorar duplicados</SelectItem>
                    <SelectItem value="update">Atualizar existentes</SelectItem>
                    <SelectItem value="create">Criar duplicados</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {errorContacts.length > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {errorContacts.length} contatos com erros serão ignorados
                </AlertDescription>
              </Alert>
            )}

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(2)}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
              <Button onClick={processImport} disabled={validContacts.length === 0}>
                Importar {validContacts.length} contatos
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* ETAPA 4: PROCESSAMENTO */}
        {step === 4 && (
          <div className="space-y-6">
            {importing ? (
              <>
                <div className="text-center">
                  <div className="text-2xl font-bold mb-2">Importando...</div>
                  <div className="text-muted-foreground">
                    Processando contatos
                  </div>
                </div>
                <Progress value={progress} className="w-full" />
                <div className="text-center text-sm text-muted-foreground">
                  {Math.round(progress)}% concluído
                </div>
              </>
            ) : (
              <>
                <div className="text-center">
                  <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-4" />
                  <div className="text-2xl font-bold mb-2">Importação concluída!</div>
                  <div className="text-muted-foreground">
                    {importResult?.success} contatos importados com sucesso
                    {importResult?.errors ? ` • ${importResult.errors} com erro` : ""}
                  </div>
                </div>
                <Button onClick={handleClose} className="w-full">
                  Ver contatos importados
                </Button>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
