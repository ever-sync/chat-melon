import { useState } from "react";
import { MainLayout } from "@/components/MainLayout";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Plus, Pencil, Trash2, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useCompanyQuery } from "@/hooks/useCompanyQuery";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export default function FAQ() {
    const { companyId } = useCompanyQuery();
    const queryClient = useQueryClient();

    // FAQ States
    const [isFaqOpen, setIsFaqOpen] = useState(false);
    const [editingFaqId, setEditingFaqId] = useState<string | null>(null);
    const [faqForm, setFaqForm] = useState({ question: "", answer: "", category_id: "none" });

    // Category States
    const [isCatOpen, setIsCatOpen] = useState(false);
    const [editingCatId, setEditingCatId] = useState<string | null>(null);
    const [catForm, setCatForm] = useState({ name: "" });

    // --- QUERIES ---
    const { data: faqs, isLoading: isFaqsLoading } = useQuery({
        queryKey: ["faqs", companyId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("company_faqs")
                .select("*, faq_categories(name)")
                .eq("company_id", companyId)
                .order("created_at", { ascending: false });
            if (error) throw error;
            return data;
        },
        enabled: !!companyId,
    });

    const { data: categories, isLoading: isCatsLoading } = useQuery({
        queryKey: ["faq_categories", companyId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("faq_categories")
                .select("*")
                .eq("company_id", companyId)
                .order("created_at", { ascending: false });
            if (error) throw error;
            return data;
        },
        enabled: !!companyId,
    });

    // --- MUTATIONS: FAQ ---
    const createFaqMutation = useMutation({
        mutationFn: async (newFaq: { question: string; answer: string, category_id: string | null }) => {
            const { error } = await supabase.from("company_faqs").insert({
                company_id: companyId,
                ...newFaq,
            });
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["faqs"] });
            setIsFaqOpen(false);
            setFaqForm({ question: "", answer: "", category_id: "none" });
            toast.success("FAQ criada com sucesso!");
        },
        onError: (error) => toast.error("Erro ao criar FAQ: " + error.message),
    });

    const updateFaqMutation = useMutation({
        mutationFn: async ({ id, ...updates }: { id: string; question: string; answer: string, category_id: string | null }) => {
            const { error } = await supabase.from("company_faqs").update(updates).eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["faqs"] });
            setIsFaqOpen(false);
            setEditingFaqId(null);
            setFaqForm({ question: "", answer: "", category_id: "none" });
            toast.success("FAQ atualizada com sucesso!");
        },
        onError: (error) => toast.error("Erro ao atualizar FAQ: " + error.message),
    });

    const deleteFaqMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from("company_faqs").delete().eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["faqs"] });
            toast.success("FAQ removida com sucesso!");
        },
    });

    // --- MUTATIONS: CATEGORIES ---
    const createCatMutation = useMutation({
        mutationFn: async (newCat: { name: string }) => {
            const { error } = await supabase.from("faq_categories").insert({
                company_id: companyId,
                ...newCat,
            });
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["faq_categories"] });
            setIsCatOpen(false);
            setCatForm({ name: "" });
            toast.success("Categoria criada com sucesso!");
        },
        onError: (error) => toast.error("Erro ao criar categoria: " + error.message),
    });

    const updateCatMutation = useMutation({
        mutationFn: async ({ id, name }: { id: string; name: string }) => {
            const { error } = await supabase.from("faq_categories").update({ name }).eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["faq_categories"] });
            setIsCatOpen(false);
            setEditingCatId(null);
            setCatForm({ name: "" });
            toast.success("Categoria atualizada com sucesso!");
        },
        onError: (error) => toast.error("Erro ao atualizar categoria: " + error.message),
    });

    const deleteCatMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from("faq_categories").delete().eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["faq_categories"] });
            toast.success("Categoria removida com sucesso!");
        },
        onError: (error) => toast.error("Erro ao remover categoria. Verifique se há FAQs vinculadas."),
    });

    // --- HANDLERS: FAQ ---
    const handleFaqSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const payload = {
            ...faqForm,
            category_id: faqForm.category_id === "none" ? null : faqForm.category_id
        };

        if (editingFaqId) {
            updateFaqMutation.mutate({ id: editingFaqId, ...payload });
        } else {
            createFaqMutation.mutate(payload);
        }
    };

    const handleEditFaq = (faq: any) => {
        setEditingFaqId(faq.id);
        setFaqForm({
            question: faq.question,
            answer: faq.answer,
            category_id: faq.category_id || "none"
        });
        setIsFaqOpen(true);
    };

    const handleNewFaq = () => {
        setEditingFaqId(null);
        setFaqForm({ question: "", answer: "", category_id: "none" });
        setIsFaqOpen(true);
    };

    // --- HANDLERS: CATEGORY ---
    const handleCatSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingCatId) {
            updateCatMutation.mutate({ id: editingCatId, ...catForm });
        } else {
            createCatMutation.mutate(catForm);
        }
    };

    const handleEditCat = (cat: any) => {
        setEditingCatId(cat.id);
        setCatForm({ name: cat.name });
        setIsCatOpen(true);
    };

    const handleNewCat = () => {
        setEditingCatId(null);
        setCatForm({ name: "" });
        setIsCatOpen(true);
    };

    return (
        <MainLayout>
            <div className="space-y-8 max-w-4xl mx-auto">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">Perguntas Frequentes</h1>
                    <p className="text-gray-500 mt-2">
                        Gerencie as respostas prontas e organize-as por categorias.
                    </p>
                </div>

                <Tabs defaultValue="faqs" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-8">
                        <TabsTrigger value="faqs">Perguntas</TabsTrigger>
                        <TabsTrigger value="categories">Categorias</TabsTrigger>
                    </TabsList>

                    {/* --- TAB: FAQS --- */}
                    <TabsContent value="faqs" className="space-y-4">
                        <div className="flex justify-end">
                            <Dialog open={isFaqOpen} onOpenChange={setIsFaqOpen}>
                                <DialogTrigger asChild>
                                    <Button onClick={handleNewFaq} className="bg-indigo-600 hover:bg-indigo-700 rounded-xl">
                                        <Plus className="w-4 h-4 mr-2" />
                                        Nova FAQ
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>{editingFaqId ? "Editar FAQ" : "Nova FAQ"}</DialogTitle>
                                    </DialogHeader>
                                    <form onSubmit={handleFaqSubmit} className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="question">Pergunta</Label>
                                            <Input
                                                id="question"
                                                value={faqForm.question}
                                                onChange={(e) => setFaqForm({ ...faqForm, question: e.target.value })}
                                                placeholder="Ex: Qual o horário de atendimento?"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="category">Categoria</Label>
                                            <Select
                                                value={faqForm.category_id}
                                                onValueChange={(value) => setFaqForm({ ...faqForm, category_id: value })}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Selecione uma categoria" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="none">Sem categoria</SelectItem>
                                                    {categories?.map((cat) => (
                                                        <SelectItem key={cat.id} value={cat.id}>
                                                            {cat.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="answer">Resposta</Label>
                                            <Textarea
                                                id="answer"
                                                value={faqForm.answer}
                                                onChange={(e) => setFaqForm({ ...faqForm, answer: e.target.value })}
                                                placeholder="Ex: Nosso atendimento é de segunda a sexta..."
                                                className="h-32"
                                                required
                                            />
                                        </div>
                                        <DialogFooter>
                                            <Button type="button" variant="outline" onClick={() => setIsFaqOpen(false)}>
                                                Cancelar
                                            </Button>
                                            <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">
                                                {editingFaqId ? "Salvar Alterações" : "Criar FAQ"}
                                            </Button>
                                        </DialogFooter>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        </div>

                        <Card className="border-0 shadow-sm rounded-2xl bg-white overflow-hidden">
                            <CardHeader className="border-b border-gray-100 bg-gray-50/50 p-6">
                                <div className="flex items-center gap-2 text-indigo-600 font-medium">
                                    <MessageSquare className="h-5 w-5" />
                                    <span>Lista de FAQs</span>
                                </div>
                            </CardHeader>
                            <CardContent className="p-6">
                                {isFaqsLoading ? (
                                    <div className="text-center py-8 text-gray-500">Carregando...</div>
                                ) : faqs?.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500">
                                        Nenhuma FAQ cadastrada.
                                    </div>
                                ) : (
                                    <Accordion type="single" collapsible className="w-full">
                                        {faqs?.map((faq) => (
                                            <AccordionItem key={faq.id} value={faq.id}>
                                                <div className="flex items-center justify-between w-full hover:bg-gray-50 pr-4 rounded-lg group transition-colors">
                                                    <AccordionTrigger className="text-gray-800 hover:text-indigo-600 hover:no-underline px-4 flex-1">
                                                        <div className="flex items-center gap-3">
                                                            <span>{faq.question}</span>
                                                            {faq.faq_categories?.name && (
                                                                <Badge variant="secondary" className="text-xs font-normal">
                                                                    {faq.faq_categories.name}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </AccordionTrigger>
                                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleEditFaq(faq);
                                                            }}
                                                            className="h-8 w-8 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50"
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if (confirm("Tem certeza que deseja excluir esta FAQ?")) {
                                                                    deleteFaqMutation.mutate(faq.id);
                                                                }
                                                            }}
                                                            className="h-8 w-8 text-gray-500 hover:text-red-600 hover:bg-red-50"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                                <AccordionContent className="text-gray-600 leading-relaxed px-4 pb-4">
                                                    {faq.answer}
                                                </AccordionContent>
                                            </AccordionItem>
                                        ))}
                                    </Accordion>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* --- TAB: CATEGORIES --- */}
                    <TabsContent value="categories" className="space-y-4">
                        <div className="flex justify-end">
                            <Dialog open={isCatOpen} onOpenChange={setIsCatOpen}>
                                <DialogTrigger asChild>
                                    <Button onClick={handleNewCat} className="bg-indigo-600 hover:bg-indigo-700 rounded-xl">
                                        <Plus className="w-4 h-4 mr-2" />
                                        Nova Categoria
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>{editingCatId ? "Editar Categoria" : "Nova Categoria"}</DialogTitle>
                                    </DialogHeader>
                                    <form onSubmit={handleCatSubmit} className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="catName">Nome da Categoria</Label>
                                            <Input
                                                id="catName"
                                                value={catForm.name}
                                                onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
                                                placeholder="Ex: Financeiro, Suporte..."
                                                required
                                            />
                                        </div>
                                        <DialogFooter>
                                            <Button type="button" variant="outline" onClick={() => setIsCatOpen(false)}>
                                                Cancelar
                                            </Button>
                                            <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">
                                                {editingCatId ? "Salvar Alterações" : "Criar Categoria"}
                                            </Button>
                                        </DialogFooter>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        </div>

                        <Card className="border-0 shadow-sm rounded-2xl bg-white overflow-hidden">
                            <CardHeader className="border-b border-gray-100 bg-gray-50/50 p-6">
                                <div className="flex items-center gap-2 text-indigo-600 font-medium">
                                    <Tag className="h-5 w-5" />
                                    <span>Lista de Categorias</span>
                                </div>
                            </CardHeader>
                            <CardContent className="p-6">
                                {isCatsLoading ? (
                                    <div className="text-center py-8 text-gray-500">Carregando...</div>
                                ) : categories?.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500">
                                        Nenhuma categoria cadastrada.
                                    </div>
                                ) : (
                                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                        {categories?.map((cat) => (
                                            <div key={cat.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 group hover:border-indigo-100 transition-all">
                                                <span className="font-medium text-gray-900">{cat.name}</span>
                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        onClick={() => handleEditCat(cat)}
                                                        className="h-8 w-8 text-gray-500 hover:text-indigo-600"
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        onClick={() => {
                                                            if (confirm("Tem certeza que deseja excluir esta categoria?")) {
                                                                deleteCatMutation.mutate(cat.id);
                                                            }
                                                        }}
                                                        className="h-8 w-8 text-gray-500 hover:text-red-600"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </MainLayout>
    );
}
