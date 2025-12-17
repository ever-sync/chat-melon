import { useState, useMemo } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, ArrowUpDown, Calendar, DollarSign, User, Tag } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Deal } from "@/hooks/crm/useDeals";
import { formatCurrency } from "@/lib/formatters";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BulkActionsToolbar } from "./BulkActionsToolbar";

interface PipelineListViewProps {
    deals: Deal[];
    onEdit: (deal: Deal) => void;
    onDelete: (dealId: string) => void;
    onView: (deal: Deal) => void;
    pipelineId?: string;
    // Selection
    selectedDeals: Set<string>;
    onSelectionChange: (selected: Set<string>) => void;
    // Bulk actions
    onBulkMove: (stageId: string) => void;
    onBulkAssign: (userId: string) => void;
    onBulkSetPriority: (priority: string) => void;
    onBulkDelete: () => void;
}

type SortField = "title" | "value" | "stage" | "created_at" | "expected_close_date";
type SortDirection = "asc" | "desc";

export const PipelineListView = ({
    deals,
    onEdit,
    onDelete,
    onView,
    pipelineId,
    selectedDeals,
    onSelectionChange,
    onBulkMove,
    onBulkAssign,
    onBulkSetPriority,
    onBulkDelete,
}: PipelineListViewProps) => {
    // const [selectedDeals, setSelectedDeals] = useState<Set<string>>(new Set()); // Removed internal state
    const [sortField, setSortField] = useState<SortField>("created_at");
    const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

    // Selection handlers
    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            onSelectionChange(new Set(deals.map((d) => d.id)));
        } else {
            onSelectionChange(new Set());
        }
    };

    const handleSelectOne = (dealId: string, checked: boolean) => {
        const newSet = new Set(selectedDeals);
        if (checked) {
            newSet.add(dealId);
        } else {
            newSet.delete(dealId);
        }
        onSelectionChange(newSet);
    };

    // Sorting handlers
    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(sortDirection === "asc" ? "desc" : "asc");
        } else {
            setSortField(field);
            setSortDirection("asc");
        }
    };

    const sortedDeals = useMemo(() => {
        return [...deals].sort((a, b) => {
            let valA: any = a[sortField as keyof Deal];
            let valB: any = b[sortField as keyof Deal];

            if (sortField === "stage") {
                valA = a.pipeline_stages?.order_index || 0;
                valB = b.pipeline_stages?.order_index || 0;
            }

            if (valA < valB) return sortDirection === "asc" ? -1 : 1;
            if (valA > valB) return sortDirection === "asc" ? 1 : -1;
            return 0;
        });
    }, [deals, sortField, sortDirection]);

    // Bulk actions wrappers to clear selection after action
    const handleBulkAction = (action: () => void) => {
        action();
        onSelectionChange(new Set());
    };

    return (
        <>
            <div className="rounded-md border bg-white dark:bg-gray-950 shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[50px]">
                                <Checkbox
                                    checked={selectedDeals.size === deals.length && deals.length > 0}
                                    onCheckedChange={(checked) => handleSelectAll(!!checked)}
                                />
                            </TableHead>
                            <TableHead className="w-[300px] cursor-pointer" onClick={() => handleSort("title")}>
                                <div className="flex items-center gap-2">
                                    Título
                                    <ArrowUpDown className="h-3 w-3" />
                                </div>
                            </TableHead>
                            <TableHead onClick={() => handleSort("value")} className="cursor-pointer">
                                <div className="flex items-center gap-2">
                                    <DollarSign className="w-3 h-3" />
                                    Valor
                                    <ArrowUpDown className="h-3 w-3" />
                                </div>
                            </TableHead>
                            <TableHead onClick={() => handleSort("stage")} className="cursor-pointer">
                                <div className="flex items-center gap-2">
                                    <Tag className="w-3 h-3" />
                                    Etapa
                                    <ArrowUpDown className="h-3 w-3" />
                                </div>
                            </TableHead>
                            <TableHead>
                                <div className="flex items-center gap-2">
                                    <User className="w-3 h-3" />
                                    Responsável
                                </div>
                            </TableHead>
                            <TableHead onClick={() => handleSort("expected_close_date")} className="cursor-pointer">
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-3 h-3" />
                                    Fechamento
                                    <ArrowUpDown className="h-3 w-3" />
                                </div>
                            </TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sortedDeals.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                                    Nenhum negócio encontrado.
                                </TableCell>
                            </TableRow>
                        ) : (
                            sortedDeals.map((deal) => (
                                <TableRow key={deal.id} className="hover:bg-muted/50">
                                    <TableCell>
                                        <Checkbox
                                            checked={selectedDeals.has(deal.id)}
                                            onCheckedChange={(checked) => handleSelectOne(deal.id, !!checked)}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-1">
                                            <span
                                                className="font-medium cursor-pointer hover:underline text-indigo-600 dark:text-indigo-400"
                                                onClick={() => onView(deal)}
                                            >
                                                {deal.title}
                                            </span>
                                            {deal.contacts && (
                                                <span className="text-xs text-muted-foreground">
                                                    {deal.contacts.name || deal.contacts.phone_number}
                                                </span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <span className="font-semibold text-sm">
                                            {formatCurrency(deal.value || 0)}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant="outline"
                                            style={{
                                                borderColor: deal.pipeline_stages?.color,
                                                color: deal.pipeline_stages?.color,
                                                backgroundColor: `${deal.pipeline_stages?.color}10`
                                            }}
                                        >
                                            {deal.pipeline_stages?.name}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {deal.profiles ? (
                                            <div className="flex items-center gap-2">
                                                <Avatar className="h-6 w-6">
                                                    <AvatarImage src={deal.profiles.avatar_url || ""} />
                                                    <AvatarFallback>{deal.profiles.full_name?.substring(0, 2).toUpperCase()}</AvatarFallback>
                                                </Avatar>
                                                <span className="text-sm truncate max-w-[120px]">
                                                    {deal.profiles.full_name?.split(" ")[0]}
                                                </span>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-muted-foreground">Não atribuído</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {deal.expected_close_date ? (
                                            <span className="text-sm text-muted-foreground">
                                                {format(new Date(deal.expected_close_date), "dd/MM/yyyy")}
                                            </span>
                                        ) : (
                                            <span className="text-xs text-muted-foreground">-</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => onView(deal)}>
                                                    Ver detalhes
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => onEdit(deal)}>
                                                    Editar
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => onDelete(deal.id)}
                                                    className="text-destructive"
                                                >
                                                    Excluir
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {selectedDeals.size > 0 && (
                <BulkActionsToolbar
                    selectedCount={selectedDeals.size}
                    onClear={() => onSelectionChange(new Set())}
                    onMove={(stageId) => handleBulkAction(() => onBulkMove(stageId))}
                    onAssign={(userId) => handleBulkAction(() => onBulkAssign(userId))}
                    onSetPriority={(priority) => handleBulkAction(() => onBulkSetPriority(priority))}
                    onDelete={() => handleBulkAction(() => onBulkDelete())}
                    pipelineId={pipelineId}
                />
            )}
        </>
    );
};
