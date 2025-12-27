'use client';

import { useState, useEffect } from 'react';
import { Chat, ModelType, DocumentFile } from '@/lib/types';

interface SidebarProps {
  currentDocument: DocumentFile | null;
  chats: Chat[];
  activeTab: 'files' | 'chats';
  selectedModel: ModelType;
  onTabChange: (tab: 'files' | 'chats') => void;
  onFileSelect: (file: { path: string; name: string }) => void;
  onChatSelect: (chatId: string) => void;
  onChatDelete: (chatId: string) => void;
  onModelChange: (model: ModelType) => void;
  onNewChat: () => void;
}

interface FileEntry {
  path: string;
  name: string;
  lastModified: string;
}

export default function Sidebar({
  currentDocument,
  chats,
  activeTab,
  selectedModel,
  onTabChange,
  onFileSelect,
  onChatSelect,
  onChatDelete,
  onModelChange,
  onNewChat,
}: SidebarProps) {
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentDir, setCurrentDir] = useState<string>('');

  // Load files on mount
  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/files');
      const data = await response.json();
      setFiles(data.files || []);
      setCurrentDir(data.currentDir || '');
    } catch (error) {
      console.error('Error loading files:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="sidebar">
      {/* Header with model selector */}
      <div className="sidebar-header">
        <div className="flex items-center justify-between mb-3">
          <span className="text-lg font-semibold">Writer</span>
        </div>

        {/* Model selector */}
        <select
          value={selectedModel}
          onChange={(e) => onModelChange(e.target.value as ModelType)}
          className="model-selector w-full"
        >
          <option value="claude-sonnet-4-20250514">Claude Sonnet 4.5</option>
          <option value="claude-opus-4-0-20250115">Claude Opus 4</option>
        </select>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[var(--chat-border)]">
        <button
          className={`flex-1 py-2 px-4 text-sm font-medium transition-colors ${
            activeTab === 'files'
              ? 'border-b-2 border-[var(--accent)] text-[var(--accent)]'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => onTabChange('files')}
        >
          Files
        </button>
        <button
          className={`flex-1 py-2 px-4 text-sm font-medium transition-colors ${
            activeTab === 'chats'
              ? 'border-b-2 border-[var(--accent)] text-[var(--accent)]'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => onTabChange('chats')}
        >
          Chats ({chats.length})
        </button>
      </div>

      {/* Content */}
      <div className="sidebar-content">
        {activeTab === 'files' ? (
          <div>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <span className="spinner"></span>
              </div>
            ) : files.length === 0 ? (
              <div className="text-gray-400 text-center py-8 text-sm">
                No markdown files found in the current directory
              </div>
            ) : (
              <div>
                <div className="text-xs text-gray-400 px-2 py-1 truncate" title={currentDir}>
                  {currentDir}
                </div>
                {files.map((file) => (
                  <div
                    key={file.path}
                    className={`file-item ${currentDocument?.path === file.path ? 'active' : ''}`}
                    onClick={() => onFileSelect(file)}
                  >
                    <span className="text-lg">📄</span>
                    <div className="flex-1 min-w-0">
                      <div className="truncate font-medium">{file.name}</div>
                      <div className="text-xs text-gray-400">
                        {formatDate(file.lastModified)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div>
            {/* New Chat button */}
            <button
              onClick={onNewChat}
              className="w-full mb-2 py-2 px-4 bg-[var(--accent)] text-white rounded-lg hover:bg-[var(--accent-hover)] transition-colors font-medium"
              disabled={!currentDocument}
            >
              + New Chat
            </button>

            {chats.length === 0 ? (
              <div className="text-gray-400 text-center py-8 text-sm">
                No chats yet. Open a file and start chatting!
              </div>
            ) : (
              <div>
                {chats.map((chat) => (
                  <div
                    key={chat.id}
                    className="chat-list-item group"
                  >
                    <div
                      className="flex-1 cursor-pointer"
                      onClick={() => onChatSelect(chat.id)}
                    >
                      <div className="font-medium truncate">{chat.title}</div>
                      <div className="text-xs text-gray-400">
                        {chat.messages.length} messages
                      </div>
                      {chat.selectedText && (
                        <div className="text-xs text-indigo-500 truncate mt-1">
                          &ldquo;{chat.selectedText.slice(0, 30)}...&rdquo;
                        </div>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onChatDelete(chat.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 px-2"
                      title="Delete chat"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
