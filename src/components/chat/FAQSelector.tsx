import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { HelpCircle, Search, MessageSquare } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyQuery } from "@/hooks/crm/useCompanyQuery";

interface FAQSelectorProps {
    onSelect: (answer: string) => void;
}

export const FAQSelector = ({ onSelect }: FAQSelectorProps) => {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const { companyId } = useCompanyQuery();

    const { data: faqs } = useQuery({
        queryKey: ["faqs", companyId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("company_faqs")
                .select("*")
                .eq("company_id", companyId)
                .order("question", { ascending: true });

            if (error) throw error;
            return data;
        },
        enabled: !!companyId && open,
    });

    const handleSelect = (answer: string) => {
        onSelect(answer);
        setOpen(false);
        setSearch("");
    };

    const filteredFaqs = faqs?.filter(faq =>
        faq.question.toLowerCase().includes(search.toLowerCase()) ||
        faq.answer.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" type="button" title="Respostas Prontas (FAQ)">
                    <HelpCircle className="h-5 w-5" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-96 p-0" align="end">
                <div className="p-3 border-b">
                    <div className="relative">
                        <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar nas FAQs..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-8"
                        />
                    </div>
                </div>

                <ScrollArea className="h-80">
                    <div className="p-2 space-y-1">
                        {filteredFaqs?.map((faq) => (
                            <button
                                key={faq.id}
                                onClick={() => handleSelect(faq.answer)}
                                className="w-full text-left p-2.5 rounded-md hover:bg-accent transition-colors group"
                            >
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <MessageSquare className="h-4 w-4 text-indigo-500 shrink-0" />
                                        <span className="font-medium text-sm text-gray-900 group-hover:text-indigo-700">
                                            {faq.question}
                                        </span>
                                    </div>
                                    <p className="text-xs text-muted-foreground line-clamp-2 pl-6">
                                        {faq.answer}
                                    </p>
                                </div>
                            </button>
                        ))}

                        {filteredFaqs?.length === 0 && (
                            <div className="text-center py-8 text-muted-foreground text-sm">
                                Nenhuma FAQ encontrada
                            </div>
                        )}

                        {(!faqs || faqs.length === 0) && (
                            <div className="text-center py-8 text-muted-foreground text-sm">
                                Nenhuma FAQ cadastrada.
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </PopoverContent>
        </Popover>
    );
};
