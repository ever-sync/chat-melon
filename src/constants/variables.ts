import {
    Building2,
    User,
    Users,
    Bot,
    MoreHorizontal,
} from 'lucide-react';

export interface VariableDefinition {
    key: string;
    label: string;
    description?: string;
    icon?: any;
}

export interface CategoryDefinition {
    id: string;
    label: string;
    icon: any;
    variables: VariableDefinition[];
}

export const STANDARD_VARIABLE_CATEGORIES: CategoryDefinition[] = [
    {
        id: 'empresa',
        label: 'Empresa',
        icon: Building2,
        variables: [
            { key: 'empresa_nome', label: 'Nome', description: 'Nome da empresa' },
            { key: 'empresa_cnpj', label: 'CNPJ', description: 'CNPJ da empresa' },
            { key: 'empresa_expediente', label: 'Expediente do Dia', description: 'Horário de funcionamento hoje' },
        ],
    },
    {
        id: 'funcionario',
        label: 'Funcionário',
        icon: User,
        variables: [
            { key: 'funcionario_nome', label: 'Nome', description: 'Nome do atendente' },
            { key: 'funcionario_email', label: 'E-mail', description: 'E-mail do atendente' },
        ],
    },
    {
        id: 'cliente',
        label: 'Cliente',
        icon: Users,
        variables: [
            { key: 'nome', label: 'Nome Completo', description: 'Nome completo do contato' },
            { key: 'primeiro_nome', label: 'Primeiro Nome', description: 'Apenas o primeiro nome' },
            { key: 'telefone', label: 'Telefone', description: 'Número de telefone' },
            { key: 'email', label: 'E-mail', description: 'E-mail do contato' },
        ],
    },
    {
        id: 'chatbot',
        label: 'ChatBot',
        icon: Bot,
        variables: [
            { key: 'chatbot_nome', label: 'Nome', description: 'Nome do chatbot ativo' },
        ],
    },
    {
        id: 'outros',
        label: 'Outros',
        icon: MoreHorizontal,
        variables: [
            { key: 'protocolo', label: 'Protocolo', description: 'Número do atendimento' },
            { key: 'cache', label: 'Cache', description: 'Dados temporários da sessão' },
            { key: 'data_atual', label: 'Data Atual', description: 'Data de hoje' },
            { key: 'hora_atual', label: 'Hora Atual', description: 'Hora de agora' },
        ],
    },
];
