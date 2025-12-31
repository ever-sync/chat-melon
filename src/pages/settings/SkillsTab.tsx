import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Wrench, 
  Plus, 
  Trash2, 
  Edit2, 
  Play, 
  Calendar, 
  Users, 
  Briefcase, 
  MessageSquare, 
  Bell, 
  Tag, 
  FileText,
  Mail,
  CheckSquare
} from 'lucide-react';

const SKILL_CATEGORIES = [
  {
    title: "Gestão de Contatos (CRM)",
    icon: Users,
    color: "text-blue-600",
    bg: "bg-blue-100 dark:bg-blue-900/20",
    skills: [
      { name: "Criar/Editar Contato", description: "Cria ou atualiza dados do contato automaticamente.", active: true },
      { name: "Adicionar/Remover Tag", description: "Gerencia tags para segmentação (ex: 'Quente', 'Interessado').", active: true },
      { name: "Gerenciar Segmentação", description: "Adiciona o lead a listas de segmentação específicas.", active: false },
    ]
  },
  {
    title: "Vendas & Negócios",
    icon: Briefcase,
    color: "text-emerald-600",
    bg: "bg-emerald-100 dark:bg-emerald-900/20",
    skills: [
      { name: "Criar Negócio (Deal)", description: "Abre uma nova oportunidade no funil de vendas.", active: true },
      { name: "Mover Etapa do Funil", description: "Avança o negócio de etapa (ex: de 'Novo' para 'Qualificado').", active: true },
      { name: "Atualizar Valor/Status", description: "Atualiza valores monetários ou marca como Ganho/Perdido.", active: true },
      { name: "Definir Proprietário", description: "Atribui o negócio a um vendedor específico.", active: false },
    ]
  },
  {
    title: "Agenda & Tarefas",
    icon: Calendar,
    color: "text-purple-600",
    bg: "bg-purple-100 dark:bg-purple-900/20",
    skills: [
      { name: "Agendar Reunião", description: "Verifica disponibilidade e agenda no Google/Outlook Calendar.", active: true },
      { name: "Criar Tarefa", description: "Adiciona tarefas de follow-up para a equipe.", active: true },
      { name: "Criar Anotação", description: "Registra resumos da conversa nas notas do contato.", active: true },
    ]
  },
  {
    title: "Comunicação & Notificações",
    icon: Mail,
    color: "text-orange-600",
    bg: "bg-orange-100 dark:bg-orange-900/20",
    skills: [
      { name: "Enviar Email (Template)", description: "Dispara emails pré-formatados (propostas, boas-vindas).", active: false },
      { name: "Notificar Usuário/Equipe", description: "Envia alertas internos para usuários específicos.", active: true },
      { name: "Disparar Webhook N8N", description: "Aciona automações complexas externas.", active: false },
    ]
  }
];

export default function SkillsTab() {
  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
                <CardTitle>Habilidades (Tools)</CardTitle>
                <CardDescription>
                    Permita que o agente execute ações nativas do sistema durante o atendimento.
                </CardDescription>
            </div>
            <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Nova Habilidade Customizada
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-8">
            
            {SKILL_CATEGORIES.map((category, idx) => (
                <div key={idx} className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b">
                        <category.icon className={`h-5 w-5 ${category.color}`} />
                        <h3 className="text-base font-semibold text-foreground">
                            {category.title}
                        </h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {category.skills.map((skill, sIdx) => (
                            <div key={sIdx} className="border rounded-lg p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${category.bg} shrink-0`}>
                                        <Wrench className={`h-4 w-4 ${category.color}`} />
                                    </div>
                                    <div>
                                        <h4 className="font-medium text-sm text-foreground">{skill.name}</h4>
                                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                                            {skill.description}
                                        </p>
                                    </div>
                                </div>
                                <Switch defaultChecked={skill.active} />
                            </div>
                        ))}
                    </div>
                </div>
            ))}

            {/* Custom Skills Section */}
            <div className="space-y-4 pt-4">
                 <div className="flex items-center gap-2 pb-2 border-b">
                    <Wrench className="h-5 w-5 text-gray-600" />
                    <h3 className="text-base font-semibold text-foreground">
                        Personalizadas (Webhooks)
                    </h3>
                </div>
                
                <div className="border rounded-lg p-4 flex items-center justify-between bg-gray-50 dark:bg-gray-900/30">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-200 dark:bg-gray-800 rounded-lg">
                            <Wrench className="h-4 w-4 text-gray-600" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h4 className="font-medium text-sm">Consultar Status do Pedido</h4>
                                <Badge variant="outline" className="text-[10px]">Custom</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                GET https://api.loja.com/orders/{'{order_id}'}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                         <Button variant="ghost" size="icon" title="Testar">
                            <Play className="h-4 w-4 text-green-600" />
                        </Button>
                        <Button variant="ghost" size="icon" title="Editar">
                            <Edit2 className="h-4 w-4" />
                        </Button>
                        <Switch />
                    </div>
                </div>
            </div>
            
        </CardContent>
      </Card>
      
       <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 border-dashed">
            <CardContent className="p-6 flex flex-col items-center justify-center text-center">
                <p className="font-medium text-indigo-700 dark:text-indigo-400 mb-2">Precisa de mais poder?</p>
                <p className="text-sm text-muted-foreground mb-4 max-w-md">
                    Use a integração com N8N para criar fluxos complexos de automação e conectar com milhares de apps.
                </p>
                <Button variant="outline" className="border-indigo-200 text-indigo-700 hover:bg-indigo-50 dark:border-indigo-800 dark:text-indigo-400">
                    Gerenciar Integrações
                </Button>
            </CardContent>
       </Card>
    </div>
  );
}
