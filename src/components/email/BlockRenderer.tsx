import React from 'react';
import { EmailBlock, EmailGlobalStyles } from './types';
import {
  Image as ImageIcon,
  Play,
  Facebook,
  Instagram,
  Linkedin,
  Youtube,
  Twitter,
  MessageCircle,
  Music2
} from 'lucide-react';

interface BlockRendererProps {
  block: EmailBlock;
  globalStyles: EmailGlobalStyles;
}

const socialIcons: Record<string, React.ElementType> = {
  facebook: Facebook,
  instagram: Instagram,
  linkedin: Linkedin,
  youtube: Youtube,
  twitter: Twitter,
  whatsapp: MessageCircle,
  tiktok: Music2,
};

const socialColors: Record<string, string> = {
  facebook: '#1877F2',
  instagram: '#E4405F',
  linkedin: '#0A66C2',
  youtube: '#FF0000',
  twitter: '#1DA1F2',
  whatsapp: '#25D366',
  tiktok: '#000000',
};

export function BlockRenderer({ block, globalStyles }: BlockRendererProps) {
  const renderBlock = () => {
    switch (block.type) {
      case 'header':
        return (
          <div
            style={{
              backgroundColor: block.content.backgroundColor || globalStyles.primaryColor,
              padding: block.styles?.padding || '30px 20px',
              textAlign: (block.styles?.textAlign as any) || 'center',
            }}
          >
            {block.content.showLogo && block.content.logoUrl ? (
              <img
                src={block.content.logoUrl}
                alt={block.content.logoAlt || 'Logo'}
                style={{ maxHeight: '60px', margin: '0 auto' }}
              />
            ) : block.content.showLogo ? (
              <div className="flex items-center justify-center gap-2 text-white">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <ImageIcon className="h-5 w-5" />
                </div>
                <span className="text-lg font-semibold">Seu Logo Aqui</span>
              </div>
            ) : null}
            {block.content.title && (
              <h1 style={{ color: '#fff', fontSize: '28px', margin: '10px 0 0', fontWeight: 700 }}>
                {block.content.title}
              </h1>
            )}
            {block.content.subtitle && (
              <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '16px', margin: '5px 0 0' }}>
                {block.content.subtitle}
              </p>
            )}
          </div>
        );

      case 'text':
        return (
          <div
            style={{
              padding: block.styles?.padding || '20px',
              color: block.styles?.color || globalStyles.textColor,
              fontSize: block.content.fontSize || '16px',
              lineHeight: block.content.lineHeight || '1.6',
              textAlign: (block.styles?.textAlign as any) || 'left',
            }}
            dangerouslySetInnerHTML={{ __html: block.content.text || '<p>Digite seu texto aqui...</p>' }}
          />
        );

      case 'image':
        return (
          <div
            style={{
              padding: block.styles?.padding || '20px',
              textAlign: (block.styles?.textAlign as any) || 'center',
            }}
          >
            {block.content.src ? (
              <img
                src={block.content.src}
                alt={block.content.alt || 'Imagem'}
                style={{
                  maxWidth: block.content.width || '100%',
                  height: 'auto',
                  borderRadius: '8px',
                }}
              />
            ) : (
              <div className="bg-gray-100 rounded-lg p-12 flex flex-col items-center justify-center text-gray-400">
                <ImageIcon className="h-12 w-12 mb-2" />
                <p className="text-sm">Clique para adicionar uma imagem</p>
              </div>
            )}
          </div>
        );

      case 'button':
        const buttonPadding = block.content.size === 'small'
          ? '10px 20px'
          : block.content.size === 'large'
            ? '18px 36px'
            : '14px 28px';
        const buttonFontSize = block.content.size === 'small'
          ? '14px'
          : block.content.size === 'large'
            ? '18px'
            : '16px';

        return (
          <div
            style={{
              padding: block.styles?.padding || '20px',
              textAlign: (block.styles?.textAlign as any) || 'center',
            }}
          >
            <a
              href={block.content.link || '#'}
              style={{
                display: 'inline-block',
                backgroundColor: block.content.backgroundColor || globalStyles.primaryColor,
                color: block.content.textColor || '#ffffff',
                padding: buttonPadding,
                borderRadius: block.content.borderRadius || '8px',
                textDecoration: 'none',
                fontWeight: 600,
                fontSize: buttonFontSize,
              }}
            >
              {block.content.text || 'Clique aqui'}
            </a>
          </div>
        );

      case 'divider':
        return (
          <div style={{ padding: block.styles?.padding || '10px 20px' }}>
            <hr
              style={{
                border: 'none',
                borderTop: `${block.content.thickness || '1px'} ${block.content.style || 'solid'} ${block.content.color || '#e5e7eb'}`,
                width: block.content.width || '100%',
                margin: '0 auto',
              }}
            />
          </div>
        );

      case 'spacer':
        return (
          <div
            style={{
              height: block.content.height || '40px',
              backgroundColor: 'transparent',
            }}
          />
        );

      case 'columns':
        return (
          <div
            style={{
              padding: block.styles?.padding || '20px',
              display: 'flex',
              gap: block.content.gap || '20px',
            }}
          >
            {Array.from({ length: block.content.columns || 2 }).map((_, index) => (
              <div
                key={index}
                style={{
                  flex: 1,
                  minHeight: '100px',
                  backgroundColor: '#f9fafb',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                className="text-gray-400 text-sm"
              >
                Coluna {index + 1}
              </div>
            ))}
          </div>
        );

      case 'list':
        return (
          <div style={{ padding: block.styles?.padding || '20px' }}>
            <ul
              style={{
                listStyle: block.content.listStyle === 'check' ? 'none' : block.content.listStyle || 'disc',
                paddingLeft: block.content.listStyle === 'check' ? '0' : '20px',
                margin: 0,
                color: globalStyles.textColor,
              }}
            >
              {(block.content.items || ['Item 1', 'Item 2', 'Item 3']).map((item: string, index: number) => (
                <li
                  key={index}
                  style={{
                    marginBottom: '8px',
                    display: block.content.listStyle === 'check' ? 'flex' : 'list-item',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  {block.content.listStyle === 'check' && (
                    <span
                      style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        backgroundColor: block.content.iconColor || globalStyles.primaryColor,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        fontSize: '12px',
                        flexShrink: 0,
                      }}
                    >
                      ✓
                    </span>
                  )}
                  {item}
                </li>
              ))}
            </ul>
          </div>
        );

      case 'quote':
        return (
          <div
            style={{
              padding: block.styles?.padding || '20px',
              paddingLeft: '24px',
              borderLeft: `4px solid ${block.content.borderColor || globalStyles.primaryColor}`,
              fontStyle: 'italic',
              color: globalStyles.textColor,
            }}
          >
            <p style={{ margin: '0 0 8px', fontSize: '18px', lineHeight: '1.6' }}>
              "{block.content.text || 'Uma citação inspiradora...'}"
            </p>
            {block.content.author && (
              <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>
                — {block.content.author}
              </p>
            )}
          </div>
        );

      case 'video':
        return (
          <div
            style={{
              padding: block.styles?.padding || '20px',
              textAlign: (block.styles?.textAlign as any) || 'center',
            }}
          >
            {block.content.thumbnailUrl ? (
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <img
                  src={block.content.thumbnailUrl}
                  alt="Video thumbnail"
                  style={{ maxWidth: '100%', borderRadius: '8px' }}
                />
                <div
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '64px',
                    height: '64px',
                    backgroundColor: block.content.playButtonColor || globalStyles.primaryColor,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Play className="h-8 w-8 text-white ml-1" fill="white" />
                </div>
              </div>
            ) : (
              <div className="bg-gray-100 rounded-lg p-12 flex flex-col items-center justify-center text-gray-400">
                <Play className="h-12 w-12 mb-2" />
                <p className="text-sm">Adicione uma thumbnail do vídeo</p>
              </div>
            )}
          </div>
        );

      case 'social':
        return (
          <div
            style={{
              padding: block.styles?.padding || '20px',
              textAlign: (block.styles?.textAlign as any) || 'center',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
              {(block.content.networks || []).map((network: { type: string; url: string }, index: number) => {
                const Icon = socialIcons[network.type] || MessageCircle;
                const color = block.content.iconStyle === 'colored'
                  ? socialColors[network.type] || globalStyles.primaryColor
                  : block.content.iconStyle === 'dark'
                    ? '#1f2937'
                    : '#ffffff';
                const bgColor = block.content.iconStyle === 'light'
                  ? '#1f2937'
                  : 'transparent';

                return (
                  <a
                    key={index}
                    href={network.url || '#'}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: block.content.iconSize || '32px',
                      height: block.content.iconSize || '32px',
                      backgroundColor: bgColor,
                      borderRadius: '50%',
                    }}
                  >
                    <Icon
                      style={{
                        width: `calc(${block.content.iconSize || '32px'} * 0.6)`,
                        height: `calc(${block.content.iconSize || '32px'} * 0.6)`,
                        color,
                      }}
                    />
                  </a>
                );
              })}
            </div>
          </div>
        );

      case 'footer':
        return (
          <div
            style={{
              backgroundColor: block.styles?.backgroundColor || '#f9fafb',
              padding: block.styles?.padding || '30px 20px',
              textAlign: 'center',
              fontSize: block.styles?.fontSize || '12px',
              color: block.styles?.color || '#6b7280',
            }}
          >
            <p style={{ margin: '0 0 10px', fontWeight: 600 }}>
              {block.content.companyName || '{{empresa_nome}}'}
            </p>
            <p style={{ margin: '0 0 5px' }}>
              {block.content.address || 'Endereço da empresa'}
            </p>
            <p style={{ margin: '0 0 5px' }}>
              {block.content.phone || 'Telefone'} | {block.content.email || '{{empresa_email}}'}
            </p>
            <p style={{ margin: '20px 0 0' }}>
              <a
                href={block.content.unsubscribeLink || '#'}
                style={{ color: block.styles?.color || '#6b7280', textDecoration: 'underline' }}
              >
                {block.content.unsubscribeText || 'Cancelar inscrição'}
              </a>
            </p>
          </div>
        );

      default:
        return (
          <div className="p-4 bg-gray-100 text-gray-500 text-center">
            Bloco não reconhecido: {block.type}
          </div>
        );
    }
  };

  return renderBlock();
}
