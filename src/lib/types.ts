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
