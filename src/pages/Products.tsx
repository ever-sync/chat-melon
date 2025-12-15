import { MainLayout } from "@/components/MainLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Search, Plus, Pencil, Trash2, Package, Filter, X, Settings, FolderOpen, GripVertical,
  BookOpen, ShoppingBag, Gift, Briefcase, Wrench, Heart, Star, Zap, Coffee, Music,
  Camera, Film, Gamepad2, Headphones, Laptop, Smartphone, Watch, Car, Home, Plane
} from "lucide-react";
import { useState, useEffect } from "react";
import { useProducts } from "@/hooks/crm/useProducts";
import { useProductSettings } from "@/hooks/useProductSettings";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/CompanyContext";
import { toast } from "sonner";
import type { TablesInsert } from "@/integrations/supabase/types";

// Icon mapping for dynamic icons
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Package, BookOpen, ShoppingBag, Gift, Briefcase, Wrench, Heart, Star, Zap, Coffee,
  Music, Camera, Film, Gamepad2, Headphones, Laptop, Smartphone, Watch, Car, Home, Plane, Settings, FolderOpen
};

const AVAILABLE_ICONS = [
  { name: 'Package', label: 'Pacote' },
  { name: 'BookOpen', label: 'Livro/Curso' },
  { name: 'ShoppingBag', label: 'Sacola' },
  { name: 'Gift', label: 'Presente' },
  { name: 'Briefcase', label: 'Maleta' },
  { name: 'Wrench', label: 'Ferramenta/Serviço' },
  { name: 'Heart', label: 'Coração' },
  { name: 'Star', label: 'Estrela' },
  { name: 'Zap', label: 'Raio' },
  { name: 'Coffee', label: 'Café' },
  { name: 'Music', label: 'Música' },
  { name: 'Camera', label: 'Câmera' },
  { name: 'Film', label: 'Filme' },
  { name: 'Gamepad2', label: 'Game' },
  { name: 'Headphones', label: 'Fone' },
  { name: 'Laptop', label: 'Laptop' },
  { name: 'Smartphone', label: 'Celular' },
  { name: 'Watch', label: 'Relógio' },
  { name: 'Car', label: 'Carro' },
  { name: 'Home', label: 'Casa' },
  { name: 'Plane', label: 'Avião/Viagem' },
];

type ProductCategory = {
  id: string;
  name: string;
  description: string | null;
  color: string;
  is_active: boolean;
};

type ProductCustomField = {
  id: string;
  name: string;
  label: string;
  field_type: 'text' | 'number' | 'currency' | 'select' | 'date' | 'boolean' | 'textarea';
  options: string[] | null;
  is_required: boolean;
  default_value: string | null;
  sort_order: number;
  is_active: boolean;
};

