export interface Chat {
  id: string;
  title: string;
  documentPath: string;
  selectedText?: string;
  selectionStart?: number;
  selectionEnd?: number;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  minimized: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface DocumentFile {
  path: string;
  name: string;
  content: string;
  lastModified: string;
}

export type ThinkingMode = 'disabled' | 'enabled';

export interface ModelSettings {
  modelId: string;
  thinkingMode: ThinkingMode;
  thinkingBudget: number; // tokens, 0 means no limit
}

export const DEFAULT_MODEL_SETTINGS: ModelSettings = {
  modelId: 'claude-sonnet-4-5-20250929',
  thinkingMode: 'disabled',
  thinkingBudget: 10000,
};

export interface AppState {
  currentDocument: DocumentFile | null;
  chats: Chat[];
  activeChats: string[]; // IDs of open chat windows
  modelSettings: ModelSettings;
  sidebarTab: 'files' | 'chats' | 'settings';
}

export interface GitCommit {
  hash: string;
  message: string;
  date: string;
  author: string;
}

export interface GitDiff {
  added: string[];
  removed: string[];
  modified: string[];
}

export interface DocumentSettings {
  fontFamily: string;
}

export const DEFAULT_DOCUMENT_SETTINGS: DocumentSettings = {
  fontFamily: 'system',
};

export const FONT_OPTIONS = [
  // Sans-serif
  { id: 'system', name: 'System Default', value: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif', category: 'sans' },
  { id: 'arial', name: 'Arial', value: 'Arial, "Helvetica Neue", Helvetica, sans-serif', category: 'sans' },
  { id: 'verdana', name: 'Verdana', value: 'Verdana, Geneva, sans-serif', category: 'sans' },
  { id: 'trebuchet', name: 'Trebuchet MS', value: '"Trebuchet MS", "Lucida Grande", "Lucida Sans Unicode", sans-serif', category: 'sans' },
  { id: 'tahoma', name: 'Tahoma', value: 'Tahoma, Geneva, sans-serif', category: 'sans' },
  { id: 'avenir', name: 'Avenir', value: 'Avenir, "Avenir Next", "Segoe UI", sans-serif', category: 'sans' },
  { id: 'futura', name: 'Futura', value: 'Futura, "Trebuchet MS", Arial, sans-serif', category: 'sans' },
  { id: 'helvetica', name: 'Helvetica Neue', value: '"Helvetica Neue", Helvetica, Arial, sans-serif', category: 'sans' },
  { id: 'optima', name: 'Optima', value: 'Optima, Segoe, "Segoe UI", Candara, Calibri, Arial, sans-serif', category: 'sans' },

  // Serif
  { id: 'georgia', name: 'Georgia', value: 'Georgia, Cambria, "Times New Roman", Times, serif', category: 'serif' },
  { id: 'times', name: 'Times New Roman', value: '"Times New Roman", Times, serif', category: 'serif' },
  { id: 'palatino', name: 'Palatino', value: '"Palatino Linotype", Palatino, "Book Antiqua", Georgia, serif', category: 'serif' },
  { id: 'garamond', name: 'Garamond', value: 'Garamond, Baskerville, "Baskerville Old Face", "Hoefler Text", Georgia, serif', category: 'serif' },
  { id: 'baskerville', name: 'Baskerville', value: 'Baskerville, "Baskerville Old Face", "Hoefler Text", Garamond, Georgia, serif', category: 'serif' },
  { id: 'charter', name: 'Charter', value: 'Charter, "Bitstream Charter", "Sitka Text", Cambria, serif', category: 'serif' },
  { id: 'bookman', name: 'Bookman', value: '"Bookman Old Style", Bookman, "URW Bookman L", Georgia, serif', category: 'serif' },
  { id: 'cambria', name: 'Cambria', value: 'Cambria, Georgia, serif', category: 'serif' },
  { id: 'didot', name: 'Didot', value: 'Didot, "Bodoni MT", "Noto Serif Display", "URW Palladio L", Georgia, serif', category: 'serif' },
  { id: 'hoefler', name: 'Hoefler Text', value: '"Hoefler Text", "Baskerville Old Face", Garamond, Georgia, serif', category: 'serif' },

  // Monospace
  { id: 'mono', name: 'SF Mono', value: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, monospace', category: 'mono' },
  { id: 'courier', name: 'Courier New', value: '"Courier New", Courier, "Lucida Console", monospace', category: 'mono' },
  { id: 'consolas', name: 'Consolas', value: 'Consolas, monaco, "Ubuntu Mono", monospace', category: 'mono' },
  { id: 'menlo', name: 'Menlo', value: 'Menlo, Monaco, Consolas, "Liberation Mono", monospace', category: 'mono' },

  // Casual/Friendly
  { id: 'comic', name: 'Comic Sans', value: '"Comic Sans MS", "Comic Sans", cursive', category: 'casual' },
  { id: 'marker', name: 'Marker Felt', value: '"Marker Felt", "Segoe Print", "Bradley Hand", cursive', category: 'casual' },
  { id: 'papyrus', name: 'Papyrus', value: 'Papyrus, fantasy', category: 'casual' },
  { id: 'brush', name: 'Brush Script', value: '"Brush Script MT", cursive', category: 'casual' },
];
