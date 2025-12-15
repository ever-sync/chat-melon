import { useState } from 'react';
import { MainLayout } from '@/components/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Search,
    MoreVertical,
    Eye,
    Truck,
    Package,
    CheckCircle,
    XCircle,
    Clock,
    CreditCard,
    DollarSign,
    TrendingUp,
    ShoppingCart,
    Loader2,
} from 'lucide-react';
import { useOrders, useOrderAnalytics } from '@/hooks/useOrders';
import { toast } from 'sonner';
import type { Order, OrderStatus } from '@/types/orders';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const statusConfig: Record<OrderStatus, { label: string; color: string; icon: React.ReactNode }> = {
    pending: { label: 'Pendente', color: 'bg-gray-100 text-gray-700', icon: <Clock className="h-4 w-4" /> },
    awaiting_payment: { label: 'Aguardando Pagamento', color: 'bg-yellow-100 text-yellow-700', icon: <CreditCard className="h-4 w-4" /> },
    paid: { label: 'Pago', color: 'bg-green-100 text-green-700', icon: <DollarSign className="h-4 w-4" /> },
    processing: { label: 'Processando', color: 'bg-blue-100 text-blue-700', icon: <Package className="h-4 w-4" /> },
    shipped: { label: 'Enviado', color: 'bg-indigo-100 text-indigo-700', icon: <Truck className="h-4 w-4" /> },
    delivered: { label: 'Entregue', color: 'bg-emerald-100 text-emerald-700', icon: <CheckCircle className="h-4 w-4" /> },
    cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-700', icon: <XCircle className="h-4 w-4" /> },
    refunded: { label: 'Reembolsado', color: 'bg-orange-100 text-orange-700', icon: <XCircle className="h-4 w-4" /> },
};

export default function Orders() {
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
    const [activeTab, setActiveTab] = useState('all');

    const { orders, isLoading, updateOrderStatus, cancelOrder } = useOrders(
        statusFilter !== 'all' ? { status: statusFilter } : undefined
    );
    const { analytics } = useOrderAnalytics();

    const filteredOrders = orders.filter((order) => {
        const matchesSearch =
            order.order_number.toString().includes(searchQuery) ||
            order.contact?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            order.contact?.phone_number?.includes(searchQuery);

        return matchesSearch;
    });

    const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus) => {
        try {
            await updateOrderStatus.mutateAsync({ id: orderId, status: newStatus });
            toast.success('Status atualizado com sucesso');
        } catch (error) {
            toast.error('Erro ao atualizar status');
        }
    };

    const handleCancelOrder = async (orderId: string) => {
        if (!confirm('Tem certeza que deseja cancelar este pedido?')) return;

        try {
            await cancelOrder.mutateAsync({ id: orderId, reason: 'Cancelado pelo operador' });
            toast.success('Pedido cancelado');
        } catch (error) {
            toast.error('Erro ao cancelar pedido');
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(value);
    };

    return (
        <MainLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                            <ShoppingCart className="w-5 h-5 text-primary" />
                        </div>
                        <span className="text-2xl font-bold text-foreground">Pedidos</span>
                    </div>
                    <div className="h-10 w-px bg-border mx-2"></div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Gestão de Pedidos</h1>
                        <p className="text-muted-foreground">
                            Gerencie pedidos e pagamentos da sua mini-loja
                        </p>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Total de Pedidos
                            </CardTitle>
                            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{analytics?.totalOrders || 0}</div>
                            <p className="text-xs text-muted-foreground mt-1">últimos 30 dias</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Pedidos Pagos
                            </CardTitle>
                            <CheckCircle className="h-4 w-4 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">
                                {analytics?.paidOrders || 0}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {analytics?.conversionRate?.toFixed(1) || 0}% de conversão
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Receita Total
                            </CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {formatCurrency(analytics?.totalRevenue || 0)}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">últimos 30 dias</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Ticket Médio
                            </CardTitle>
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {formatCurrency(analytics?.avgOrderValue || 0)}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">por pedido pago</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters */}
                <div className="flex items-center gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar por número, cliente ou telefone..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                    <Select
                        value={statusFilter}
                        onValueChange={(v) => setStatusFilter(v as OrderStatus | 'all')}
                    >
                        <SelectTrigger className="w-48">
                            <SelectValue placeholder="Filtrar por status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos os status</SelectItem>
                            {Object.entries(statusConfig).map(([value, config]) => (
                                <SelectItem key={value} value={value}>
                                    {config.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Orders Table */}
                <Card>
                    <CardContent className="p-0">
                        {isLoading ? (
                            <div className="flex justify-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : filteredOrders.length === 0 ? (
                            <div className="py-12 text-center">
                                <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                <h3 className="font-semibold text-lg mb-2">Nenhum pedido encontrado</h3>
                                <p className="text-muted-foreground">
                                    Os pedidos aparecerão aqui quando forem criados via chat.
                                </p>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Pedido</TableHead>
                                        <TableHead>Cliente</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Pagamento</TableHead>
                                        <TableHead className="text-right">Total</TableHead>
                                        <TableHead>Data</TableHead>
                                        <TableHead></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredOrders.map((order) => (
                                        <TableRow key={order.id}>
                                            <TableCell className="font-medium">
                                                #{order.order_number}
                                            </TableCell>
                                            <TableCell>
                                                <div>
                                                    <div className="font-medium">{order.contact?.name || 'N/A'}</div>
                                                    <div className="text-sm text-muted-foreground">
                                                        {order.contact?.phone_number}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={statusConfig[order.status].color}>
                                                    <span className="flex items-center gap-1">
                                                        {statusConfig[order.status].icon}
                                                        {statusConfig[order.status].label}
                                                    </span>
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <span className="capitalize">{order.payment_method || '-'}</span>
                                            </TableCell>
                                            <TableCell className="text-right font-medium">
                                                {formatCurrency(order.total)}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {formatDistanceToNow(new Date(order.created_at), {
                                                    addSuffix: true,
                                                    locale: ptBR,
                                                })}
                                            </TableCell>
                                            <TableCell>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon">
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem>
                                                            <Eye className="h-4 w-4 mr-2" />
                                                            Ver detalhes
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        {order.status === 'paid' && (
                                                            <DropdownMenuItem
                                                                onClick={() => handleUpdateStatus(order.id, 'processing')}
                                                            >
                                                                <Package className="h-4 w-4 mr-2" />
                                                                Marcar como Processando
                                                            </DropdownMenuItem>
                                                        )}
                                                        {order.status === 'processing' && (
                                                            <DropdownMenuItem
                                                                onClick={() => handleUpdateStatus(order.id, 'shipped')}
                                                            >
                                                                <Truck className="h-4 w-4 mr-2" />
                                                                Marcar como Enviado
                                                            </DropdownMenuItem>
                                                        )}
                                                        {order.status === 'shipped' && (
                                                            <DropdownMenuItem
                                                                onClick={() => handleUpdateStatus(order.id, 'delivered')}
                                                            >
                                                                <CheckCircle className="h-4 w-4 mr-2" />
                                                                Marcar como Entregue
                                                            </DropdownMenuItem>
                                                        )}
                                                        {!['cancelled', 'refunded', 'delivered'].includes(order.status) && (
                                                            <>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem
                                                                    onClick={() => handleCancelOrder(order.id)}
                                                                    className="text-destructive"
                                                                >
                                                                    <XCircle className="h-4 w-4 mr-2" />
                                                                    Cancelar Pedido
                                                                </DropdownMenuItem>
                                                            </>
                                                        )}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>
        </MainLayout>
    );
}