export default function Products() {
  const { products, isLoading, createProduct, updateProduct, deleteProduct, refetch } = useProducts();
  const { settings: productSettings, updateSettings: updateProductSettings, isUpdating: isUpdatingSettings } = useProductSettings();
  const { currentCompany } = useCompany();
  const [activeTab, setActiveTab] = useState("products");

  // Settings form state
  const [configForm, setConfigForm] = useState({
    entity_name: "",
    entity_name_plural: "",
    entity_icon: "Package",
  });
  const [configInitialized, setConfigInitialized] = useState(false);

  // Initialize config form only once when settings first load
  useEffect(() => {
    if (!configInitialized && productSettings.entity_name) {
      setConfigForm({
        entity_name: productSettings.entity_name,
        entity_name_plural: productSettings.entity_name_plural,
        entity_icon: productSettings.entity_icon,
      });
      setConfigInitialized(true);
    }
  }, [productSettings, configInitialized]);

  // Get the dynamic icon component
  const EntityIcon = ICON_MAP[productSettings.entity_icon] || Package;

  // Products state
  const [searchQuery, setSearchQuery] = useState("");
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    category: "",
    minPrice: "",
    maxPrice: "",
  });

  // Categories state
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ProductCategory | null>(null);
  const [categoryForm, setCategoryForm] = useState({
    name: "",
    description: "",
    color: "#6366F1",
  });

  // Custom Fields state
  const [customFields, setCustomFields] = useState<ProductCustomField[]>([]);
  const [showFieldModal, setShowFieldModal] = useState(false);
  const [editingField, setEditingField] = useState<ProductCustomField | null>(null);
  const [fieldForm, setFieldForm] = useState({
    name: "",
    label: "",
    field_type: "text" as ProductCustomField['field_type'],
    options: "",
    is_required: false,
    default_value: "",
  });

  // Product form
  const [productForm, setProductForm] = useState<Record<string, any>>({
    name: "",
    category_id: "",
  });

  // Load categories and custom fields
  useEffect(() => {
    if (currentCompany?.id) {
      loadCategories();
      loadCustomFields();
    }
  }, [currentCompany?.id]);

  const loadCategories = async () => {
    if (!currentCompany?.id) return;

    const { data, error } = await supabase
      .from('product_categories')
      .select('*')
      .eq('company_id', currentCompany.id)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error loading categories:', error);
      return;
    }

    setCategories(data || []);
  };

  const loadCustomFields = async () => {
    if (!currentCompany?.id) return;

    const { data, error } = await supabase
      .from('product_custom_fields')
      .select('*')
      .eq('company_id', currentCompany.id)
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error loading custom fields:', error);
      return;
    }

    setCustomFields((data || []) as ProductCustomField[]);
  };

  // ===== CATEGORY HANDLERS =====
  const handleOpenCategoryModal = (category?: ProductCategory) => {
    if (category) {
      setEditingCategory(category);
      setCategoryForm({
        name: category.name,
        description: category.description || "",
        color: category.color || "#6366F1",
      });
    } else {
      setEditingCategory(null);
      setCategoryForm({ name: "", description: "", color: "#6366F1" });
    }
    setShowCategoryModal(true);
  };

  const handleSaveCategory = async () => {
    if (!categoryForm.name || !currentCompany?.id) return;

    try {
      if (editingCategory) {
        const { error } = await supabase
          .from('product_categories')
          .update({
            name: categoryForm.name,
            description: categoryForm.description || null,
            color: categoryForm.color,
          })
          .eq('id', editingCategory.id);

        if (error) throw error;
        toast.success('Categoria atualizada!');
      } else {
        const { error } = await supabase
          .from('product_categories')
          .insert({
            company_id: currentCompany.id,
            name: categoryForm.name,
            description: categoryForm.description || null,
            color: categoryForm.color,
          });

        if (error) throw error;
        toast.success('Categoria criada!');
      }

      setShowCategoryModal(false);
      loadCategories();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao salvar categoria');
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta categoria?')) return;

    try {
      const { error } = await supabase
        .from('product_categories')
        .delete()
        .eq('id', categoryId);

      if (error) throw error;
      toast.success('Categoria excluída!');
      loadCategories();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao excluir categoria');
    }
  };

  // ===== CUSTOM FIELD HANDLERS =====
  const handleOpenFieldModal = (field?: ProductCustomField) => {
    if (field) {
      setEditingField(field);
      setFieldForm({
        name: field.name,
        label: field.label,
        field_type: field.field_type,
        options: field.options?.join(', ') || "",
        is_required: field.is_required,
        default_value: field.default_value || "",
      });
    } else {
      setEditingField(null);
      setFieldForm({
        name: "",
        label: "",
        field_type: "text",
        options: "",
        is_required: false,
        default_value: "",
      });
    }
    setShowFieldModal(true);
  };

  const handleSaveField = async () => {
    if (!fieldForm.name || !fieldForm.label || !currentCompany?.id) return;

    try {
      const fieldData = {
        name: fieldForm.name.toLowerCase().replace(/\s+/g, '_'),
        label: fieldForm.label,
        field_type: fieldForm.field_type,
        options: fieldForm.field_type === 'select' && fieldForm.options
          ? fieldForm.options.split(',').map(o => o.trim())
          : null,
        is_required: fieldForm.is_required,
        default_value: fieldForm.default_value || null,
      };

      if (editingField) {
        const { error } = await supabase
          .from('product_custom_fields')
          .update(fieldData)
          .eq('id', editingField.id);

        if (error) throw error;
        toast.success('Campo atualizado!');
      } else {
        const { error } = await supabase
          .from('product_custom_fields')
          .insert({
            ...fieldData,
            company_id: currentCompany.id,
            sort_order: customFields.length,
          });

        if (error) throw error;
        toast.success('Campo criado!');
      }

      setShowFieldModal(false);
      loadCustomFields();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao salvar campo');
    }
  };

  const handleDeleteField = async (fieldId: string) => {
    if (!confirm('Tem certeza que deseja excluir este campo?')) return;

    try {
      const { error } = await supabase
        .from('product_custom_fields')
        .delete()
        .eq('id', fieldId);

      if (error) throw error;
      toast.success('Campo excluído!');
      loadCustomFields();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao excluir campo');
    }
  };

  // ===== PRODUCT HANDLERS =====
  const handleOpenProductModal = (product?: any) => {
    if (product) {
      setEditingProduct(product);
      const formValues: Record<string, any> = {
        name: product.name || "",
        category_id: product.category_id || "",
      };
      // Load custom field values
      if (product.custom_field_values) {
        Object.entries(product.custom_field_values).forEach(([key, value]) => {
          formValues[key] = value;
        });
      }
      setProductForm(formValues);
    } else {
      setEditingProduct(null);
      const formValues: Record<string, any> = { name: "", category_id: "" };
      // Set default values for custom fields
      customFields.forEach(field => {
        formValues[field.name] = field.default_value || "";
      });
      setProductForm(formValues);
    }
    setShowProductModal(true);
  };

  const handleSubmitProduct = async () => {
    if (!productForm.name || !currentCompany?.id) {
      toast.error('Nome do produto é obrigatório');
      return;
    }

    // Validate required custom fields
    for (const field of customFields) {
      if (field.is_required && !productForm[field.name]) {
        toast.error(`O campo "${field.label}" é obrigatório`);
        return;
      }
    }

    // Extract custom field values
    const customFieldValues: Record<string, any> = {};
    customFields.forEach(field => {
      if (productForm[field.name] !== undefined && productForm[field.name] !== "") {
        customFieldValues[field.name] = productForm[field.name];
      }
    });

    const productData = {
      name: productForm.name,
      category_id: productForm.category_id || null,
      custom_field_values: customFieldValues,
      price: parseFloat(customFieldValues.preco || customFieldValues.price || "0") || 0,
      description: customFieldValues.descricao || customFieldValues.description || null,
      is_active: true,
    };

    try {
      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id);

        if (error) throw error;
        toast.success('Produto atualizado!');
      } else {
        const { error } = await supabase
          .from('products')
          .insert({
            ...productData,
            company_id: currentCompany.id,
          });

        if (error) throw error;
        toast.success('Produto criado!');
      }

      setShowProductModal(false);
      refetch();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao salvar produto');
    }
  };

  const handleDeleteProduct = (productId: string) => {
    if (confirm("Tem certeza que deseja excluir este produto?")) {
      deleteProduct(productId);
    }
  };

  // Filter products
  const filteredProducts = products.filter((product) => {
    const matchesSearch = searchQuery === "" ||
      product.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filters.category === "" || product.category_id === filters.category;
    const matchesMinPrice = filters.minPrice === "" || product.price >= parseFloat(filters.minPrice);
    const matchesMaxPrice = filters.maxPrice === "" || product.price <= parseFloat(filters.maxPrice);
    return matchesSearch && matchesCategory && matchesMinPrice && matchesMaxPrice;
  });

  const hasActiveFilters = filters.category !== "" || filters.minPrice !== "" || filters.maxPrice !== "";

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return null;
    const category = categories.find(c => c.id === categoryId);
    return category?.name || null;
  };

  const getCategoryColor = (categoryId: string | null) => {
    if (!categoryId) return "#6366F1";
    const category = categories.find(c => c.id === categoryId);
    return category?.color || "#6366F1";
  };

  const renderCustomFieldInput = (field: ProductCustomField) => {
    const value = productForm[field.name] || "";

    switch (field.field_type) {
      case 'textarea':
        return (
          <Textarea
            value={value}
            onChange={(e) => setProductForm({ ...productForm, [field.name]: e.target.value })}
            placeholder={field.label}
            rows={3}
          />
        );
      case 'number':
      case 'currency':
        return (
          <Input
            type="number"
            step={field.field_type === 'currency' ? "0.01" : "1"}
            value={value}
            onChange={(e) => setProductForm({ ...productForm, [field.name]: e.target.value })}
            placeholder={field.field_type === 'currency' ? "0.00" : "0"}
          />
        );
      case 'date':
        return (
          <Input
            type="date"
            value={value}
            onChange={(e) => setProductForm({ ...productForm, [field.name]: e.target.value })}
          />
        );
      case 'boolean':
        return (
          <div className="flex items-center space-x-2">
            <Switch
              checked={value === 'true' || value === true}
              onCheckedChange={(checked) => setProductForm({ ...productForm, [field.name]: checked })}
            />
            <span className="text-sm text-muted-foreground">
              {value === 'true' || value === true ? 'Sim' : 'Não'}
            </span>
          </div>
        );
      case 'select':
        return (
          <Select
            value={value}
            onValueChange={(v) => setProductForm({ ...productForm, [field.name]: v })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      default:
        return (
          <Input
            value={value}
            onChange={(e) => setProductForm({ ...productForm, [field.name]: e.target.value })}
            placeholder={field.label}
          />
        );
    }
  };

  const fieldTypeLabels: Record<string, string> = {
    text: 'Texto',
    number: 'Número',
    currency: 'Moeda',
    select: 'Seleção',
    date: 'Data',
    boolean: 'Sim/Não',
    textarea: 'Texto Longo',
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <EntityIcon className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{productSettings.entity_name_plural}</h1>
              <p className="text-muted-foreground">
                Gerencie seu catálogo de {productSettings.entity_name_plural.toLowerCase()}
              </p>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="products" className="gap-2">
              <EntityIcon className="h-4 w-4" />
              {productSettings.entity_name_plural}
            </TabsTrigger>
            <TabsTrigger value="categories" className="gap-2">
              <FolderOpen className="h-4 w-4" />
              Categorias
            </TabsTrigger>
            <TabsTrigger value="custom-fields" className="gap-2">
              <GripVertical className="h-4 w-4" />
              Campos
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="h-4 w-4" />
              Configurações
            </TabsTrigger>
          </TabsList>

          {/* ===== TAB: PRODUTOS ===== */}
          <TabsContent value="products" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 flex-1">
                <div className="relative flex-1 max-w-md">
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
                        <h4 className="font-medium">Filtros</h4>
                        {hasActiveFilters && (
                          <Button variant="ghost" size="sm" onClick={() => setFilters({ category: "", minPrice: "", maxPrice: "" })}>
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
                            <SelectItem value="">Todas</SelectItem>
                            {categories.map((category) => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.name}
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
                            placeholder="Mín"
                            value={filters.minPrice}
                            onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
                          />
                          <span>-</span>
                          <Input
                            type="number"
                            placeholder="Máx"
                            value={filters.maxPrice}
                            onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
              <Button onClick={() => handleOpenProductModal()}>
                <Plus className="mr-2 h-4 w-4" />
                Novo {productSettings.entity_name}
              </Button>
            </div>

            <Card>
              <CardContent className="pt-6">
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
                    {filteredProducts.map((product: any) => (
                      <div
                        key={product.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{product.name}</p>
                            {product.category_id && (
                              <Badge
                                variant="outline"
                                style={{ borderColor: getCategoryColor(product.category_id), color: getCategoryColor(product.category_id) }}
                              >
                                {getCategoryName(product.category_id)}
                              </Badge>
                            )}
                          </div>
                          {/* Mostrar campos customizados */}
                          <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
                            {customFields.slice(0, 3).map(field => {
                              const value = product.custom_field_values?.[field.name];
                              if (!value) return null;
                              return (
                                <span key={field.id}>
                                  <span className="font-medium">{field.label}:</span>{' '}
                                  {field.field_type === 'currency'
                                    ? formatCurrency(parseFloat(value))
                                    : field.field_type === 'boolean'
                                      ? (value === 'true' || value === true ? 'Sim' : 'Não')
                                      : value}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenProductModal(product)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteProduct(product.id)}
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

          {/* ===== TAB: CATEGORIAS ===== */}
          <TabsContent value="categories" className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground">
                Organize seus produtos em categorias
              </p>
              <Button onClick={() => handleOpenCategoryModal()}>
                <Plus className="mr-2 h-4 w-4" />
                Nova Categoria
              </Button>
            </div>

            <Card>
              <CardContent className="pt-6">
                {categories.length === 0 ? (
                  <div className="text-center py-8">
                    <FolderOpen className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">Nenhuma categoria cadastrada</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {categories.map((category) => (
                      <div
                        key={category.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: category.color }}
                          />
                          <div>
                            <p className="font-medium">{category.name}</p>
                            {category.description && (
                              <p className="text-sm text-muted-foreground">{category.description}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenCategoryModal(category)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteCategory(category.id)}
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

          {/* ===== TAB: CAMPOS CUSTOMIZADOS ===== */}
          <TabsContent value="custom-fields" className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground">
                Defina campos personalizados que aparecerão no formulário de produtos
              </p>
              <Button onClick={() => handleOpenFieldModal()}>
                <Plus className="mr-2 h-4 w-4" />
                Novo Campo
              </Button>
            </div>

            <Card>
              <CardContent className="pt-6">
                {customFields.length === 0 ? (
                  <div className="text-center py-8">
                    <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">Nenhum campo customizado</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Crie campos personalizados como Preço, Descrição, SKU, etc.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {customFields.map((field, index) => (
                      <div
                        key={field.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <GripVertical className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{field.label}</p>
                              <Badge variant="secondary">{fieldTypeLabels[field.field_type]}</Badge>
                              {field.is_required && (
                                <Badge variant="destructive">Obrigatório</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Campo: {field.name}
                              {field.options && ` • Opções: ${field.options.join(', ')}`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenFieldModal(field)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteField(field.id)}
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

          {/* ===== TAB: CONFIGURAÇÕES ===== */}
          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Personalização</CardTitle>
                <CardDescription>
                  Personalize como seus produtos/serviços são exibidos no sistema
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="entity-name">Nome no Singular</Label>
                    <Input
                      id="entity-name"
                      value={configForm.entity_name}
                      onChange={(e) => setConfigForm({ ...configForm, entity_name: e.target.value })}
                      placeholder="Ex: Produto, Curso, Serviço"
                    />
                    <p className="text-xs text-muted-foreground">
                      Ex: "Novo {configForm.entity_name || 'Produto'}"
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="entity-name-plural">Nome no Plural</Label>
                    <Input
                      id="entity-name-plural"
                      value={configForm.entity_name_plural}
                      onChange={(e) => setConfigForm({ ...configForm, entity_name_plural: e.target.value })}
                      placeholder="Ex: Produtos, Cursos, Serviços"
                    />
                    <p className="text-xs text-muted-foreground">
                      Ex: "Lista de {configForm.entity_name_plural || 'Produtos'}"
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Ícone</Label>
                  <div className="grid grid-cols-7 gap-2">
                    {AVAILABLE_ICONS.map(({ name, label }) => {
                      const IconComponent = ICON_MAP[name];
                      const isSelected = configForm.entity_icon === name;
                      return (
                        <button
                          key={name}
                          type="button"
                          onClick={() => setConfigForm({ ...configForm, entity_icon: name })}
                          className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-1 ${isSelected
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:border-primary/50'
                            }`}
                          title={label}
                        >
                          <IconComponent className={`h-6 w-6 ${isSelected ? 'text-primary' : ''}`} />
                          <span className="text-[10px] text-muted-foreground truncate w-full text-center">
                            {label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 p-4 rounded-lg bg-muted/50 flex-1">
                      <p className="text-sm text-muted-foreground">Prévia:</p>
                      {(() => {
                        const PreviewIcon = ICON_MAP[configForm.entity_icon] || Package;
                        return <PreviewIcon className="h-6 w-6 text-primary" />;
                      })()}
                      <span className="font-medium">{configForm.entity_name_plural || 'Produtos'}</span>
                    </div>
                    <Button
                      onClick={() => updateProductSettings(configForm)}
                      disabled={isUpdatingSettings}
                    >
                      {isUpdatingSettings ? 'Salvando...' : 'Salvar Configurações'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* ===== MODAL: NOVO/EDITAR PRODUTO ===== */}
      <Dialog open={showProductModal} onOpenChange={setShowProductModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? `Editar ${productSettings.entity_name}` : `Novo ${productSettings.entity_name}`}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            {/* Nome do produto - sempre obrigatório */}
            <div>
              <Label htmlFor="product-name">Nome do {productSettings.entity_name} *</Label>
              <Input
                id="product-name"
                value={productForm.name}
                onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                placeholder={`Nome do ${productSettings.entity_name.toLowerCase()}`}
              />
            </div>

            {/* Categoria */}
            {categories.length > 0 && (
              <div>
                <Label>Categoria</Label>
                <Select
                  value={productForm.category_id}
                  onValueChange={(value) => setProductForm({ ...productForm, category_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Sem categoria</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: category.color }}
                          />
                          {category.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Campos customizados */}
            {customFields.map((field) => (
              <div key={field.id}>
                <Label htmlFor={field.name}>
                  {field.label}
                  {field.is_required && ' *'}
                </Label>
                {renderCustomFieldInput(field)}
              </div>
            ))}

            {customFields.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4 border-t">
                💡 Adicione campos customizados na aba "Campos Customizados" para personalizar este formulário
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowProductModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmitProduct}>
              {editingProduct ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== MODAL: NOVA/EDITAR CATEGORIA ===== */}
      <Dialog open={showCategoryModal} onOpenChange={setShowCategoryModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? "Editar Categoria" : "Nova Categoria"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="category-name">Nome *</Label>
              <Input
                id="category-name"
                value={categoryForm.name}
                onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                placeholder="Nome da categoria"
              />
            </div>
            <div>
              <Label htmlFor="category-description">Descrição</Label>
              <Textarea
                id="category-description"
                value={categoryForm.description}
                onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                placeholder="Descrição opcional"
                rows={2}
              />
            </div>
            <div>
              <Label htmlFor="category-color">Cor</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  id="category-color"
                  value={categoryForm.color}
                  onChange={(e) => setCategoryForm({ ...categoryForm, color: e.target.value })}
                  className="w-10 h-10 rounded cursor-pointer border"
                />
                <Input
                  value={categoryForm.color}
                  onChange={(e) => setCategoryForm({ ...categoryForm, color: e.target.value })}
                  className="flex-1"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCategoryModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveCategory}>
              {editingCategory ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== MODAL: NOVO/EDITAR CAMPO CUSTOMIZADO ===== */}
      <Dialog open={showFieldModal} onOpenChange={setShowFieldModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingField ? "Editar Campo" : "Novo Campo Customizado"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="field-label">Rótulo/Label *</Label>
              <Input
                id="field-label"
                value={fieldForm.label}
                onChange={(e) => {
                  const label = e.target.value;
                  setFieldForm({
                    ...fieldForm,
                    label,
                    name: label.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
                  });
                }}
                placeholder="Ex: Preço de Venda"
              />
            </div>
            <div>
              <Label htmlFor="field-name">Nome do Campo (automático)</Label>
              <Input
                id="field-name"
                value={fieldForm.name}
                disabled
                className="bg-muted"
              />
            </div>
            <div>
              <Label htmlFor="field-type">Tipo de Campo *</Label>
              <Select
                value={fieldForm.field_type}
                onValueChange={(value: ProductCustomField['field_type']) => setFieldForm({ ...fieldForm, field_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Texto</SelectItem>
                  <SelectItem value="textarea">Texto Longo</SelectItem>
                  <SelectItem value="number">Número</SelectItem>
                  <SelectItem value="currency">Moeda (R$)</SelectItem>
                  <SelectItem value="date">Data</SelectItem>
                  <SelectItem value="boolean">Sim/Não</SelectItem>
                  <SelectItem value="select">Seleção</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {fieldForm.field_type === 'select' && (
              <div>
                <Label htmlFor="field-options">Opções (separadas por vírgula)</Label>
                <Input
                  id="field-options"
                  value={fieldForm.options}
                  onChange={(e) => setFieldForm({ ...fieldForm, options: e.target.value })}
                  placeholder="Opção 1, Opção 2, Opção 3"
                />
              </div>
            )}
            <div>
              <Label htmlFor="field-default">Valor Padrão</Label>
              <Input
                id="field-default"
                value={fieldForm.default_value}
                onChange={(e) => setFieldForm({ ...fieldForm, default_value: e.target.value })}
                placeholder="Valor padrão opcional"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={fieldForm.is_required}
                onCheckedChange={(checked) => setFieldForm({ ...fieldForm, is_required: checked })}
              />
              <Label>Campo obrigatório</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFieldModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveField}>
              {editingField ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}