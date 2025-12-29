export type EmailBlockType =
  | 'header'
  | 'text'
  | 'image'
  | 'button'
  | 'divider'
  | 'spacer'
  | 'columns'
  | 'list'
  | 'quote'
  | 'video'
  | 'social'
  | 'footer';

export interface EmailBlockStyles {
  padding?: string;
  margin?: string;
  backgroundColor?: string;
  color?: string;
  textAlign?: 'left' | 'center' | 'right';
  borderRadius?: string;
  border?: string;
  borderLeft?: string;
  fontSize?: string;
  fontStyle?: string;
  paddingLeft?: string;
}

export interface HeaderBlockContent {
  logoUrl: string;
  logoAlt: string;
  showLogo: boolean;
  backgroundColor: string;
  title?: string;
  subtitle?: string;
}

export interface TextBlockContent {
  text: string;
  fontSize: string;
  lineHeight: string;
  fontWeight?: string;
}

export interface ImageBlockContent {
  src: string;
  alt: string;
  link: string;
  width: string;
}

export interface ButtonBlockContent {
  text: string;
  link: string;
  backgroundColor: string;
  textColor: string;
  borderRadius: string;
  size: 'small' | 'medium' | 'large';
}

export interface DividerBlockContent {
  color: string;
  thickness: string;
  style: 'solid' | 'dashed' | 'dotted';
  width: string;
}

export interface SpacerBlockContent {
  height: string;
}

export interface ColumnsBlockContent {
  columns: number;
  gap: string;
  children: EmailBlock[][];
}

export interface ListBlockContent {
  items: string[];
  listStyle: 'disc' | 'circle' | 'square' | 'decimal' | 'check';
  iconColor: string;
}

export interface QuoteBlockContent {
  text: string;
  author: string;
  borderColor: string;
}

export interface VideoBlockContent {
  thumbnailUrl: string;
  videoUrl: string;
  playButtonColor: string;
}

export interface SocialNetwork {
  type: 'facebook' | 'instagram' | 'twitter' | 'linkedin' | 'youtube' | 'whatsapp' | 'tiktok';
  url: string;
}

export interface SocialBlockContent {
  networks: SocialNetwork[];
  iconSize: string;
  iconStyle: 'colored' | 'dark' | 'light';
}

export interface FooterBlockContent {
  companyName: string;
  address: string;
  phone: string;
  email: string;
  unsubscribeText: string;
  unsubscribeLink: string;
}

export type EmailBlockContent =
  | HeaderBlockContent
  | TextBlockContent
  | ImageBlockContent
  | ButtonBlockContent
  | DividerBlockContent
  | SpacerBlockContent
  | ColumnsBlockContent
  | ListBlockContent
  | QuoteBlockContent
  | VideoBlockContent
  | SocialBlockContent
  | FooterBlockContent;

export interface EmailBlock {
  id: string;
  type: EmailBlockType;
  content: any; // Using any for flexibility, but ideally would use discriminated union
  styles?: EmailBlockStyles;
}

export interface EmailGlobalStyles {
  backgroundColor: string;
  contentBackgroundColor: string;
  primaryColor: string;
  textColor: string;
  fontFamily: string;
  maxWidth: number;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  blocks: EmailBlock[];
  globalStyles: EmailGlobalStyles;
  html?: string;
  thumbnail?: string;
  category?: string;
  createdAt: string;
  updatedAt: string;
}
