import { useState, useMemo } from 'react';
import {
    Building2,
    User,
    Users,
    Bot,
    MoreHorizontal,
    Variable,
    Search,
    Check,
    ChevronRight,
    Code,
} from 'lucide-react';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { useVariables } from '@/hooks/useVariables';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

import { STANDARD_VARIABLE_CATEGORIES } from '@/constants/variables';

interface VariablePickerProps {
    onSelect: (variableKey: string) => void;
    trigger?: React.ReactNode;
    hideStandard?: boolean;
}

export const VariablePicker = ({ onSelect, trigger, hideStandard = false }: VariablePickerProps) => {
    const [open, setOpen] = useState(false);
    const { variables: customVariables, isLoading } = useVariables();

    const categories = useMemo(() => {
        const all: any[] = [];

        // 1. Prioritize Custom Variables
        if (customVariables && customVariables.length > 0) {
            all.push({
                id: 'personalizadas',
                label: 'Suas Variáveis',
                icon: Variable,
                variables: customVariables.map((v) => ({
                    key: v.key,
                    label: v.label,
                    description: v.description,
                })),
            });
        }

        // 2. Add Standard unless hidden
        if (!hideStandard) {
            all.push(...STANDARD_VARIABLE_CATEGORIES);
        }

        return all;
    }, [customVariables, hideStandard]);

    const handleSelect = (key: string) => {
        onSelect(`{{${key}}}`);
        setOpen(false);
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                {trigger || (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full hover:bg-indigo-50 hover:text-indigo-600 transition-all duration-300"
                        title="Inserir Variável"
                    >
                        <Variable className="h-5 w-5" />
                    </Button>
                )}
            </PopoverTrigger>
            <PopoverContent
                className="w-80 p-0 overflow-hidden border-indigo-100 shadow-2xl rounded-2xl z-[9999]"
                align="start"
                sideOffset={8}
            >
                <Command className="bg-white">
                    <div className="flex items-center border-b border-indigo-50 px-3 bg-indigo-50/30">
                        <Search className="mr-2 h-4 w-4 shrink-0 text-indigo-400" />
                        <CommandInput
                            placeholder="Encontre variáveis..."
                            className="h-11 bg-transparent focus:ring-0 border-none"
                        />
                    </div>
                    <CommandList className="max-h-[350px]">
                        <CommandEmpty className="py-6 text-center text-sm text-gray-400">
                            Nenhuma variável encontrada.
                        </CommandEmpty>

                        <ScrollArea className="h-full">
                            {categories.map((category) => (
                                <CommandGroup
                                    key={category.id}
                                    heading={
                                        <div className="flex items-center gap-2 text-indigo-900/40 px-1 pt-2 pb-1">
                                            <category.icon className="h-3 w-3" />
                                            <span className="text-[10px] uppercase tracking-wider font-bold">{category.label}</span>
                                        </div>
                                    }
                                    className="px-2"
                                >
                                    {category.variables.map((variable) => (
                                        <CommandItem
                                            key={variable.key}
                                            onSelect={() => handleSelect(variable.key)}
                                            className="flex items-center justify-between py-2.5 px-3 mb-1 rounded-xl cursor-pointer hover:bg-indigo-50/80 transition-all group"
                                        >
                                            <div className="flex flex-col gap-0.5">
                                                <span className="text-sm font-medium text-gray-700 group-hover:text-indigo-700">
                                                    {variable.label}
                                                </span>
                                                {variable.description && (
                                                    <span className="text-[10px] text-gray-400 group-hover:text-indigo-400 truncate max-w-[180px]">
                                                        {variable.description}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <code className="text-[10px] bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded font-mono">
                                                    {"{{"}{variable.key}{"}}"}
                                                </code>
                                                <ChevronRight className="h-3 w-3 text-indigo-300" />
                                            </div>
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            ))}
                        </ScrollArea>
                    </CommandList>

                    <div className="p-2 border-t border-indigo-50 bg-indigo-50/20">
                        <p className="text-[10px] text-indigo-400 text-center font-medium">
                            As variáveis serão substituídas ao enviar a mensagem.
                        </p>
                    </div>
                </Command>
            </PopoverContent>
        </Popover>
    );
};
