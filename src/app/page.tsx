'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import { v4 as uuidv4 } from 'uuid';
import { Chat, DocumentFile, ModelSettings, DEFAULT_MODEL_SETTINGS } from '@/lib/types';
import { computeBlockDiffs, BlockDiff, hasUncommittedChanges } from '@/lib/diff';
import Sidebar from '@/components/Sidebar';
import ChatWindow from '@/components/ChatWindow';

const SETTINGS_STORAGE_KEY = 'writer-model-settings';

// Dynamic import for Editor to avoid SSR issues with TipTap
const Editor = dynamic(() => import('@/components/Editor'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full">
      <span className="spinner"></span>
      <span className="ml-2">Loading editor...</span>
    </div>
  ),
});

export default function Home() {
  const [currentDocument, setCurrentDocument] = useState<DocumentFile | null>(null);
  const [documentContent, setDocumentContent] = useState('');
  const [committedContent, setCommittedContent] = useState(''); // Content at last git commit
  const [lineDiffs, setLineDiffs] = useState<BlockDiff[]>([]); // Block-level diff markers
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChats, setActiveChats] = useState<string[]>([]);
  const [modelSettings, setModelSettings] = useState<ModelSettings>(DEFAULT_MODEL_SETTINGS);
  const [sidebarTab, setSidebarTab] = useState<'files' | 'chats' | 'settings'>('files');
  const [currentSelection, setCurrentSelection] = useState<{ text: string; from: number; to: number } | null>(null);
  const [isCommitting, setIsCommitting] = useState(false);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setModelSettings({ ...DEFAULT_MODEL_SETTINGS, ...parsed });
      } catch (e) {
        console.error('Error parsing saved settings:', e);
      }
    }
  }, []);

  // Load chats from storage
  useEffect(() => {
    loadChats();
  }, []);

  const loadChats = async () => {
    try {
      const response = await fetch('/api/chats');
      const data = await response.json();
      setChats(data.chats || []);
    } catch (error) {
      console.error('Error loading chats:', error);
    }
  };

  // Save settings to localStorage when they change
  const handleModelSettingsChange = (newSettings: ModelSettings) => {
    setModelSettings(newSettings);
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(newSettings));
  };

  // Auto-save to disk (debounced)
  const autoSaveToFile = useCallback(async (content: string) => {
    if (!currentDocument) return;

    try {
      await fetch('/api/files', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: currentDocument.path,
          content: content,
        }),
      });
    } catch (error) {
      console.error('Error auto-saving document:', error);
    }
  }, [currentDocument]);

  // Commit changes to git
  const commitDocument = async () => {
    if (!currentDocument || !hasUncommittedChanges(committedContent, documentContent)) return;

    setIsCommitting(true);
    try {
      // First ensure file is saved
      await autoSaveToFile(documentContent);

      // Then commit to git
      const response = await fetch('/api/git', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'commit',
          message: `Update ${currentDocument.name}`,
        }),
      });

      if (response.ok) {
        // Update committed content - diffs will clear automatically
        setCommittedContent(documentContent);
        setLineDiffs([]);
      }
    } catch (error) {
      console.error('Error committing document:', error);
    } finally {
      setIsCommitting(false);
    }
  };

  const handleFileSelect = async (file: { path: string; name: string }) => {
    // Warn if there are uncommitted changes
    if (hasUncommittedChanges(committedContent, documentContent)) {
      const confirmed = window.confirm('You have uncommitted changes. Discard them?');
      if (!confirmed) return;
    }

    try {
      // Load the file content
      const response = await fetch('/api/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: file.path, action: 'read' }),
      });

      const doc: DocumentFile = await response.json();
      setCurrentDocument(doc);
      setDocumentContent(doc.content);

      // Load the committed version from git
      const gitResponse = await fetch(`/api/git?action=showFile&file=${encodeURIComponent(file.path)}`);
      const gitData = await gitResponse.json();

      console.log('[Git] Loaded committed content:', {
        hasContent: !!gitData.content,
        contentLength: gitData.content?.length,
        docContentLength: doc.content.length
      });

      // If file exists in git, use that as committed content, otherwise use current content
      const committed = gitData.content ?? doc.content;
      setCommittedContent(committed);

      // Compute initial diffs
      const diffs = computeBlockDiffs(committed, doc.content);
      console.log('[Git] Computed diffs:', diffs);
      setLineDiffs(diffs);
    } catch (error) {
      console.error('Error loading file:', error);
    }
  };

  const handleContentChange = (markdown: string) => {
    setDocumentContent(markdown);

    // Compute block diffs against committed content
    setLineDiffs(computeBlockDiffs(committedContent, markdown));

    // Debounced auto-save to disk
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    autoSaveTimeoutRef.current = setTimeout(() => {
      autoSaveToFile(markdown);
    }, 500); // 500ms debounce
  };

  const handleSelectionChange = (selection: { text: string; from: number; to: number } | null) => {
    setCurrentSelection(selection);
  };

  const createNewChat = useCallback((selectedText?: string) => {
    if (!currentDocument) return;

    const newChat: Chat = {
      id: uuidv4(),
      title: selectedText
        ? `Chat: "${selectedText.slice(0, 30)}..."`
        : `Chat: ${currentDocument.name}`,
      documentPath: currentDocument.path,
      selectedText: selectedText,
      selectionStart: currentSelection?.from,
      selectionEnd: currentSelection?.to,
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      position: { x: 400 + Math.random() * 100, y: 100 + Math.random() * 100 },
      size: { width: 400, height: 500 },
      minimized: false,
    };

    setChats((prev) => [newChat, ...prev]);
    setActiveChats((prev) => [...prev, newChat.id]);
    setSidebarTab('chats');

    // Save chat to disk
    fetch('/api/chats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newChat),
    });
  }, [currentDocument, currentSelection]);

  const handleOpenChat = (selectedText: string) => {
    createNewChat(selectedText);
  };

  const handleChatUpdate = async (updatedChat: Chat) => {
    setChats((prev) =>
      prev.map((c) => (c.id === updatedChat.id ? updatedChat : c))
    );

    // Save to disk
    await fetch('/api/chats', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedChat),
    });
  };

  const handleChatClose = (chatId: string) => {
    setActiveChats((prev) => prev.filter((id) => id !== chatId));
  };

  const handleChatMinimize = (chatId: string) => {
    setChats((prev) =>
      prev.map((c) => (c.id === chatId ? { ...c, minimized: true } : c))
    );
  };

  const handleChatSelect = (chatId: string) => {
    // Restore minimized chat or bring to front
    setChats((prev) =>
      prev.map((c) => (c.id === chatId ? { ...c, minimized: false } : c))
    );

    if (!activeChats.includes(chatId)) {
      setActiveChats((prev) => [...prev, chatId]);
    }
  };

  const handleChatDelete = async (chatId: string) => {
    setChats((prev) => prev.filter((c) => c.id !== chatId));
    setActiveChats((prev) => prev.filter((id) => id !== chatId));

    await fetch('/api/chats', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: chatId }),
    });
  };

  // Keyboard shortcut for commit (Cmd+S)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        commitDocument();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentDocument, documentContent, committedContent]);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        currentDocument={currentDocument}
        chats={chats}
        activeTab={sidebarTab}
        modelSettings={modelSettings}
        onTabChange={setSidebarTab}
        onFileSelect={handleFileSelect}
        onChatSelect={handleChatSelect}
        onChatDelete={handleChatDelete}
        onModelSettingsChange={handleModelSettingsChange}
        onNewChat={() => createNewChat()}
      />

      {/* Main Editor Area */}
      <div className="flex-1 flex flex-col relative overflow-hidden">
        {/* Document header */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--chat-border)] bg-[var(--sidebar-bg)]">
          <div className="flex items-center gap-2">
            {currentDocument ? (
              <>
                <span className="font-medium">{currentDocument.name}</span>
                {hasUncommittedChanges(committedContent, documentContent) && (
                  <span className="text-yellow-500" title="Uncommitted changes">●</span>
                )}
                {isCommitting && <span className="text-gray-400 text-sm">Committing...</span>}
              </>
            ) : (
              <span className="text-gray-400">Select a file to edit</span>
            )}
          </div>

          {currentDocument && (
            <button
              onClick={() => commitDocument()}
              disabled={!hasUncommittedChanges(committedContent, documentContent) || isCommitting}
              className="px-3 py-1 text-sm bg-[var(--accent)] text-white rounded hover:bg-[var(--accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed"
              title="Commit (Cmd+S)"
            >
              Commit
            </button>
          )}
        </div>

        {/* Editor */}
        <div className="flex-1 overflow-hidden">
          {currentDocument ? (
            <Editor
              content={documentContent}
              lineDiffs={lineDiffs}
              onContentChange={handleContentChange}
              onSelectionChange={handleSelectionChange}
              onOpenChat={handleOpenChat}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              <div className="text-center">
                <div className="text-6xl mb-4">📝</div>
                <div className="text-xl">Select a markdown file from the sidebar to start editing</div>
                <div className="text-sm mt-2">
                  Or create a new .md file in the current directory
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Chat Windows */}
        {activeChats.map((chatId) => {
          const chat = chats.find((c) => c.id === chatId);
          if (!chat || chat.minimized) return null;

          return (
            <ChatWindow
              key={chat.id}
              chat={chat}
              documentContent={documentContent}
              modelSettings={modelSettings}
              onUpdate={handleChatUpdate}
              onClose={() => handleChatClose(chat.id)}
              onMinimize={() => handleChatMinimize(chat.id)}
            />
          );
        })}
      </div>
    </div>
  );
}
