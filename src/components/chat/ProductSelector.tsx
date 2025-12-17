import { useState, useEffect } from 'react';
import {
  Package,
  Search,
  X,
  BookOpen,
  ShoppingBag,
  Gift,
  Briefcase,
  Wrench,
  Heart,
  Star,
  Zap,
  Coffee,
  Music,
  Camera,
  Film,
  Gamepad2,
  Headphones,
  Laptop,
  Smartphone,
  Watch,
  Car,
  Home,
  Plane,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/contexts/CompanyContext';
import { useProductSettings } from '@/hooks/useProductSettings';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Icon mapping for dynamic icons
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Package,
  BookOpen,
  ShoppingBag,
  Gift,
  Briefcase,
  Wrench,
  Heart,
  Star,
  Zap,
  Coffee,
  Music,
  Camera,
  Film,
  Gamepad2,
  Headphones,
  Laptop,
  Smartphone,
  Watch,
  Car,
  Home,
  Plane,
};

interface ProductSelectorProps {
  onProductSelect: (message: string) => void;
}

type Product = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category_id: string | null;
  custom_field_values: Record<string, any> | null;
};

type ProductCategory = {
  id: string;
  name: string;
  color: string;
};

type CustomField = {
  id: string;
  name: string;
  label: string;
  field_type: string;
};

export function ProductSelector({ onProductSelect }: ProductSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { currentCompany } = useCompany();
  const { settings: productSettings } = useProductSettings();

  // Get the dynamic icon component
  const EntityIcon = ICON_MAP[productSettings.entity_icon] || Package;

  useEffect(() => {
    if (open && currentCompany?.id) {
      loadData();
    }
  }, [open, currentCompany?.id]);

  const loadData = async () => {
    if (!currentCompany?.id) return;
    setIsLoading(true);

    try {
      // Load products
      const { data: productsData } = await supabase
        .from('products')
        .select('*')
        .eq('company_id', currentCompany.id)
        .eq('is_active', true)
        .order('name');

      setProducts(productsData || []);

      // Load categories
      const { data: categoriesData } = await supabase
        .from('product_categories')
        .select('*')
        .eq('company_id', currentCompany.id);

      setCategories(categoriesData || []);

      // Load custom fields
      const { data: fieldsData } = await supabase
        .from('product_custom_fields')
        .select('*')
        .eq('company_id', currentCompany.id)
        .eq('is_active', true)
        .order('sort_order');

      setCustomFields((fieldsData || []) as CustomField[]);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return null;
    const category = categories.find((c) => c.id === categoryId);
    return category?.name || null;
  };

  const getCategoryColor = (categoryId: string | null) => {
    if (!categoryId) return '#6366F1';
    const category = categories.find((c) => c.id === categoryId);
    return category?.color || '#6366F1';
  };

  const formatProductMessage = (product: Product): string => {
    const lines: string[] = [];

    // Header com nome do produto
    lines.push(`📦 *${product.name}*`);
    lines.push('');

    // Categoria
    const categoryName = getCategoryName(product.category_id);
    if (categoryName) {
      lines.push(`🏷️ Categoria: ${categoryName}`);
    }

    // Descrição (se existir como campo fixo ou customizado)
    if (product.description) {
      lines.push(`📝 ${product.description}`);
    }

    // Campos customizados
    if (product.custom_field_values && Object.keys(product.custom_field_values).length > 0) {
      lines.push('');

      Object.entries(product.custom_field_values).forEach(([fieldName, value]) => {
        if (value === null || value === undefined || value === '') return;

        // Encontrar o label do campo
        const field = customFields.find((f) => f.name === fieldName);
        const label = field?.label || fieldName;

        // Formatar valor baseado no tipo
        let formattedValue = value;
        if (field?.field_type === 'currency') {
          formattedValue = formatCurrency(parseFloat(value));
        } else if (field?.field_type === 'boolean') {
          formattedValue = value === true || value === 'true' ? 'Sim' : 'Não';
        }

        // Escolher emoji baseado no nome do campo
        let emoji = '•';
        const lowerName = fieldName.toLowerCase();
        if (
          lowerName.includes('preco') ||
          lowerName.includes('price') ||
          lowerName.includes('valor')
        ) {
          emoji = '💰';
        } else if (lowerName.includes('desc')) {
          emoji = '📝';
        } else if (lowerName.includes('sku') || lowerName.includes('codigo')) {
          emoji = '🔢';
        } else if (lowerName.includes('estoque') || lowerName.includes('quantidade')) {
          emoji = '📦';
        } else if (lowerName.includes('marca') || lowerName.includes('brand')) {
          emoji = '🏪';
        } else if (lowerName.includes('garantia') || lowerName.includes('warranty')) {
          emoji = '✅';
        }

        lines.push(`${emoji} ${label}: ${formattedValue}`);
      });
    }

    // Preço principal (campo legado)
    if (
      product.price > 0 &&
      !product.custom_field_values?.preco &&
      !product.custom_field_values?.price
    ) {
      lines.push('');
      lines.push(`💰 Preço: ${formatCurrency(product.price)}`);
    }

    return lines.join('\n');
  };

  const handleSelectProduct = (product: Product) => {
    const message = formatProductMessage(product);
    onProductSelect(message);
    setOpen(false);
    setSearchQuery('');
  };

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setOpen(true)}
              className="hover:bg-primary/10"
            >
              <EntityIcon className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Selecionar {productSettings.entity_name}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <EntityIcon className="h-5 w-5" />
              Selecionar {productSettings.entity_name}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={`Buscar ${productSettings.entity_name.toLowerCase()}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                  onClick={() => setSearchQuery('')}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            <ScrollArea className="h-[400px] pr-4">
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Carregando {productSettings.entity_name_plural.toLowerCase()}...
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <EntityIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhum {productSettings.entity_name.toLowerCase()} encontrado</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredProducts.map((product) => (
                    <button
                      key={product.id}
                      onClick={() => handleSelectProduct(product)}
                      className="w-full text-left p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium truncate">{product.name}</p>
                            {product.category_id && (
                              <Badge
                                variant="outline"
                                className="text-xs shrink-0"
                                style={{
                                  borderColor: getCategoryColor(product.category_id),
                                  color: getCategoryColor(product.category_id),
                                }}
                              >
                                {getCategoryName(product.category_id)}
                              </Badge>
                            )}
                          </div>
                          {/* Preview de campos customizados */}
                          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-xs text-muted-foreground">
                            {product.custom_field_values &&
                              Object.entries(product.custom_field_values)
                                .slice(0, 3)
                                .map(([fieldName, value]) => {
                                  if (!value) return null;
                                  const field = customFields.find((f) => f.name === fieldName);
                                  const label = field?.label || fieldName;
                                  let displayValue = value;
                                  if (field?.field_type === 'currency') {
                                    displayValue = formatCurrency(parseFloat(value));
                                  }
                                  return (
                                    <span key={fieldName}>
                                      {label}: {displayValue}
                                    </span>
                                  );
                                })}
                          </div>
                        </div>
                        {product.price > 0 && !product.custom_field_values?.preco && (
                          <span className="text-sm font-semibold text-green-600 shrink-0">
                            {formatCurrency(product.price)}
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
