'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import Highlight from '@tiptap/extension-highlight';
import Typography from '@tiptap/extension-typography';
import { useCallback, useEffect, useState, useRef } from 'react';
import { markdownToHtml, htmlToMarkdown } from '@/lib/markdown';

interface EditorProps {
  content: string;
  onContentChange: (markdown: string) => void;
  onSelectionChange: (selection: { text: string; from: number; to: number } | null) => void;
  onOpenChat: (selectedText: string) => void;
}

export default function Editor({ content, onContentChange, onSelectionChange, onOpenChat }: EditorProps) {
  const [selectionMenu, setSelectionMenu] = useState<{ x: number; y: number; text: string } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Placeholder.configure({
        placeholder: 'Start writing...',
      }),
      Link.configure({
        openOnClick: false,
      }),
      Highlight,
      Typography,
    ],
    content: markdownToHtml(content),
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const markdown = htmlToMarkdown(html);
      onContentChange(markdown);
    },
    onSelectionUpdate: ({ editor }) => {
      const { from, to } = editor.state.selection;
      const text = editor.state.doc.textBetween(from, to, ' ');

      if (text.trim().length > 0) {
        onSelectionChange({ text: text.trim(), from, to });

        // Get selection coordinates for floating menu
        const view = editor.view;
        const coords = view.coordsAtPos(from);
        setSelectionMenu({
          x: coords.left,
          y: coords.top - 50,
          text: text.trim(),
        });
      } else {
        onSelectionChange(null);
        setSelectionMenu(null);
      }
    },
  });

  // Update editor content when prop changes (e.g., file loaded)
  useEffect(() => {
    if (editor && content) {
      const currentHtml = editor.getHTML();
      const newHtml = markdownToHtml(content);
      // Only update if content actually changed to avoid cursor jump
      if (htmlToMarkdown(currentHtml) !== content) {
        editor.commands.setContent(newHtml);
      }
    }
  }, [content, editor]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setSelectionMenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOpenChat = useCallback(() => {
    if (selectionMenu?.text) {
      onOpenChat(selectionMenu.text);
      setSelectionMenu(null);
    }
  }, [selectionMenu, onOpenChat]);

  if (!editor) {
    return <div className="flex items-center justify-center h-full">Loading editor...</div>;
  }

  return (
    <div className="flex flex-col h-full relative">
      {/* Toolbar */}
      <div className="toolbar">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive('bold') ? 'active' : ''}
          title="Bold (Cmd+B)"
        >
          <strong>B</strong>
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive('italic') ? 'active' : ''}
          title="Italic (Cmd+I)"
        >
          <em>I</em>
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={editor.isActive('heading', { level: 1 }) ? 'active' : ''}
          title="Heading 1"
        >
          H1
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={editor.isActive('heading', { level: 2 }) ? 'active' : ''}
          title="Heading 2"
        >
          H2
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={editor.isActive('heading', { level: 3 }) ? 'active' : ''}
          title="Heading 3"
        >
          H3
        </button>
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={editor.isActive('bulletList') ? 'active' : ''}
          title="Bullet List"
        >
          • List
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={editor.isActive('orderedList') ? 'active' : ''}
          title="Numbered List"
        >
          1. List
        </button>
        <button
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={editor.isActive('blockquote') ? 'active' : ''}
          title="Quote"
        >
          &ldquo; Quote
        </button>
        <button
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={editor.isActive('codeBlock') ? 'active' : ''}
          title="Code Block"
        >
          {'</>'}
        </button>
        <button
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          title="Horizontal Rule"
        >
          ―
        </button>

        {/* Chat about selection button in toolbar */}
        {selectionMenu && (
          <button
            onClick={handleOpenChat}
            className="ml-auto bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)]"
            title="Chat about selected text"
          >
            💬 Chat about selection
          </button>
        )}
      </div>

      {/* Floating selection menu */}
      {selectionMenu && (
        <div
          ref={menuRef}
          className="selection-menu"
          style={{
            position: 'fixed',
            left: `${Math.max(10, selectionMenu.x)}px`,
            top: `${Math.max(10, selectionMenu.y)}px`,
          }}
        >
          <button onClick={() => editor.chain().focus().toggleBold().run()}>
            <strong>B</strong>
          </button>
          <button onClick={() => editor.chain().focus().toggleItalic().run()}>
            <em>I</em>
          </button>
          <button onClick={() => editor.chain().focus().toggleHighlight().run()}>
            Highlight
          </button>
          <button
            onClick={handleOpenChat}
            style={{ borderTop: '1px solid var(--chat-border)', marginTop: '4px', paddingTop: '8px' }}
          >
            💬 Chat about this
          </button>
        </div>
      )}

      {/* Editor Content */}
      <div className="flex-1 overflow-auto">
        <EditorContent editor={editor} className="h-full" />
      </div>
    </div>
  );
}
