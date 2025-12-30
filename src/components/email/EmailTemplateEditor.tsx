import React, { useState, useCallback, useRef } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import {
  ArrowLeft,
  Save,
  Eye,
  Undo2,
  Redo2,
  Smartphone,
  Monitor,
  Tablet,
  Type,
  Image,
  Square,
  Minus,
  MousePointer2,
  Layout,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Settings2,
  Trash2,
  Plus,
  Mail,
  Columns,
  List,
  Quote,
  Video,
  Calendar,
  Users,
  Building2,
  Heart,
  Zap,
  Upload,
  Loader2,
  X,
  Variable,
} from 'lucide-react';
import { VariablePicker } from '@/components/chat/VariablePicker';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { EmailBlock, EmailBlockType, EmailTemplate } from './types';
import { SortableBlock } from './SortableBlock';
import { BlockRenderer } from './BlockRenderer';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/contexts/CompanyContext';
import { useQuery } from '@tanstack/react-query';

interface SocialLinks {
  facebook?: string;
  instagram?: string;
  linkedin?: string;
  youtube?: string;
  twitter?: string;
  whatsapp?: string;
  tiktok?: string;
  website?: string;
}

// Tipos de blocos disponíveis
const BLOCK_TYPES: { type: EmailBlockType; label: string; icon: React.ElementType; category: string }[] = [
  { type: 'header', label: 'Cabeçalho', icon: Layout, category: 'layout' },
  { type: 'text', label: 'Texto', icon: Type, category: 'conteudo' },
  { type: 'image', label: 'Imagem', icon: Image, category: 'conteudo' },
  { type: 'button', label: 'Botão', icon: MousePointer2, category: 'conteudo' },
  { type: 'divider', label: 'Divisor', icon: Minus, category: 'layout' },
  { type: 'spacer', label: 'Espaçador', icon: Square, category: 'layout' },
  { type: 'columns', label: 'Colunas', icon: Columns, category: 'layout' },
  { type: 'list', label: 'Lista', icon: List, category: 'conteudo' },
  { type: 'quote', label: 'Citação', icon: Quote, category: 'conteudo' },
  { type: 'video', label: 'Vídeo', icon: Video, category: 'conteudo' },
  { type: 'social', label: 'Redes Sociais', icon: Users, category: 'conteudo' },
  { type: 'footer', label: 'Rodapé', icon: Building2, category: 'layout' },
];

// Templates pré-definidos
const PRESET_TEMPLATES = [
  { id: 'blank', name: 'Em Branco', icon: Plus },
  { id: 'welcome', name: 'Boas-vindas', icon: Heart },
  { id: 'newsletter', name: 'Newsletter', icon: Mail },
  { id: 'promotion', name: 'Promoção', icon: Zap },
  { id: 'event', name: 'Evento', icon: Calendar },
];

interface EmailTemplateEditorProps {
  template?: EmailTemplate;
  onSave: (template: EmailTemplate) => void;
  onClose: () => void;
}

