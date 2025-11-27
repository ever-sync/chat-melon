import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export function PlatformCompanies() {
  const { data: companies = [], isLoading } = useQuery({
    queryKey: ["platform-companies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return <div>Carregando empresas...</div>;
  }

  return (
    <div className="space-y-3">
      {companies.map((company) => (
        <div
          key={company.id}
          className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
        >
          <div className="flex items-center gap-4">
            {company.logo_url ? (
              <img
                src={company.logo_url}
                alt={company.name}
                className="w-12 h-12 rounded-lg object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <span className="text-xl font-bold text-primary">
                  {company.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}

            <div>
              <h3 className="font-semibold">{company.name}</h3>
              <p className="text-sm text-muted-foreground">
                Criada em {format(new Date(company.created_at), "dd/MM/yyyy", { locale: ptBR })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Badge variant={company.is_active ? "default" : "secondary"}>
              {company.is_active ? "Ativa" : "Inativa"}
            </Badge>
          </div>
        </div>
      ))}

      {companies.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          Nenhuma empresa cadastrada ainda
        </div>
      )}
    </div>
  );
}
