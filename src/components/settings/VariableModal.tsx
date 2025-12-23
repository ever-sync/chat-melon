import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useVariables, CompanyVariable } from '@/hooks/useVariables';
import { STANDARD_VARIABLE_CATEGORIES } from '@/constants/variables';
import { AtSign, Info } from 'lucide-react';

interface VariableModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    variable?: CompanyVariable;
}

type VariableFormData = Omit<CompanyVariable, 'id' | 'company_id' | 'created_at' | 'updated_at'>;

export function VariableModal({ open, onOpenChange, variable }: VariableModalProps) {
    const { createVariable, updateVariable, isCreating, isUpdating } = useVariables();
    const [assignmentType, setAssignmentType] = useState<'fixed' | 'variable'>('fixed');
    const { register, handleSubmit, reset, setValue, watch } = useForm<VariableFormData>();

    const currentValue = watch('value');

    useEffect(() => {
        if (variable) {
            reset({
                key: variable.key,
                label: variable.label,
                value: variable.value,
                description: variable.description,
            });
            // Check if value looks like a dynamic variable reference {{...}}
            if (variable.value?.startsWith('{{') && variable.value?.endsWith('}}')) {
                setAssignmentType('variable');
            } else {
                setAssignmentType('fixed');
            }
        } else {
            reset({
                key: '',
                label: '',
                value: '',
                description: '',
            });
            setAssignmentType('fixed');
        }
    }, [variable, reset, open]);

    const onSubmit = (data: VariableFormData) => {
        // Ensure key has no spaces and is lowercase
        data.key = data.key.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');

        if (variable) {
            updateVariable({ id: variable.id, ...data }, {
                onSuccess: () => onOpenChange(false)
            });
        } else {
            createVariable(data, {
                onSuccess: () => onOpenChange(false)
            });
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] border-none shadow-2xl rounded-3xl overflow-hidden p-0">
                <div className="bg-indigo-600/5 p-8 flex flex-col items-center justify-center border-b border-indigo-50">
                    <div className="w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center mb-4 border border-indigo-50">
                        <AtSign className="h-8 w-8 text-cyan-500" />
                    </div>
                    <DialogTitle className="text-xl font-bold text-gray-800">
                        {variable ? 'Editar Variável' : 'Nova Variável'}
                    </DialogTitle>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="key" className="text-sm font-semibold text-gray-700">Variável</Label>
                            <div className="relative group transition-all duration-200">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors">
                                    <AtSign className="h-4 w-4" />
                                </div>
                                <Input
                                    id="key"
                                    placeholder="link_agendamento"
                                    className="pl-10 h-11 bg-gray-50/50 border-gray-100 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 transition-all font-mono text-sm"
                                    {...register('key', { required: true })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="label" className="text-sm font-semibold text-gray-700">Rótulo (Label)</Label>
                            <Input
                                id="label"
                                placeholder="Ex: Link para Agendar Reunião"
                                className="h-11 bg-gray-50/50 border-gray-100 rounded-xl focus:ring-indigo-500 transition-all"
                                {...register('label', { required: true })}
                            />
                        </div>

                        <div className="space-y-3">
                            <Label className="text-sm font-semibold text-gray-700">Valor de Atribuição</Label>
                            <RadioGroup
                                value={assignmentType}
                                onValueChange={(v: 'fixed' | 'variable') => setAssignmentType(v)}
                                className="flex gap-6"
                            >
                                <div className="flex items-center space-x-2 cursor-pointer">
                                    <RadioGroupItem value="fixed" id="r1" className="text-cyan-500 border-gray-300" />
                                    <Label htmlFor="r1" className="text-sm font-medium text-gray-600 cursor-pointer">Fixo</Label>
                                </div>
                                <div className="flex items-center space-x-2 cursor-pointer">
                                    <RadioGroupItem value="variable" id="r2" className="text-cyan-500 border-gray-300" />
                                    <Label htmlFor="r2" className="text-sm font-medium text-gray-600 cursor-pointer">Variável</Label>
                                </div>
                            </RadioGroup>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="value" className="text-sm font-semibold text-gray-700">
                                {assignmentType === 'fixed' ? 'Valor' : 'Selecionar Variável'}
                            </Label>
                            {assignmentType === 'fixed' ? (
                                <Input
                                    id="value"
                                    placeholder="Digite o valor fixo..."
                                    className="h-11 bg-gray-50/50 border-gray-100 rounded-xl focus:ring-indigo-500 transition-all"
                                    {...register('value', { required: true })}
                                />
                            ) : (
                                <Select
                                    value={currentValue}
                                    onValueChange={(v) => setValue('value', v)}
                                >
                                    <SelectTrigger className="h-11 bg-gray-50/50 border-gray-100 rounded-xl focus:ring-indigo-500 transition-all">
                                        <SelectValue placeholder="Escolha uma variável do sistema..." />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-[300px] rounded-2xl border-indigo-50 shadow-xl p-2">
                                        {/* Standard Variables */}
                                        {STANDARD_VARIABLE_CATEGORIES.map((category) => (
                                            <SelectGroup key={category.id}>
                                                <SelectLabel className="px-2 py-1.5 text-[10px] uppercase tracking-wider font-bold text-gray-400 bg-gray-50/50 rounded-lg mt-2 first:mt-0">
                                                    {category.label}
                                                </SelectLabel>
                                                {category.variables.map((v) => (
                                                    <SelectItem
                                                        key={v.key}
                                                        value={`{{${v.key}}}`}
                                                        className="rounded-xl cursor-pointer hover:bg-indigo-50 transition-colors my-0.5"
                                                    >
                                                        <span className="font-medium text-gray-700">{category.label}: </span>
                                                        <span className="text-gray-500">{v.label}</span>
                                                    </SelectItem>
                                                ))}
                                            </SelectGroup>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description" className="text-sm font-semibold text-gray-700">Descrição (Opcional)</Label>
                            <Textarea
                                id="description"
                                placeholder="Para que serve esta variável..."
                                className="bg-gray-50/50 border-gray-100 rounded-xl min-h-[80px] focus:ring-indigo-500 transition-all"
                                {...register('description')}
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-2 p-4 bg-amber-50 rounded-2xl border border-amber-100">
                        <Info className="h-5 w-5 text-amber-500 shrink-0" />
                        <p className="text-xs text-amber-700 leading-relaxed">
                            Ao usar o tipo <strong>Variável</strong>, o valor será atualizado dinamicamente com base nos dados do sistema no momento do envio.
                        </p>
                    </div>

                    <DialogFooter className="gap-3 sm:justify-between">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => onOpenChange(false)}
                            className="rounded-xl px-6 hover:bg-gray-100"
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            disabled={isCreating || isUpdating}
                            className="rounded-xl px-8 bg-gradient-to-r from-cyan-500 to-indigo-600 text-white font-semibold shadow-lg hover:shadow-cyan-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                        >
                            {isCreating || isUpdating ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Processando...
                                </div>
                            ) : (
                                variable ? 'Salvar Alterações' : 'Criar Variável'
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
