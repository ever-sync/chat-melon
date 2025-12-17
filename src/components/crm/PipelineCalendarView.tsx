import { useState, useMemo } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Deal } from "@/hooks/crm/useDeals";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    HoverCard,
    HoverCardContent,
    HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface PipelineCalendarViewProps {
    deals: Deal[];
    onView: (deal: Deal) => void;
    onEdit: (deal: Deal) => void;
}

export const PipelineCalendarView = ({ deals, onView, onEdit }: PipelineCalendarViewProps) => {
    const [currentDate, setCurrentDate] = useState(new Date());

    const daysInMonth = useMemo(() => {
        const start = startOfMonth(currentDate);
        const end = endOfMonth(currentDate);
        return eachDayOfInterval({ start, end });
    }, [currentDate]);

    const dealsByDate = useMemo(() => {
        const map = new Map<string, Deal[]>();
        deals.forEach((deal) => {
            if (deal.expected_close_date) {
                // Fix timezone offset issue by treating the date string as local date parts
                // Or simply use the string YYYY-MM-DD for key if available, but deal.expected_close_date includes time
                const dateKey = format(new Date(deal.expected_close_date), "yyyy-MM-dd");
                if (!map.has(dateKey)) {
                    map.set(dateKey, []);
                }
                map.get(dateKey)?.push(deal);
            }
        });
        return map;
    }, [deals]);

    const handlePreviousMonth = () => setCurrentDate(subMonths(currentDate, 1));
    const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));
    const handleToday = () => setCurrentDate(new Date());

    // Padding days for grid alignment
    const startDay = startOfMonth(currentDate).getDay(); // 0 is Sunday
    const paddingDays = Array.from({ length: startDay });

    return (
        <div className="flex flex-col h-full bg-white dark:bg-gray-950 rounded-lg border shadow-sm">
            {/* Calendar Header */}
            <div className="flex items-center justify-between p-4 border-b">
                <div className="flex items-center gap-4">
                    <h2 className="text-xl font-semibold capitalize text-gray-900 dark:text-gray-100">
                        {format(currentDate, "MMMM yyyy", { locale: ptBR })}
                    </h2>
                    <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-md p-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handlePreviousMonth}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs font-medium" onClick={handleToday}>
                            Hoje
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleNextMonth}>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Summary Stats for Month can go here */}
                <div className="text-sm text-muted-foreground">
                    {deals.filter(d => d.expected_close_date && isSameMonth(new Date(d.expected_close_date), currentDate)).length} negócios previstos
                </div>
            </div>

            {/* Days Grid Header */}
            <div className="grid grid-cols-7 border-b bg-gray-50/50 dark:bg-gray-900/50">
                {["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"].map((day) => (
                    <div key={day} className="py-2 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar Grid */}
            <div className="flex-1 grid grid-cols-7 grid-rows-5 auto-rows-fr bg-gray-100 gap-px border-b overflow-hidden">
                {paddingDays.map((_, i) => (
                    <div key={`padding-${i}`} className="bg-white dark:bg-gray-950/30" />
                ))}

                {daysInMonth.map((day) => {
                    const dateKey = format(day, "yyyy-MM-dd");
                    const dayDeals = dealsByDate.get(dateKey) || [];
                    const isTodayDate = isToday(day);

                    return (
                        <div
                            key={dateKey}
                            className={cn(
                                "bg-white dark:bg-gray-950 min-h-[100px] p-2 flex flex-col gap-1 transition-colors hover:bg-gray-50/80 relative group",
                                isTodayDate && "bg-blue-50/30 ring-1 ring-inset ring-blue-500/20"
                            )}
                        >
                            <div className="flex items-start justify-between">
                                <span className={cn(
                                    "text-sm font-medium h-6 w-6 flex items-center justify-center rounded-full",
                                    isTodayDate ? "bg-blue-600 text-white" : "text-gray-700 dark:text-gray-300"
                                )}>
                                    {format(day, "d")}
                                </span>
                                {dayDeals.length > 0 && (
                                    <span className="text-[10px] text-muted-foreground font-medium">
                                        {formatCurrency(dayDeals.reduce((acc, d) => acc + (d.value || 0), 0))}
                                    </span>
                                )}
                            </div>

                            {/* Deals List */}
                            <div className="flex-1 overflow-y-auto space-y-1 mt-1 scrollbar-none">
                                {dayDeals.map((deal) => (
                                    <HoverCard key={deal.id}>
                                        <HoverCardTrigger asChild>
                                            <button
                                                align="left"
                                                onClick={() => onView(deal)}
                                                className="w-full text-left bg-white border border-l-4 rounded shadow-sm p-1.5 hover:shadow-md transition-all text-xs group/item"
                                                style={{ borderLeftColor: deal.pipeline_stages?.color || '#ccc' }}
                                            >
                                                <div className="font-medium truncate text-gray-900 dark:text-gray-100 leading-tight mb-0.5">
                                                    {deal.title}
                                                </div>
                                                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                                                    <span>{formatCurrency(deal.value || 0)}</span>
                                                    {deal.contacts?.name && (
                                                        <span className="truncate max-w-[60px] ml-1 opacity-70">
                                                            {deal.contacts.name.split(" ")[0]}
                                                        </span>
                                                    )}
                                                </div>
                                            </button>
                                        </HoverCardTrigger>
                                        <HoverCardContent side="right" align="start" className="w-80 p-0 overflow-hidden">
                                            <div className="p-3 space-y-3">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div>
                                                        <h4 className="font-semibold text-sm line-clamp-2">{deal.title}</h4>
                                                        <p className="text-xs text-muted-foreground mt-0.5">{deal.contacts?.name}</p>
                                                    </div>
                                                    <Badge variant="outline" style={{
                                                        backgroundColor: `${deal.pipeline_stages?.color}10`,
                                                        color: deal.pipeline_stages?.color,
                                                        borderColor: `${deal.pipeline_stages?.color}30`
                                                    }}>
                                                        {deal.pipeline_stages?.name}
                                                    </Badge>
                                                </div>

                                                <div className="grid grid-cols-2 gap-2 text-xs">
                                                    <div className="bg-muted/50 p-2 rounded">
                                                        <span className="block text-muted-foreground">Valor</span>
                                                        <span className="font-semibold text-base">{formatCurrency(deal.value || 0)}</span>
                                                    </div>
                                                    <div className="bg-muted/50 p-2 rounded">
                                                        <span className="block text-muted-foreground">Prioridade</span>
                                                        <span className="capitalize font-medium">{deal.priority || 'Normal'}</span>
                                                    </div>
                                                </div>

                                                {deal.profiles && (
                                                    <div className="flex items-center gap-2 pt-2 border-t">
                                                        <Avatar className="h-6 w-6">
                                                            <AvatarImage src={deal.profiles.avatar_url || undefined} />
                                                            <AvatarFallback className="text-[10px]">{deal.profiles.full_name?.substring(0, 2).toUpperCase()}</AvatarFallback>
                                                        </Avatar>
                                                        <span className="text-xs text-muted-foreground">Responsável: {deal.profiles.full_name}</span>
                                                    </div>
                                                )}

                                                <Button
                                                    size="sm"
                                                    className="w-full mt-2"
                                                    variant="secondary"
                                                    onClick={() => onView(deal)}
                                                >
                                                    Ver Detalhes
                                                </Button>
                                            </div>
                                        </HoverCardContent>
                                    </HoverCard>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
