import { MainLayout } from "@/components/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus, Pencil, Trash2, Package, Filter, X } from "lucide-react";
import { useState } from "react";
import { useProducts } from "@/hooks/useProducts";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { TablesInsert } from "@/integrations/supabase/types";

export default function Products() {
  const { products, isLoading, createProduct, updateProduct, deleteProduct } = useProducts();
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    category: "",
    minPrice: "",
    maxPrice: "",
  });
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    cost: "",
    sku: "",
    category: "",
  });

  const handleOpenModal = (product?: any) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name || "",
        description: product.description || "",
        price: product.price?.toString() || "",
        cost: product.cost?.toString() || "",
        sku: product.sku || "",
        category: product.category || "",
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: "",
        description: "",
        price: "",
        cost: "",
        sku: "",
        category: "",
      });
    }
    setShowModal(true);
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.price) {
      return;
    }

    const productData = {
      name: formData.name,
      description: formData.description || null,
      price: parseFloat(formData.price),
      cost: formData.cost ? parseFloat(formData.cost) : null,
      sku: formData.sku || null,
      category: formData.category || null,
      is_active: true,
    };

    if (editingProduct) {
      updateProduct({ id: editingProduct.id, ...productData });
    } else {
      createProduct(productData as TablesInsert<"products">);
    }

    setShowModal(false);
  };

  const handleDelete = (productId: string) => {
    if (confirm("Tem certeza que deseja excluir este produto?")) {
      deleteProduct(productId);
    }
  };

  // Categorias únicas para o filtro
  const uniqueCategories = Array.from(new Set(products.map(p => p.category).filter(Boolean))) as string[];

  // Aplicar filtros
  const filteredProducts = products.filter((product) => {
    // Busca por texto
    const matchesSearch = searchQuery === "" || 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.category?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
      (product.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);

    // Filtro por categoria
    const matchesCategory = filters.category === "" || product.category === filters.category;

    // Filtro por faixa de preço
    const matchesMinPrice = filters.minPrice === "" || product.price >= parseFloat(filters.minPrice);
    const matchesMaxPrice = filters.maxPrice === "" || product.price <= parseFloat(filters.maxPrice);

    return matchesSearch && matchesCategory && matchesMinPrice && matchesMaxPrice;
  });

  const hasActiveFilters = filters.category !== "" || filters.minPrice !== "" || filters.maxPrice !== "";

  const clearFilters = () => {
    setFilters({
      category: "",
      minPrice: "",
      maxPrice: "",
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Produtos</h1>
            <p className="text-muted-foreground">
              Gerencie seu catálogo de produtos e serviços
            </p>
          </div>
          <Button onClick={() => handleOpenModal()}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Produto
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar produtos..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Popover open={showFilters} onOpenChange={setShowFilters}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Filter className="h-4 w-4" />
                    Filtros
                    {hasActiveFilters && (
                      <span className="ml-1 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                        {Object.values(filters).filter(v => v !== "").length}
                      </span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80" align="end">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Filtros Avançados</h4>
                      {hasActiveFilters && (
                        <Button variant="ghost" size="sm" onClick={clearFilters}>
                          <X className="h-4 w-4 mr-1" />
                          Limpar
                        </Button>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Categoria</Label>
                      <Select
                        value={filters.category}
                        onValueChange={(value) => setFilters({ ...filters, category: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Todas as categorias" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Todas as categorias</SelectItem>
                          {uniqueCategories.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Faixa de Preço</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          placeholder="Mínimo"
                          value={filters.minPrice}
                          onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
                          step="0.01"
                        />
                        <span className="text-muted-foreground">até</span>
                        <Input
                          type="number"
                          placeholder="Máximo"
                          value={filters.maxPrice}
                          onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                          step="0.01"
                        />
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-center text-muted-foreground py-8">Carregando...</p>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">
                  {searchQuery ? "Nenhum produto encontrado" : "Nenhum produto cadastrado"}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{product.name}</p>
                        {product.category && (
                          <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full">
                            {product.category}
                          </span>
                        )}
                      </div>
                      {product.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {product.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                        <span className="font-semibold text-foreground">
                          {formatCurrency(product.price)}
                        </span>
                        {product.sku && <span>SKU: {product.sku}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenModal(product)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(product.id)}
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
      </div>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? "Editar Produto" : "Novo Produto"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nome do produto"
              />
            </div>
            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descrição detalhada"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price">Preço de Venda *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="cost">Custo</Label>
                <Input
                  id="cost"
                  type="number"
                  step="0.01"
                  value={formData.cost}
                  onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="sku">SKU</Label>
                <Input
                  id="sku"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  placeholder="SKU-001"
                />
              </div>
              <div>
                <Label htmlFor="category">Categoria</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="Serviços"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit}>
              {editingProduct ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}