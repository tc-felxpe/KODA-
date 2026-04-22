export type BlockType = 'paragraph' | 'heading-1' | 'heading-2' | 'heading-3' | 'bullet-list' | 'numbered-list' | 'checklist' | 'code' | 'quote' | 'divider' | 'image';

export interface BlockContent {
  text?: string;
  checked?: boolean;
  language?: string;
  src?: string;
  items?: Array<{ id: string; text: string; checked: boolean }>;
}

export interface BlockProperties {
  alignment?: 'left' | 'center' | 'right';
  color?: string;
  backgroundColor?: string;
}

export interface Block {
  id: string;
  page_id: string;
  type: BlockType;
  content: BlockContent;
  properties: BlockProperties;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface Page {
  id: string;
  workspace_id: string;
  parent_id: string | null;
  title: string;
  icon: string;
  cover_image: string | null;
  is_favorite: boolean;
  position: number;
  created_by: string;
  created_at: string;
  updated_at: string;
  children?: Page[];
  blocks?: Block[];
}

export interface Workspace {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  app_metadata: Record<string, unknown>;
  user_metadata: Record<string, unknown>;
  aud: string;
  created_at: string;
}