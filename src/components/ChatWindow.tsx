'use client';

import { useState, useRef, useEffect } from 'react';
import { Rnd } from 'react-rnd';
import { Chat, ChatMessage, ModelType } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

interface ChatWindowProps {
  chat: Chat;
  documentContent: string;
  selectedModel: ModelType;
  onUpdate: (chat: Chat) => void;
  onClose: () => void;
  onMinimize: () => void;
}

export default function ChatWindow({
  chat,
  documentContent,
  selectedModel,
  onUpdate,
  onClose,
  onMinimize,
}: ChatWindowProps) {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chat.messages, streamingContent]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: uuidv4(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };

    const updatedChat: Chat = {
      ...chat,
      messages: [...chat.messages, userMessage],
      updatedAt: new Date().toISOString(),
    };

    onUpdate(updatedChat);
    setInput('');
    setIsLoading(true);
    setStreamingContent('');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: input.trim(),
          documentContent,
          documentPath: chat.documentPath,
          selectedText: chat.selectedText,
          chatHistory: chat.messages,
          model: selectedModel,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let fullContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') break;

            try {
              const parsed = JSON.parse(data);
              if (parsed.type === 'text') {
                fullContent += parsed.content;
                setStreamingContent(fullContent);
              } else if (parsed.type === 'result') {
                fullContent = parsed.content || fullContent;
                setStreamingContent(fullContent);
              } else if (parsed.type === 'tool_use') {
                // Show tool usage indicator
                fullContent += `\n[Using tool: ${parsed.tool}]\n`;
                setStreamingContent(fullContent);
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }

      // Add assistant message
      const assistantMessage: ChatMessage = {
        id: uuidv4(),
        role: 'assistant',
        content: fullContent || 'I apologize, but I could not generate a response.',
        timestamp: new Date().toISOString(),
      };

      const finalChat: Chat = {
        ...updatedChat,
        messages: [...updatedChat.messages, assistantMessage],
        updatedAt: new Date().toISOString(),
      };

      onUpdate(finalChat);
      setStreamingContent('');
    } catch (error) {
      console.error('Chat error:', error);
      // Add error message
      const errorMessage: ChatMessage = {
        id: uuidv4(),
        role: 'assistant',
        content: 'Sorry, there was an error processing your request. Please try again.',
        timestamp: new Date().toISOString(),
      };

      onUpdate({
        ...updatedChat,
        messages: [...updatedChat.messages, errorMessage],
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (chat.minimized) {
    return null; // Minimized chats are shown in the sidebar
  }

  return (
    <Rnd
      default={{
        x: chat.position.x,
        y: chat.position.y,
        width: chat.size.width,
        height: chat.size.height,
      }}
      minWidth={300}
      minHeight={200}
      bounds="parent"
      dragHandleClassName="chat-header"
      onDragStop={(e, d) => {
        onUpdate({ ...chat, position: { x: d.x, y: d.y } });
      }}
      onResizeStop={(e, direction, ref, delta, position) => {
        onUpdate({
          ...chat,
          size: {
            width: parseInt(ref.style.width),
            height: parseInt(ref.style.height),
          },
          position,
        });
      }}
      style={{ zIndex: 100 }}
    >
      <div className="chat-window h-full">
        {/* Header */}
        <div className="chat-header">
          <span className="truncate flex-1">{chat.title}</span>
          <div className="flex gap-2">
            <button
              onClick={onMinimize}
              className="hover:bg-white/20 rounded px-2"
              title="Minimize"
            >
              −
            </button>
            <button
              onClick={onClose}
              className="hover:bg-white/20 rounded px-2"
              title="Close"
            >
              ×
            </button>
          </div>
        </div>

        {/* Selected text context */}
        {chat.selectedText && (
          <div className="px-3 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-sm border-b border-indigo-200 dark:border-indigo-800">
            <span className="text-indigo-600 dark:text-indigo-400 font-medium">Context: </span>
            <span className="text-gray-600 dark:text-gray-300 italic">
              &ldquo;{chat.selectedText.slice(0, 100)}{chat.selectedText.length > 100 ? '...' : ''}&rdquo;
            </span>
          </div>
        )}

        {/* Messages */}
        <div className="chat-messages">
          {chat.messages.length === 0 && !streamingContent && (
            <div className="text-gray-400 text-center py-8">
              Start a conversation about your document
            </div>
          )}

          {chat.messages.map((message) => (
            <div key={message.id} className={`message ${message.role}`}>
              <div className="whitespace-pre-wrap">{message.content}</div>
            </div>
          ))}

          {streamingContent && (
            <div className="message assistant">
              <div className="whitespace-pre-wrap">{streamingContent}</div>
              <span className="spinner inline-block ml-2"></span>
            </div>
          )}

          {isLoading && !streamingContent && (
            <div className="message assistant">
              <span className="spinner"></span>
              <span className="ml-2">Thinking...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="chat-input">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your document... (Enter to send, Shift+Enter for new line)"
            rows={2}
            disabled={isLoading}
          />
        </div>
      </div>
    </Rnd>
  );
}
