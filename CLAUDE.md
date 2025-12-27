# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Writer is an AI-maximalist text editor for AI-assisted creative writing, built with Next.js. It uses the Claude Agent SDK to provide AI chat functionality with full document context. The app runs locally via `localhost` and edits markdown/text files on the user's computer.

## Common Commands

```bash
npm run dev      # Start development server (localhost:3000)
npm run build    # Production build
npm run lint     # Run ESLint
```

## Architecture

### Core Concept: Chat Sessions

The central primitive is **chat sessions** - draggable, resizable windows that can be about:
- The entire document
- A selected text snippet (for focused editing)
- Continuation-oriented writing

Chats are persisted to disk in a `.writer-chats` directory.

### Key Components

**Frontend (React/Next.js)**
- `src/app/page.tsx` - Main orchestrator: manages documents, chats, model settings, and coordinates all state
- `src/components/Editor.tsx` - TipTap-based rich text editor with markdown conversion and selection-based chat triggers
- `src/components/ChatWindow.tsx` - Draggable/resizable chat windows using `react-rnd`, handles streaming responses
- `src/components/Sidebar.tsx` - File browser, chat list, and settings tabs
- `src/lib/markdown.ts` - Bidirectional markdown/HTML conversion using `marked` and `turndown`
- `src/lib/types.ts` - TypeScript interfaces for Chat, ChatMessage, DocumentFile, ModelSettings, etc.

**API Routes**
- `/api/chat` - Streams AI responses using Claude Agent SDK's `query()` function with SSE
- `/api/files` - CRUD operations for local markdown/text files
- `/api/chats` - Persistence for chat sessions
- `/api/git` - Git operations for version tracking

### Claude Agent SDK Integration

The chat API (`src/app/api/chat/route.ts`) uses:
```typescript
import { query } from '@anthropic-ai/claude-agent-sdk';

// Streams responses with file editing tools enabled
for await (const message of query({
  prompt: fullPrompt,
  options: {
    allowedTools: ['Read', 'Edit', 'Write', 'Glob', 'Grep'],
    model: modelSettings.modelId,
    permissionMode: 'acceptEdits',
    thinking: { type: 'enabled', budget_tokens: N } // optional
  }
})) { ... }
```

### State Management

- Model settings (model ID, thinking mode, thinking budget) are stored in localStorage
- Chats are persisted to disk via `/api/chats`
- Document content is managed in page-level state with explicit save (Cmd+S)

### Editor Features

The TipTap editor supports:
- Rich text formatting (bold, italic, headings, lists, quotes, code blocks)
- Selection-based floating menu with "Chat about this" option
- Automatic markdown conversion on content changes