export function EmailTemplateEditor({ template, onSave, onClose }: EmailTemplateEditorProps) {
  const { currentCompany } = useCompany();

  // Buscar dados da empresa (redes sociais, logo, etc)
  const { data: companyData } = useQuery({
    queryKey: ['company-data', currentCompany?.id],
    queryFn: async () => {
      if (!currentCompany?.id) return null;
      const { data, error } = await supabase
        .from('companies')
        .select('name, email, phone, address, city, state, logo_url, social_links')
        .eq('id', currentCompany.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!currentCompany?.id,
  });

  // Estados do editor
  const [templateName, setTemplateName] = useState(template?.name || 'Novo Template');
  const [subject, setSubject] = useState(template?.subject || '');
  const [blocks, setBlocks] = useState<EmailBlock[]>(template?.blocks || []);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [history, setHistory] = useState<EmailBlock[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [sidebarTab, setSidebarTab] = useState('blocos');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedColumnIndex, setSelectedColumnIndex] = useState<number | null>(null);

  // Ref para input de arquivo
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const videoThumbInputRef = useRef<HTMLInputElement>(null);

  // Estilos globais
  const [globalStyles, setGlobalStyles] = useState(template?.globalStyles || {
    backgroundColor: '#f4f4f5',
    contentBackgroundColor: '#ffffff',
    primaryColor: '#6366f1',
    textColor: '#1f2937',
    fontFamily: 'Inter, sans-serif',
    maxWidth: 600,
  });

  // Sensores para drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Salvar no histórico para undo/redo
  const saveToHistory = useCallback((newBlocks: EmailBlock[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(JSON.parse(JSON.stringify(newBlocks)));
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  // Undo
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setBlocks(JSON.parse(JSON.stringify(history[historyIndex - 1])));
    }
  }, [history, historyIndex]);

  // Redo
  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setBlocks(JSON.parse(JSON.stringify(history[historyIndex + 1])));
    }
  }, [history, historyIndex]);

  // Upload de imagem para Supabase Storage
  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      setIsUploading(true);

      const fileExt = file.name.split('.').pop();
      const fileName = `${uuidv4()}.${fileExt}`;
      const filePath = `email-templates/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('email-assets')
        .upload(filePath, file);

      if (uploadError) {
        // Se o bucket não existir, tentar criar
        if (uploadError.message.includes('not found')) {
          toast.error('Bucket de imagens não configurado. Contate o administrador.');
          return null;
        }
        throw uploadError;
      }

      const { data } = supabase.storage
        .from('email-assets')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error: any) {
      console.error('Erro ao fazer upload:', error);
      toast.error('Erro ao fazer upload da imagem');
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  // Handler para upload de imagem
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'logo' | 'video') => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione apenas arquivos de imagem');
      return;
    }

    // Validar tamanho (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 5MB');
      return;
    }

    const url = await uploadImage(file);
    if (url && selectedBlockId) {
      const block = blocks.find(b => b.id === selectedBlockId);
      if (block) {
        if (type === 'image') {
          updateBlock(selectedBlockId, {
            content: { ...block.content, src: url }
          });
        } else if (type === 'logo') {
          updateBlock(selectedBlockId, {
            content: { ...block.content, logoUrl: url }
          });
        } else if (type === 'video') {
          updateBlock(selectedBlockId, {
            content: { ...block.content, thumbnailUrl: url }
          });
        }
        toast.success('Imagem carregada com sucesso!');
      }
    }

    // Limpar input
    e.target.value = '';
  };

  // Criar bloco padrão
  const createDefaultBlock = (type: EmailBlockType): EmailBlock => {
    const baseBlock = {
      id: uuidv4(),
      type,
      styles: {
        padding: '20px',
        backgroundColor: 'transparent',
      },
    };

    switch (type) {
      case 'header':
        return {
          ...baseBlock,
          content: {
            logoUrl: companyData?.logo_url || '',
            logoAlt: companyData?.name || 'Logo',
            showLogo: true,
            backgroundColor: globalStyles.primaryColor,
            title: '',
            subtitle: '',
          },
          styles: {
            ...baseBlock.styles,
            padding: '30px 20px',
            backgroundColor: globalStyles.primaryColor,
            textAlign: 'center',
          },
        };
      case 'text':
        return {
          ...baseBlock,
          content: {
            text: '<p>Digite seu texto aqui...</p>',
            fontSize: '16px',
            lineHeight: '1.6',
          },
          styles: {
            ...baseBlock.styles,
            color: globalStyles.textColor,
          },
        };
      case 'image':
        return {
          ...baseBlock,
          content: {
            src: '',
            alt: 'Imagem',
            link: '',
            width: '100%',
          },
          styles: {
            ...baseBlock.styles,
            textAlign: 'center',
          },
        };
      case 'button':
        return {
          ...baseBlock,
          content: {
            text: 'Clique aqui',
            link: '#',
            backgroundColor: globalStyles.primaryColor,
            textColor: '#ffffff',
            borderRadius: '8px',
            size: 'medium',
          },
          styles: {
            ...baseBlock.styles,
            textAlign: 'center',
          },
        };
      case 'divider':
        return {
          ...baseBlock,
          content: {
            color: '#e5e7eb',
            thickness: '1px',
            style: 'solid',
            width: '100%',
          },
          styles: {
            ...baseBlock.styles,
            padding: '10px 20px',
          },
        };
      case 'spacer':
        return {
          ...baseBlock,
          content: {
            height: '40px',
          },
          styles: {
            ...baseBlock.styles,
            padding: '0',
          },
        };
      case 'columns':
        return {
          ...baseBlock,
          content: {
            columns: 2,
            gap: '20px',
            children: [[], []],
          },
        };
      case 'list':
        return {
          ...baseBlock,
          content: {
            items: ['Item 1', 'Item 2', 'Item 3'],
            listStyle: 'disc',
            iconColor: globalStyles.primaryColor,
          },
        };
      case 'quote':
        return {
          ...baseBlock,
          content: {
            text: 'Uma citação inspiradora...',
            author: 'Autor',
            borderColor: globalStyles.primaryColor,
          },
          styles: {
            ...baseBlock.styles,
            borderLeft: `4px solid ${globalStyles.primaryColor}`,
            paddingLeft: '20px',
            fontStyle: 'italic',
          },
        };
      case 'video':
        return {
          ...baseBlock,
          content: {
            thumbnailUrl: '',
            videoUrl: '',
            playButtonColor: globalStyles.primaryColor,
          },
          styles: {
            ...baseBlock.styles,
            textAlign: 'center',
          },
        };
      case 'social':
        // Puxar redes sociais cadastradas da empresa automaticamente
        const socialLinks = companyData?.social_links as SocialLinks || {};
        const networks: { type: string; url: string }[] = [];

        // Adicionar apenas as redes sociais que foram preenchidas
        if (socialLinks.facebook) networks.push({ type: 'facebook', url: socialLinks.facebook });
        if (socialLinks.instagram) networks.push({ type: 'instagram', url: socialLinks.instagram });
        if (socialLinks.linkedin) networks.push({ type: 'linkedin', url: socialLinks.linkedin });
        if (socialLinks.youtube) networks.push({ type: 'youtube', url: socialLinks.youtube });
        if (socialLinks.twitter) networks.push({ type: 'twitter', url: socialLinks.twitter });
        if (socialLinks.whatsapp) networks.push({ type: 'whatsapp', url: `https://wa.me/${socialLinks.whatsapp}` });
        if (socialLinks.tiktok) networks.push({ type: 'tiktok', url: socialLinks.tiktok });

        // Se não tiver nenhuma rede cadastrada, mostrar placeholder
        if (networks.length === 0) {
          networks.push(
            { type: 'facebook', url: '#' },
            { type: 'instagram', url: '#' },
            { type: 'linkedin', url: '#' }
          );
        }

        return {
          ...baseBlock,
          content: {
            networks,
            iconSize: '32px',
            iconStyle: 'colored',
          },
          styles: {
            ...baseBlock.styles,
            textAlign: 'center',
          },
        };
      case 'footer':
        // Puxar dados da empresa para o footer
        const companyName = companyData?.name || '{{empresa_nome}}';
        const companyAddress = companyData?.address
          ? `${companyData.address}${companyData.city ? `, ${companyData.city}` : ''}${companyData.state ? ` - ${companyData.state}` : ''}`
          : 'Endereço da empresa';
        const companyPhone = companyData?.phone || 'Telefone';
        const companyEmail = companyData?.email || '{{empresa_email}}';

        return {
          ...baseBlock,
          content: {
            companyName,
            address: companyAddress,
            phone: companyPhone,
            email: companyEmail,
            unsubscribeText: 'Cancelar inscrição',
            unsubscribeLink: '#',
          },
          styles: {
            ...baseBlock.styles,
            padding: '30px 20px',
            backgroundColor: '#f9fafb',
            textAlign: 'center',
            fontSize: '12px',
            color: '#6b7280',
          },
        };
      default:
        return baseBlock as EmailBlock;
    }
  };

  // Adicionar bloco
  const addBlock = (type: EmailBlockType) => {
    const newBlock = createDefaultBlock(type);
    const newBlocks = [...blocks, newBlock];
    setBlocks(newBlocks);
    saveToHistory(newBlocks);
    setSelectedBlockId(newBlock.id);
    setSelectedColumnIndex(null);
  };

  // Adicionar bloco dentro de coluna
  const addBlockToColumn = (type: EmailBlockType, parentBlockId: string, columnIndex: number) => {
    const newBlock = createDefaultBlock(type);
    const newBlocks = blocks.map(block => {
      if (block.id === parentBlockId && block.type === 'columns') {
        const children = [...(block.content.children || [[], []])];
        children[columnIndex] = [...(children[columnIndex] || []), newBlock];
        return {
          ...block,
          content: { ...block.content, children }
        };
      }
      return block;
    });
    setBlocks(newBlocks);
    saveToHistory(newBlocks);
  };

  // Duplicar bloco
  const duplicateBlock = (blockId: string) => {
    const blockIndex = blocks.findIndex(b => b.id === blockId);
    if (blockIndex !== -1) {
      const block = blocks[blockIndex];
      const newBlock = JSON.parse(JSON.stringify(block));
      newBlock.id = uuidv4();
      const newBlocks = [
        ...blocks.slice(0, blockIndex + 1),
        newBlock,
        ...blocks.slice(blockIndex + 1),
      ];
      setBlocks(newBlocks);
      saveToHistory(newBlocks);
      setSelectedBlockId(newBlock.id);
    }
  };

  // Remover bloco
  const removeBlock = (blockId: string) => {
    const newBlocks = blocks.filter(b => b.id !== blockId);
    setBlocks(newBlocks);
    saveToHistory(newBlocks);
    if (selectedBlockId === blockId) {
      setSelectedBlockId(null);
    }
  };

  // Remover bloco de dentro da coluna
  const removeBlockFromColumn = (parentBlockId: string, columnIndex: number, childBlockId: string) => {
    const newBlocks = blocks.map(block => {
      if (block.id === parentBlockId && block.type === 'columns') {
        const children = [...(block.content.children || [[], []])];
        children[columnIndex] = (children[columnIndex] || []).filter((b: EmailBlock) => b.id !== childBlockId);
        return {
          ...block,
          content: { ...block.content, children }
        };
      }
      return block;
    });
    setBlocks(newBlocks);
    saveToHistory(newBlocks);
  };

  // Atualizar bloco
  const updateBlock = (blockId: string, updates: Partial<EmailBlock>) => {
    const newBlocks = blocks.map(block =>
      block.id === blockId ? { ...block, ...updates } : block
    );
    setBlocks(newBlocks);
    saveToHistory(newBlocks);
  };

  // Atualizar bloco dentro da coluna
  const updateBlockInColumn = (parentBlockId: string, columnIndex: number, childBlockId: string, updates: Partial<EmailBlock>) => {
    const newBlocks = blocks.map(block => {
      if (block.id === parentBlockId && block.type === 'columns') {
        const children = [...(block.content.children || [[], []])];
        children[columnIndex] = (children[columnIndex] || []).map((b: EmailBlock) =>
          b.id === childBlockId ? { ...b, ...updates } : b
        );
        return {
          ...block,
          content: { ...block.content, children }
        };
      }
      return block;
    });
    setBlocks(newBlocks);
    saveToHistory(newBlocks);
  };

  // Handlers de drag and drop
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setBlocks((items) => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over.id);
        const newBlocks = arrayMove(items, oldIndex, newIndex);
        saveToHistory(newBlocks);
        return newBlocks;
      });
    }

    setActiveId(null);
  };

  // Bloco selecionado
  const selectedBlock = blocks.find(b => b.id === selectedBlockId);

  // Gerar HTML do email
  const generateEmailHTML = () => {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: ${globalStyles.backgroundColor}; font-family: ${globalStyles.fontFamily};">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="${globalStyles.maxWidth}" cellspacing="0" cellpadding="0" style="background-color: ${globalStyles.contentBackgroundColor}; border-radius: 8px; overflow: hidden;">
          ${blocks.map(block => renderBlockToHTML(block)).join('')}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;
  };

  const renderBlockToHTML = (block: EmailBlock): string => {
    switch (block.type) {
      case 'header':
        return `
          <tr>
            <td style="background-color: ${block.content.backgroundColor}; padding: ${block.styles?.padding}; text-align: center;">
              ${block.content.showLogo && block.content.logoUrl ? `<img src="${block.content.logoUrl}" alt="${block.content.logoAlt}" style="max-height: 60px;">` : ''}
              ${block.content.title ? `<h1 style="color: #fff; font-size: 28px; margin: 10px 0 0; font-weight: 700;">${block.content.title}</h1>` : ''}
              ${block.content.subtitle ? `<p style="color: rgba(255,255,255,0.9); font-size: 16px; margin: 5px 0 0;">${block.content.subtitle}</p>` : ''}
            </td>
          </tr>
        `;
      case 'text':
        return `
          <tr>
            <td style="padding: ${block.styles?.padding}; color: ${block.styles?.color}; font-size: ${block.content.fontSize}; line-height: ${block.content.lineHeight}; text-align: ${block.styles?.textAlign || 'left'};">
              ${block.content.text}
            </td>
          </tr>
        `;
      case 'image':
        return `
          <tr>
            <td style="padding: ${block.styles?.padding}; text-align: ${block.styles?.textAlign};">
              ${block.content.link ? `<a href="${block.content.link}">` : ''}
              ${block.content.src ? `<img src="${block.content.src}" alt="${block.content.alt}" style="max-width: ${block.content.width}; height: auto; border-radius: 8px;">` : ''}
              ${block.content.link ? `</a>` : ''}
            </td>
          </tr>
        `;
      case 'button':
        const buttonPadding = block.content.size === 'small' ? '10px 20px' : block.content.size === 'large' ? '18px 36px' : '14px 28px';
        return `
          <tr>
            <td style="padding: ${block.styles?.padding}; text-align: ${block.styles?.textAlign};">
              <a href="${block.content.link}" style="display: inline-block; background-color: ${block.content.backgroundColor}; color: ${block.content.textColor}; padding: ${buttonPadding}; border-radius: ${block.content.borderRadius}; text-decoration: none; font-weight: 600;">
                ${block.content.text}
              </a>
            </td>
          </tr>
        `;
      case 'divider':
        return `
          <tr>
            <td style="padding: ${block.styles?.padding};">
              <hr style="border: none; border-top: ${block.content.thickness} ${block.content.style} ${block.content.color}; width: ${block.content.width}; margin: 0 auto;">
            </td>
          </tr>
        `;
      case 'spacer':
        return `
          <tr>
            <td style="height: ${block.content.height};"></td>
          </tr>
        `;
      case 'columns':
        const colWidth = Math.floor(100 / (block.content.columns || 2));
        return `
          <tr>
            <td style="padding: ${block.styles?.padding};">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  ${(block.content.children || [[], []]).map((colBlocks: EmailBlock[], idx: number) => `
                    <td style="width: ${colWidth}%; vertical-align: top; ${idx > 0 ? `padding-left: ${block.content.gap || '20px'};` : ''}">
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                        ${colBlocks.map((childBlock: EmailBlock) => renderBlockToHTML(childBlock)).join('')}
                      </table>
                    </td>
                  `).join('')}
                </tr>
              </table>
            </td>
          </tr>
        `;
      case 'list':
        return `
          <tr>
            <td style="padding: ${block.styles?.padding};">
              <ul style="list-style: ${block.content.listStyle}; padding-left: 20px; margin: 0; color: ${globalStyles.textColor};">
                ${(block.content.items || []).map((item: string) => `<li style="margin-bottom: 8px;">${item}</li>`).join('')}
              </ul>
            </td>
          </tr>
        `;
      case 'quote':
        return `
          <tr>
            <td style="padding: ${block.styles?.padding}; padding-left: 24px; border-left: 4px solid ${block.content.borderColor}; font-style: italic; color: ${globalStyles.textColor};">
              <p style="margin: 0 0 8px; font-size: 18px; line-height: 1.6;">"${block.content.text}"</p>
              ${block.content.author ? `<p style="margin: 0; font-size: 14px; color: #6b7280;">— ${block.content.author}</p>` : ''}
            </td>
          </tr>
        `;
      case 'footer':
        return `
          <tr>
            <td style="background-color: ${block.styles?.backgroundColor}; padding: ${block.styles?.padding}; text-align: center; font-size: ${block.styles?.fontSize}; color: ${block.styles?.color};">
              <p style="margin: 0 0 10px; font-weight: 600;">${block.content.companyName}</p>
              <p style="margin: 0 0 5px;">${block.content.address}</p>
              <p style="margin: 0 0 5px;">${block.content.phone} | ${block.content.email}</p>
              <p style="margin: 20px 0 0;"><a href="${block.content.unsubscribeLink}" style="color: ${block.styles?.color}; text-decoration: underline;">${block.content.unsubscribeText}</a></p>
            </td>
          </tr>
        `;
      default:
        return '';
    }
  };

  // Salvar template
  const handleSave = async () => {
    if (!templateName.trim()) {
      toast.error('Digite um nome para o template');
      return;
    }

    setIsSaving(true);

    try {
      const emailTemplate: EmailTemplate = {
        id: template?.id || uuidv4(),
        name: templateName,
        subject,
        blocks,
        globalStyles,
        html: generateEmailHTML(),
        createdAt: template?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await onSave(emailTemplate);
    } catch (error) {
      console.error('Erro ao salvar:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Preview width based on mode
  const previewWidth = previewMode === 'mobile' ? 375 : previewMode === 'tablet' ? 768 : globalStyles.maxWidth;

  // Renderizar configurações do bloco
  const renderBlockSettings = () => {
    if (!selectedBlock) return null;

    return (
      <div className="p-4 space-y-6">
        {/* Configurações de Texto */}
        {selectedBlock.type === 'text' && (
          <>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Conteúdo</Label>
                <VariablePicker
                  onSelect={(v) => {
                    const currentText = selectedBlock.content.text?.replace(/<[^>]*>/g, '') || '';
                    updateBlock(selectedBlock.id, {
                      content: { ...selectedBlock.content, text: `<p>${currentText}${v}</p>` }
                    });
                  }}
                  trigger={
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs gap-1 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                    >
                      <Variable className="h-3 w-3" />
                      Variáveis
                    </Button>
                  }
                />
              </div>
              <Textarea
                value={selectedBlock.content.text?.replace(/<[^>]*>/g, '') || ''}
                onChange={(e) => updateBlock(selectedBlock.id, {
                  content: { ...selectedBlock.content, text: `<p>${e.target.value}</p>` }
                })}
                rows={4}
                placeholder="Digite o texto... Use {{variavel}} para personalizar"
              />
            </div>
            <div className="space-y-2">
              <Label>Tamanho da Fonte</Label>
              <Select
                value={selectedBlock.content.fontSize || '16px'}
                onValueChange={(value) => updateBlock(selectedBlock.id, {
                  content: { ...selectedBlock.content, fontSize: value }
                })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="12px">Pequeno (12px)</SelectItem>
                  <SelectItem value="14px">Normal (14px)</SelectItem>
                  <SelectItem value="16px">Médio (16px)</SelectItem>
                  <SelectItem value="18px">Grande (18px)</SelectItem>
                  <SelectItem value="24px">Título (24px)</SelectItem>
                  <SelectItem value="32px">Display (32px)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        {/* Configurações de Botão */}
        {selectedBlock.type === 'button' && (
          <>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Texto do Botão</Label>
                <VariablePicker
                  onSelect={(v) => {
                    const currentText = selectedBlock.content.text || '';
                    updateBlock(selectedBlock.id, {
                      content: { ...selectedBlock.content, text: currentText + v }
                    });
                  }}
                  trigger={
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs gap-1 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                    >
                      <Variable className="h-3 w-3" />
                      Variáveis
                    </Button>
                  }
                />
              </div>
              <Input
                value={selectedBlock.content.text || ''}
                onChange={(e) => updateBlock(selectedBlock.id, {
                  content: { ...selectedBlock.content, text: e.target.value }
                })}
                placeholder="Texto do botão..."
              />
            </div>
            <div className="space-y-2">
              <Label>Link</Label>
              <Input
                value={selectedBlock.content.link || ''}
                onChange={(e) => updateBlock(selectedBlock.id, {
                  content: { ...selectedBlock.content, link: e.target.value }
                })}
                placeholder="https://..."
              />
            </div>
            <div className="space-y-2">
              <Label>Cor do Botão</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={selectedBlock.content.backgroundColor || globalStyles.primaryColor}
                  onChange={(e) => updateBlock(selectedBlock.id, {
                    content: { ...selectedBlock.content, backgroundColor: e.target.value }
                  })}
                  className="w-10 h-10 rounded-lg border cursor-pointer"
                />
                <Input
                  value={selectedBlock.content.backgroundColor || ''}
                  onChange={(e) => updateBlock(selectedBlock.id, {
                    content: { ...selectedBlock.content, backgroundColor: e.target.value }
                  })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Tamanho</Label>
              <Select
                value={selectedBlock.content.size || 'medium'}
                onValueChange={(value) => updateBlock(selectedBlock.id, {
                  content: { ...selectedBlock.content, size: value }
                })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Pequeno</SelectItem>
                  <SelectItem value="medium">Médio</SelectItem>
                  <SelectItem value="large">Grande</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        {/* Configurações de Imagem */}
        {selectedBlock.type === 'image' && (
          <>
            <div className="space-y-2">
              <Label>Imagem</Label>
              {selectedBlock.content.src ? (
                <div className="relative">
                  <img
                    src={selectedBlock.content.src}
                    alt="Preview"
                    className="w-full h-32 object-cover rounded-lg border"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-6 w-6"
                    onClick={() => updateBlock(selectedBlock.id, {
                      content: { ...selectedBlock.content, src: '' }
                    })}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div
                  className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-indigo-400 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {isUploading ? (
                    <Loader2 className="h-8 w-8 mx-auto animate-spin text-indigo-500" />
                  ) : (
                    <>
                      <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-500">Clique para fazer upload</p>
                      <p className="text-xs text-gray-400 mt-1">PNG, JPG até 5MB</p>
                    </>
                  )}
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleImageUpload(e, 'image')}
              />
            </div>
            <div className="space-y-2">
              <Label>Ou cole a URL da imagem</Label>
              <Input
                value={selectedBlock.content.src || ''}
                onChange={(e) => updateBlock(selectedBlock.id, {
                  content: { ...selectedBlock.content, src: e.target.value }
                })}
                placeholder="https://..."
              />
            </div>
            <div className="space-y-2">
              <Label>Texto Alternativo</Label>
              <Input
                value={selectedBlock.content.alt || ''}
                onChange={(e) => updateBlock(selectedBlock.id, {
                  content: { ...selectedBlock.content, alt: e.target.value }
                })}
              />
            </div>
            <div className="space-y-2">
              <Label>Link (opcional)</Label>
              <Input
                value={selectedBlock.content.link || ''}
                onChange={(e) => updateBlock(selectedBlock.id, {
                  content: { ...selectedBlock.content, link: e.target.value }
                })}
                placeholder="https://..."
              />
            </div>
          </>
        )}

        {/* Configurações de Header */}
        {selectedBlock.type === 'header' && (
          <>
            <div className="space-y-2">
              <Label>Logo</Label>
              {selectedBlock.content.logoUrl ? (
                <div className="relative">
                  <img
                    src={selectedBlock.content.logoUrl}
                    alt="Logo Preview"
                    className="w-full h-20 object-contain rounded-lg border bg-gray-50"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-6 w-6"
                    onClick={() => updateBlock(selectedBlock.id, {
                      content: { ...selectedBlock.content, logoUrl: '' }
                    })}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div
                  className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-indigo-400 transition-colors"
                  onClick={() => logoInputRef.current?.click()}
                >
                  {isUploading ? (
                    <Loader2 className="h-6 w-6 mx-auto animate-spin text-indigo-500" />
                  ) : (
                    <>
                      <Upload className="h-6 w-6 mx-auto text-gray-400 mb-1" />
                      <p className="text-xs text-gray-500">Upload do logo</p>
                    </>
                  )}
                </div>
              )}
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleImageUpload(e, 'logo')}
              />
            </div>
            <div className="space-y-2">
              <Label>Ou cole a URL do logo</Label>
              <Input
                value={selectedBlock.content.logoUrl || ''}
                onChange={(e) => updateBlock(selectedBlock.id, {
                  content: { ...selectedBlock.content, logoUrl: e.target.value }
                })}
                placeholder="https://..."
              />
            </div>
            <div className="space-y-2">
              <Label>Título (opcional)</Label>
              <Input
                value={selectedBlock.content.title || ''}
                onChange={(e) => updateBlock(selectedBlock.id, {
                  content: { ...selectedBlock.content, title: e.target.value }
                })}
              />
            </div>
            <div className="space-y-2">
              <Label>Subtítulo (opcional)</Label>
              <Input
                value={selectedBlock.content.subtitle || ''}
                onChange={(e) => updateBlock(selectedBlock.id, {
                  content: { ...selectedBlock.content, subtitle: e.target.value }
                })}
              />
            </div>
            <div className="space-y-2">
              <Label>Cor de Fundo</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={selectedBlock.content.backgroundColor || globalStyles.primaryColor}
                  onChange={(e) => updateBlock(selectedBlock.id, {
                    content: { ...selectedBlock.content, backgroundColor: e.target.value },
                    styles: { ...selectedBlock.styles, backgroundColor: e.target.value }
                  })}
                  className="w-10 h-10 rounded-lg border cursor-pointer"
                />
                <Input
                  value={selectedBlock.content.backgroundColor || ''}
                  onChange={(e) => updateBlock(selectedBlock.id, {
                    content: { ...selectedBlock.content, backgroundColor: e.target.value },
                    styles: { ...selectedBlock.styles, backgroundColor: e.target.value }
                  })}
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label>Mostrar Logo</Label>
              <Switch
                checked={selectedBlock.content.showLogo !== false}
                onCheckedChange={(checked) => updateBlock(selectedBlock.id, {
                  content: { ...selectedBlock.content, showLogo: checked }
                })}
              />
            </div>
          </>
        )}

        {/* Configurações de Colunas */}
        {selectedBlock.type === 'columns' && (
          <>
            <div className="space-y-2">
              <Label>Número de Colunas</Label>
              <Select
                value={String(selectedBlock.content.columns || 2)}
                onValueChange={(value) => {
                  const numCols = parseInt(value);
                  const currentChildren = selectedBlock.content.children || [];
                  const newChildren = Array.from({ length: numCols }, (_, i) => currentChildren[i] || []);
                  updateBlock(selectedBlock.id, {
                    content: { ...selectedBlock.content, columns: numCols, children: newChildren }
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">2 Colunas</SelectItem>
                  <SelectItem value="3">3 Colunas</SelectItem>
                  <SelectItem value="4">4 Colunas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Espaçamento entre colunas</Label>
              <Select
                value={selectedBlock.content.gap || '20px'}
                onValueChange={(value) => updateBlock(selectedBlock.id, {
                  content: { ...selectedBlock.content, gap: value }
                })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10px">Pequeno (10px)</SelectItem>
                  <SelectItem value="20px">Médio (20px)</SelectItem>
                  <SelectItem value="30px">Grande (30px)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-3 pt-4 border-t">
              <Label className="text-xs font-semibold text-gray-500 uppercase">Adicionar Elementos às Colunas</Label>
              <div className="grid grid-cols-2 gap-2">
                {Array.from({ length: selectedBlock.content.columns || 2 }).map((_, colIdx) => (
                  <div key={colIdx} className="space-y-2">
                    <p className="text-xs font-medium text-center text-gray-600">Coluna {colIdx + 1}</p>
                    <div className="flex flex-wrap gap-1 justify-center">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={() => addBlockToColumn('text', selectedBlock.id, colIdx)}
                      >
                        <Type className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={() => addBlockToColumn('image', selectedBlock.id, colIdx)}
                      >
                        <Image className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={() => addBlockToColumn('button', selectedBlock.id, colIdx)}
                      >
                        <MousePointer2 className="h-3 w-3" />
                      </Button>
                    </div>
                    {/* Mostrar blocos na coluna */}
                    {(selectedBlock.content.children?.[colIdx] || []).length > 0 && (
                      <div className="space-y-1 mt-2">
                        {(selectedBlock.content.children[colIdx] as EmailBlock[]).map((child: EmailBlock) => (
                          <div key={child.id} className="flex items-center justify-between bg-gray-50 rounded px-2 py-1">
                            <span className="text-xs text-gray-600 capitalize">{child.type}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5 text-red-500 hover:text-red-700"
                              onClick={() => removeBlockFromColumn(selectedBlock.id, colIdx, child.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Configurações de Footer */}
        {selectedBlock.type === 'footer' && (
          <>
            <div className="space-y-2">
              <Label>Nome da Empresa</Label>
              <Input
                value={selectedBlock.content.companyName || ''}
                onChange={(e) => updateBlock(selectedBlock.id, {
                  content: { ...selectedBlock.content, companyName: e.target.value }
                })}
              />
            </div>
            <div className="space-y-2">
              <Label>Endereço</Label>
              <Input
                value={selectedBlock.content.address || ''}
                onChange={(e) => updateBlock(selectedBlock.id, {
                  content: { ...selectedBlock.content, address: e.target.value }
                })}
              />
            </div>
            <div className="space-y-2">
              <Label>Telefone</Label>
              <Input
                value={selectedBlock.content.phone || ''}
                onChange={(e) => updateBlock(selectedBlock.id, {
                  content: { ...selectedBlock.content, phone: e.target.value }
                })}
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                value={selectedBlock.content.email || ''}
                onChange={(e) => updateBlock(selectedBlock.id, {
                  content: { ...selectedBlock.content, email: e.target.value }
                })}
              />
            </div>
          </>
        )}

        {/* Configurações de Divisor */}
        {selectedBlock.type === 'divider' && (
          <>
            <div className="space-y-2">
              <Label>Cor</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={selectedBlock.content.color || '#e5e7eb'}
                  onChange={(e) => updateBlock(selectedBlock.id, {
                    content: { ...selectedBlock.content, color: e.target.value }
                  })}
                  className="w-10 h-10 rounded-lg border cursor-pointer"
                />
                <Input
                  value={selectedBlock.content.color || ''}
                  onChange={(e) => updateBlock(selectedBlock.id, {
                    content: { ...selectedBlock.content, color: e.target.value }
                  })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Espessura</Label>
              <Select
                value={selectedBlock.content.thickness || '1px'}
                onValueChange={(value) => updateBlock(selectedBlock.id, {
                  content: { ...selectedBlock.content, thickness: value }
                })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1px">Fina (1px)</SelectItem>
                  <SelectItem value="2px">Média (2px)</SelectItem>
                  <SelectItem value="3px">Grossa (3px)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        {/* Configurações de Espaçador */}
        {selectedBlock.type === 'spacer' && (
          <div className="space-y-2">
            <Label>Altura: {selectedBlock.content.height}</Label>
            <Slider
              value={[parseInt(selectedBlock.content.height) || 40]}
              onValueChange={([value]) => updateBlock(selectedBlock.id, {
                content: { ...selectedBlock.content, height: `${value}px` }
              })}
              min={10}
              max={100}
              step={5}
            />
          </div>
        )}

        {/* Configurações de Lista */}
        {selectedBlock.type === 'list' && (
          <>
            <div className="space-y-2">
              <Label>Itens (um por linha)</Label>
              <Textarea
                value={(selectedBlock.content.items || []).join('\n')}
                onChange={(e) => updateBlock(selectedBlock.id, {
                  content: { ...selectedBlock.content, items: e.target.value.split('\n').filter(Boolean) }
                })}
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label>Estilo da Lista</Label>
              <Select
                value={selectedBlock.content.listStyle || 'disc'}
                onValueChange={(value) => updateBlock(selectedBlock.id, {
                  content: { ...selectedBlock.content, listStyle: value }
                })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="disc">Círculos</SelectItem>
                  <SelectItem value="circle">Círculos vazios</SelectItem>
                  <SelectItem value="square">Quadrados</SelectItem>
                  <SelectItem value="decimal">Números</SelectItem>
                  <SelectItem value="check">Checks ✓</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        {/* Configurações de Citação */}
        {selectedBlock.type === 'quote' && (
          <>
            <div className="space-y-2">
              <Label>Texto da Citação</Label>
              <Textarea
                value={selectedBlock.content.text || ''}
                onChange={(e) => updateBlock(selectedBlock.id, {
                  content: { ...selectedBlock.content, text: e.target.value }
                })}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Autor</Label>
              <Input
                value={selectedBlock.content.author || ''}
                onChange={(e) => updateBlock(selectedBlock.id, {
                  content: { ...selectedBlock.content, author: e.target.value }
                })}
              />
            </div>
            <div className="space-y-2">
              <Label>Cor da Borda</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={selectedBlock.content.borderColor || globalStyles.primaryColor}
                  onChange={(e) => updateBlock(selectedBlock.id, {
                    content: { ...selectedBlock.content, borderColor: e.target.value }
                  })}
                  className="w-10 h-10 rounded-lg border cursor-pointer"
                />
              </div>
            </div>
          </>
        )}

        {/* Configurações de Vídeo */}
        {selectedBlock.type === 'video' && (
          <>
            <div className="space-y-2">
              <Label>Thumbnail do Vídeo</Label>
              {selectedBlock.content.thumbnailUrl ? (
                <div className="relative">
                  <img
                    src={selectedBlock.content.thumbnailUrl}
                    alt="Video Preview"
                    className="w-full h-32 object-cover rounded-lg border"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-6 w-6"
                    onClick={() => updateBlock(selectedBlock.id, {
                      content: { ...selectedBlock.content, thumbnailUrl: '' }
                    })}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div
                  className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-indigo-400 transition-colors"
                  onClick={() => videoThumbInputRef.current?.click()}
                >
                  {isUploading ? (
                    <Loader2 className="h-8 w-8 mx-auto animate-spin text-indigo-500" />
                  ) : (
                    <>
                      <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-500">Upload thumbnail</p>
                    </>
                  )}
                </div>
              )}
              <input
                ref={videoThumbInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleImageUpload(e, 'video')}
              />
            </div>
            <div className="space-y-2">
              <Label>URL do Vídeo (YouTube/Vimeo)</Label>
              <Input
                value={selectedBlock.content.videoUrl || ''}
                onChange={(e) => updateBlock(selectedBlock.id, {
                  content: { ...selectedBlock.content, videoUrl: e.target.value }
                })}
                placeholder="https://youtube.com/watch?v=..."
              />
            </div>
          </>
        )}

        {/* Espaçamento interno comum */}
        <div className="space-y-2 pt-4 border-t">
          <Label className="text-xs font-semibold text-gray-500 uppercase">Espaçamento Interno</Label>
          <Select
            value={selectedBlock.styles?.padding || '20px'}
            onValueChange={(value) => updateBlock(selectedBlock.id, {
              styles: { ...selectedBlock.styles, padding: value }
            })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Nenhum</SelectItem>
              <SelectItem value="10px">Pequeno</SelectItem>
              <SelectItem value="20px">Médio</SelectItem>
              <SelectItem value="30px">Grande</SelectItem>
              <SelectItem value="40px">Extra Grande</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Alinhamento */}
        {['text', 'image', 'button'].includes(selectedBlock.type) && (
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-gray-500 uppercase">Alinhamento</Label>
            <div className="flex gap-1">
              <Button
                variant={selectedBlock.styles?.textAlign === 'left' ? 'secondary' : 'ghost'}
                size="icon"
                onClick={() => updateBlock(selectedBlock.id, {
                  styles: { ...selectedBlock.styles, textAlign: 'left' }
                })}
              >
                <AlignLeft className="h-4 w-4" />
              </Button>
              <Button
                variant={selectedBlock.styles?.textAlign === 'center' ? 'secondary' : 'ghost'}
                size="icon"
                onClick={() => updateBlock(selectedBlock.id, {
                  styles: { ...selectedBlock.styles, textAlign: 'center' }
                })}
              >
                <AlignCenter className="h-4 w-4" />
              </Button>
              <Button
                variant={selectedBlock.styles?.textAlign === 'right' ? 'secondary' : 'ghost'}
                size="icon"
                onClick={() => updateBlock(selectedBlock.id, {
                  styles: { ...selectedBlock.styles, textAlign: 'right' }
                })}
              >
                <AlignRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-gray-100 flex flex-col">
      {/* Header */}
      <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 flex-shrink-0">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onClose}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-indigo-600" />
            <Input
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              className="text-lg font-semibold border-none bg-transparent focus-visible:ring-0 w-64"
              placeholder="Nome do template"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Undo/Redo */}
          <div className="flex items-center border-r border-gray-200 pr-2 mr-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={undo}
              disabled={historyIndex <= 0}
            >
              <Undo2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={redo}
              disabled={historyIndex >= history.length - 1}
            >
              <Redo2 className="h-4 w-4" />
            </Button>
          </div>

          {/* Preview Modes */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <Button
              variant={previewMode === 'desktop' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-8 w-8"
              onClick={() => setPreviewMode('desktop')}
            >
              <Monitor className="h-4 w-4" />
            </Button>
            <Button
              variant={previewMode === 'tablet' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-8 w-8"
              onClick={() => setPreviewMode('tablet')}
            >
              <Tablet className="h-4 w-4" />
            </Button>
            <Button
              variant={previewMode === 'mobile' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-8 w-8"
              onClick={() => setPreviewMode('mobile')}
            >
              <Smartphone className="h-4 w-4" />
            </Button>
          </div>

          {/* Save Button - GRANDE E VISÍVEL */}
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 px-6"
            size="lg"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Salvar Template
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Blocks */}
        <aside className="w-72 bg-white border-r border-gray-200 flex flex-col">
          <Tabs value={sidebarTab} onValueChange={setSidebarTab} className="flex-1 flex flex-col">
            <TabsList className="grid grid-cols-2 m-3">
              <TabsTrigger value="blocos">Blocos</TabsTrigger>
              <TabsTrigger value="estilos">Estilos</TabsTrigger>
            </TabsList>

            <TabsContent value="blocos" className="flex-1 m-0 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="p-3 space-y-4">
                  {/* Layout Blocks */}
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-2 px-1">Layout</p>
                    <div className="grid grid-cols-2 gap-2">
                      {BLOCK_TYPES.filter(b => b.category === 'layout').map((block) => (
                        <button
                          key={block.type}
                          onClick={() => addBlock(block.type)}
                          className="flex flex-col items-center gap-2 p-3 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
                        >
                          <block.icon className="h-5 w-5 text-gray-600" />
                          <span className="text-xs font-medium text-gray-700">{block.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Content Blocks */}
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-2 px-1">Conteúdo</p>
                    <div className="grid grid-cols-2 gap-2">
                      {BLOCK_TYPES.filter(b => b.category === 'conteudo').map((block) => (
                        <button
                          key={block.type}
                          onClick={() => addBlock(block.type)}
                          className="flex flex-col items-center gap-2 p-3 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
                        >
                          <block.icon className="h-5 w-5 text-gray-600" />
                          <span className="text-xs font-medium text-gray-700">{block.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Templates Preset */}
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-2 px-1">Templates Prontos</p>
                    <div className="space-y-2">
                      {PRESET_TEMPLATES.map((preset) => (
                        <button
                          key={preset.id}
                          className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-colors text-left"
                        >
                          <preset.icon className="h-5 w-5 text-indigo-600" />
                          <span className="text-sm font-medium text-gray-700">{preset.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="estilos" className="flex-1 m-0 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="p-4 space-y-6">
                  {/* Background Color */}
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-gray-500 uppercase">Cor de Fundo</Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={globalStyles.backgroundColor}
                        onChange={(e) => setGlobalStyles({ ...globalStyles, backgroundColor: e.target.value })}
                        className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer"
                      />
                      <Input
                        value={globalStyles.backgroundColor}
                        onChange={(e) => setGlobalStyles({ ...globalStyles, backgroundColor: e.target.value })}
                        className="flex-1"
                      />
                    </div>
                  </div>

                  {/* Content Background Color */}
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-gray-500 uppercase">Cor do Conteúdo</Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={globalStyles.contentBackgroundColor}
                        onChange={(e) => setGlobalStyles({ ...globalStyles, contentBackgroundColor: e.target.value })}
                        className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer"
                      />
                      <Input
                        value={globalStyles.contentBackgroundColor}
                        onChange={(e) => setGlobalStyles({ ...globalStyles, contentBackgroundColor: e.target.value })}
                        className="flex-1"
                      />
                    </div>
                  </div>

                  {/* Primary Color */}
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-gray-500 uppercase">Cor Principal</Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={globalStyles.primaryColor}
                        onChange={(e) => setGlobalStyles({ ...globalStyles, primaryColor: e.target.value })}
                        className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer"
                      />
                      <Input
                        value={globalStyles.primaryColor}
                        onChange={(e) => setGlobalStyles({ ...globalStyles, primaryColor: e.target.value })}
                        className="flex-1"
                      />
                    </div>
                  </div>

                  {/* Text Color */}
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-gray-500 uppercase">Cor do Texto</Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={globalStyles.textColor}
                        onChange={(e) => setGlobalStyles({ ...globalStyles, textColor: e.target.value })}
                        className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer"
                      />
                      <Input
                        value={globalStyles.textColor}
                        onChange={(e) => setGlobalStyles({ ...globalStyles, textColor: e.target.value })}
                        className="flex-1"
                      />
                    </div>
                  </div>

                  {/* Font Family */}
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-gray-500 uppercase">Fonte</Label>
                    <Select
                      value={globalStyles.fontFamily}
                      onValueChange={(value) => setGlobalStyles({ ...globalStyles, fontFamily: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Inter, sans-serif">Inter</SelectItem>
                        <SelectItem value="Arial, sans-serif">Arial</SelectItem>
                        <SelectItem value="Helvetica, sans-serif">Helvetica</SelectItem>
                        <SelectItem value="Georgia, serif">Georgia</SelectItem>
                        <SelectItem value="Times New Roman, serif">Times New Roman</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Max Width */}
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-gray-500 uppercase">Largura Máxima: {globalStyles.maxWidth}px</Label>
                    <Slider
                      value={[globalStyles.maxWidth]}
                      onValueChange={([value]) => setGlobalStyles({ ...globalStyles, maxWidth: value })}
                      min={400}
                      max={800}
                      step={10}
                    />
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </aside>

        {/* Canvas Area */}
        <main className="flex-1 overflow-auto p-8" style={{ backgroundColor: globalStyles.backgroundColor }}>
          <div className="flex justify-center">
            <div
              className="transition-all duration-300"
              style={{
                width: previewWidth,
                maxWidth: '100%',
              }}
            >
              {/* Subject Line */}
              <div className="mb-4 bg-white rounded-lg p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-xs font-semibold text-gray-500 uppercase">Assunto do Email</Label>
                  <VariablePicker
                    onSelect={(v) => setSubject(subject + v)}
                    trigger={
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs gap-1 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                      >
                        <Variable className="h-3 w-3" />
                        Variáveis
                      </Button>
                    }
                  />
                </div>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Digite o assunto do email... Use {{variavel}} para personalizar"
                  className="text-lg"
                />
              </div>

              {/* Email Content */}
              <div
                className="rounded-lg shadow-lg overflow-hidden"
                style={{ backgroundColor: globalStyles.contentBackgroundColor }}
              >
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={blocks.map(b => b.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {blocks.length === 0 ? (
                      <div className="p-12 text-center text-gray-400">
                        <Layout className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-medium">Arraste blocos aqui</p>
                        <p className="text-sm">ou clique em um bloco na barra lateral</p>
                      </div>
                    ) : (
                      blocks.map((block) => (
                        <SortableBlock
                          key={block.id}
                          block={block}
                          isSelected={selectedBlockId === block.id}
                          onSelect={() => setSelectedBlockId(block.id)}
                          onDuplicate={() => duplicateBlock(block.id)}
                          onDelete={() => removeBlock(block.id)}
                          globalStyles={globalStyles}
                        />
                      ))
                    )}
                  </SortableContext>

                  <DragOverlay>
                    {activeId ? (
                      <div className="opacity-80">
                        <BlockRenderer
                          block={blocks.find(b => b.id === activeId)!}
                          globalStyles={globalStyles}
                        />
                      </div>
                    ) : null}
                  </DragOverlay>
                </DndContext>
              </div>

              {/* Botão Salvar Fixo no Final */}
              <div className="mt-6 flex justify-center">
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 px-8 py-6 text-lg shadow-lg"
                  size="lg"
                >
                  {isSaving ? (
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-5 w-5 mr-2" />
                  )}
                  Salvar Template
                </Button>
              </div>
            </div>
          </div>
        </main>

        {/* Right Sidebar - Block Settings */}
        <Sheet open={!!selectedBlockId} onOpenChange={(open) => !open && setSelectedBlockId(null)}>
          <SheetContent className="w-96 p-0">
            <SheetHeader className="p-4 border-b">
              <SheetTitle className="flex items-center gap-2">
                <Settings2 className="h-5 w-5" />
                Configurações do Bloco
              </SheetTitle>
            </SheetHeader>
            {selectedBlock && (
              <ScrollArea className="h-[calc(100vh-80px)]">
                {renderBlockSettings()}
              </ScrollArea>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
