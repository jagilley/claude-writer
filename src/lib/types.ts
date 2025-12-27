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

export type ModelType = 'claude-sonnet-4-20250514' | 'claude-opus-4-0-20250115';

export interface AppState {
  currentDocument: DocumentFile | null;
  chats: Chat[];
  activeChats: string[]; // IDs of open chat windows
  selectedModel: ModelType;
  sidebarTab: 'files' | 'chats';
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
