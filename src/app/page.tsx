'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { v4 as uuidv4 } from 'uuid';
import { Chat, DocumentFile, ModelType } from '@/lib/types';
import Sidebar from '@/components/Sidebar';
import ChatWindow from '@/components/ChatWindow';

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
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChats, setActiveChats] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState<ModelType>('claude-sonnet-4-20250514');
  const [sidebarTab, setSidebarTab] = useState<'files' | 'chats'>('files');
  const [currentSelection, setCurrentSelection] = useState<{ text: string; from: number; to: number } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

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

  // Auto-save with debounce
  useEffect(() => {
    if (!currentDocument || !hasUnsavedChanges) return;

    const timer = setTimeout(async () => {
      await saveDocument();
    }, 2000); // 2 second debounce

    return () => clearTimeout(timer);
  }, [documentContent, currentDocument, hasUnsavedChanges]);

  const saveDocument = async () => {
    if (!currentDocument || !hasUnsavedChanges) return;

    setIsSaving(true);
    try {
      await fetch('/api/files', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: currentDocument.path,
          content: documentContent,
        }),
      });

      // Auto-commit (optional - can be disabled)
      await fetch('/api/git', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'autoCommit',
          message: `Update ${currentDocument.name}`,
        }),
      });

      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Error saving document:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileSelect = async (file: { path: string; name: string }) => {
    // Save current document before switching
    if (hasUnsavedChanges) {
      await saveDocument();
    }

    try {
      const response = await fetch('/api/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: file.path, action: 'read' }),
      });

      const doc: DocumentFile = await response.json();
      setCurrentDocument(doc);
      setDocumentContent(doc.content);
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Error loading file:', error);
    }
  };

  const handleContentChange = (markdown: string) => {
    setDocumentContent(markdown);
    setHasUnsavedChanges(true);
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

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        currentDocument={currentDocument}
        chats={chats}
        activeTab={sidebarTab}
        selectedModel={selectedModel}
        onTabChange={setSidebarTab}
        onFileSelect={handleFileSelect}
        onChatSelect={handleChatSelect}
        onChatDelete={handleChatDelete}
        onModelChange={setSelectedModel}
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
                {hasUnsavedChanges && <span className="text-yellow-500">●</span>}
                {isSaving && <span className="text-gray-400 text-sm">Saving...</span>}
              </>
            ) : (
              <span className="text-gray-400">Select a file to edit</span>
            )}
          </div>

          {currentDocument && (
            <button
              onClick={() => saveDocument()}
              disabled={!hasUnsavedChanges || isSaving}
              className="px-3 py-1 text-sm bg-[var(--accent)] text-white rounded hover:bg-[var(--accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save
            </button>
          )}
        </div>

        {/* Editor */}
        <div className="flex-1 overflow-hidden">
          {currentDocument ? (
            <Editor
              content={documentContent}
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
              selectedModel={selectedModel}
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
