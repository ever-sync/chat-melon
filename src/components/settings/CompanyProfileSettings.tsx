import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/CompanyContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Upload, Building2, Clock, Save } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Json } from "@/integrations/supabase/types";

interface BusinessHours {
  [key: string]: {
    open: string;
    close: string;
    enabled: boolean;
  };
}

const DAYS_OF_WEEK = [
  { key: "monday", label: "Segunda-feira" },
  { key: "tuesday", label: "Terça-feira" },
  { key: "wednesday", label: "Quarta-feira" },
  { key: "thursday", label: "Quinta-feira" },
  { key: "friday", label: "Sexta-feira" },
  { key: "saturday", label: "Sábado" },
  { key: "sunday", label: "Domingo" },
];

const BUSINESS_STATUS = [
  { value: "open", label: "Aberto", color: "text-green-600" },
  { value: "closed", label: "Fechado", color: "text-red-600" },
  { value: "busy", label: "Ocupado", color: "text-yellow-600" },
];

export function CompanyProfileSettings() {
  const { currentCompany, refreshCompanies } = useCompany();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const [companyName, setCompanyName] = useState("");
  const [businessStatus, setBusinessStatus] = useState("open");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [businessHours, setBusinessHours] = useState<BusinessHours>({
    monday: { open: "09:00", close: "18:00", enabled: true },
    tuesday: { open: "09:00", close: "18:00", enabled: true },
    wednesday: { open: "09:00", close: "18:00", enabled: true },
    thursday: { open: "09:00", close: "18:00", enabled: true },
    friday: { open: "09:00", close: "18:00", enabled: true },
    saturday: { open: "09:00", close: "13:00", enabled: false },
    sunday: { open: "09:00", close: "13:00", enabled: false },
  });

  useEffect(() => {
    if (currentCompany) {
      setCompanyName(currentCompany.name);
      setBusinessStatus(currentCompany.business_status || "open");
      setLogoUrl(currentCompany.logo_url || null);
      
      if (currentCompany.business_hours) {
        setBusinessHours(currentCompany.business_hours as BusinessHours);
      }
    }
  }, [currentCompany]);

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !currentCompany) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith("image/")) {
      toast.error("Por favor, selecione uma imagem válida");
      return;
    }

    // Validar tamanho (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 5MB");
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${currentCompany.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("company-logos")
        .upload(fileName, file, {
          upsert: true,
          contentType: file.type,
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("company-logos")
        .getPublicUrl(fileName);

      setLogoUrl(publicUrl);
      toast.success("Logo atualizado!");
    } catch (error: any) {
      console.error("Error uploading logo:", error);
      toast.error(error.message || "Erro ao fazer upload do logo");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!currentCompany) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("companies")
        .update({
          name: companyName,
          business_status: businessStatus,
          logo_url: logoUrl,
          business_hours: businessHours as Json,
          updated_at: new Date().toISOString(),
        })
        .eq("id", currentCompany.id);

      if (error) throw error;

      await refreshCompanies();
      toast.success("Perfil corporativo atualizado!");
    } catch (error: any) {
      console.error("Error updating company:", error);
      toast.error(error.message || "Erro ao atualizar perfil");
    } finally {
      setLoading(false);
    }
  };

  const updateBusinessHours = (day: string, field: "open" | "close" | "enabled", value: string | boolean) => {
    setBusinessHours((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value,
      },
    }));
  };

  if (!currentCompany) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Perfil Corporativo</CardTitle>
          <CardDescription>Nenhuma empresa selecionada</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Logo e Nome */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Informações da Empresa
          </CardTitle>
          <CardDescription>
            Atualize o logo e nome da sua empresa
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-start gap-6">
            <div className="flex flex-col items-center gap-3">
              <Avatar className="h-24 w-24">
                <AvatarImage src={logoUrl || undefined} />
                <AvatarFallback className="text-2xl">
                  {companyName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <Button
                variant="outline"
                size="sm"
                disabled={uploading}
                onClick={() => document.getElementById("logo-upload")?.click()}
              >
                <Upload className="h-4 w-4 mr-2" />
                {uploading ? "Enviando..." : "Alterar Logo"}
              </Button>
              <input
                id="logo-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleLogoUpload}
              />
            </div>

            <div className="flex-1 space-y-4">
              <div>
                <Label htmlFor="company-name">Nome da Empresa</Label>
                <Input
                  id="company-name"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Nome da empresa"
                />
              </div>

              <div>
                <Label htmlFor="business-status">Status Comercial</Label>
                <Select value={businessStatus} onValueChange={setBusinessStatus}>
                  <SelectTrigger id="business-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BUSINESS_STATUS.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        <span className={status.color}>{status.label}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Horário de Funcionamento */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Horário de Funcionamento
          </CardTitle>
          <CardDescription>
            Configure os horários de atendimento da sua empresa
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {DAYS_OF_WEEK.map((day) => (
              <div
                key={day.key}
                className="flex items-center gap-4 p-3 rounded-lg border"
              >
                <div className="flex items-center gap-2 min-w-[140px]">
                  <Switch
                    checked={businessHours[day.key]?.enabled ?? false}
                    onCheckedChange={(checked) =>
                      updateBusinessHours(day.key, "enabled", checked)
                    }
                  />
                  <Label className="cursor-pointer">
                    {day.label}
                  </Label>
                </div>

                {businessHours[day.key]?.enabled && (
                  <div className="flex items-center gap-2 flex-1">
                    <Input
                      type="time"
                      value={businessHours[day.key]?.open || "09:00"}
                      onChange={(e) =>
                        updateBusinessHours(day.key, "open", e.target.value)
                      }
                      className="w-32"
                    />
                    <span className="text-muted-foreground">às</span>
                    <Input
                      type="time"
                      value={businessHours[day.key]?.close || "18:00"}
                      onChange={(e) =>
                        updateBusinessHours(day.key, "close", e.target.value)
                      }
                      className="w-32"
                    />
                  </div>
                )}

                {!businessHours[day.key]?.enabled && (
                  <span className="text-muted-foreground text-sm">
                    Fechado
                  </span>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Botão Salvar */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={loading} size="lg">
          <Save className="h-4 w-4 mr-2" />
          {loading ? "Salvando..." : "Salvar Alterações"}
        </Button>
      </div>
    </div>
  );
}