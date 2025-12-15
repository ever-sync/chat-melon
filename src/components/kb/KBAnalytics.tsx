import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, FileText, MessageSquare, TrendingUp, Brain } from 'lucide-react';

interface StatCardProps {
    title: string;
    value: string | number;
    description: string;
    icon: React.ReactNode;
    trend?: string;
}

function StatCard({ title, value, description, icon, trend }: StatCardProps) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
                {icon}
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                <p className="text-xs text-muted-foreground mt-1">{description}</p>
                {trend && (
                    <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        {trend}
                    </p>
                )}
            </CardContent>
        </Card>
    );
}

export function KBAnalytics() {
    // TODO: Fetch real analytics data from Supabase
    const stats = {
        totalDocuments: 0,
        totalChunks: 0,
        totalQueries: 0,
        avgResponseTime: '0s',
    };

    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Total de Documentos"
                    value={stats.totalDocuments}
                    description="Documentos na base de conhecimento"
                    icon={<FileText className="h-4 w-4 text-muted-foreground" />}
                />
                <StatCard
                    title="Total de Chunks"
                    value={stats.totalChunks}
                    description="Fragmentos de texto indexados"
                    icon={<BarChart3 className="h-4 w-4 text-muted-foreground" />}
                />
                <StatCard
                    title="Consultas Realizadas"
                    value={stats.totalQueries}
                    description="Perguntas respondidas pela IA"
                    icon={<MessageSquare className="h-4 w-4 text-muted-foreground" />}
                />
                <StatCard
                    title="Tempo Médio de Resposta"
                    value={stats.avgResponseTime}
                    description="Tempo para gerar respostas"
                    icon={<Brain className="h-4 w-4 text-muted-foreground" />}
                />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Documentos Mais Consultados</CardTitle>
                    <CardDescription>
                        Ranking dos documentos que mais contribuem para as respostas
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8 text-muted-foreground">
                        <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Nenhum dado disponível ainda</p>
                        <p className="text-sm mt-2">
                            As estatísticas aparecerão conforme você adicionar documentos e fazer consultas.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
