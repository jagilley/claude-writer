import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { Chat } from '@/lib/types';

const CHATS_DIR = path.join(process.cwd(), '.writer', 'chats');

// Ensure chats directory exists
async function ensureChatsDir() {
  try {
    await fs.mkdir(CHATS_DIR, { recursive: true });
  } catch (error) {
    // Directory already exists
  }
}

// Get all chats
export async function GET() {
  await ensureChatsDir();

  try {
    const files = await fs.readdir(CHATS_DIR);
    const chats: Chat[] = [];

    for (const file of files) {
      if (file.endsWith('.json')) {
        const content = await fs.readFile(path.join(CHATS_DIR, file), 'utf-8');
        chats.push(JSON.parse(content));
      }
    }

    // Sort by updatedAt descending
    chats.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    return NextResponse.json({ chats });
  } catch (error) {
    console.error('Error loading chats:', error);
    return NextResponse.json({ chats: [] });
  }
}

// Create a new chat
export async function POST(request: NextRequest) {
  await ensureChatsDir();

  try {
    const chat: Chat = await request.json();
    const filePath = path.join(CHATS_DIR, `${chat.id}.json`);

    await fs.writeFile(filePath, JSON.stringify(chat, null, 2), 'utf-8');

    return NextResponse.json({ success: true, chat });
  } catch (error) {
    console.error('Error creating chat:', error);
    return NextResponse.json({ error: 'Failed to create chat' }, { status: 500 });
  }
}

// Update a chat
export async function PUT(request: NextRequest) {
  await ensureChatsDir();

  try {
    const chat: Chat = await request.json();
    const filePath = path.join(CHATS_DIR, `${chat.id}.json`);

    chat.updatedAt = new Date().toISOString();
    await fs.writeFile(filePath, JSON.stringify(chat, null, 2), 'utf-8');

    return NextResponse.json({ success: true, chat });
  } catch (error) {
    console.error('Error updating chat:', error);
    return NextResponse.json({ error: 'Failed to update chat' }, { status: 500 });
  }
}

// Delete a chat
export async function DELETE(request: NextRequest) {
  await ensureChatsDir();

  try {
    const { id } = await request.json();
    const filePath = path.join(CHATS_DIR, `${id}.json`);

    await fs.unlink(filePath);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting chat:', error);
    return NextResponse.json({ error: 'Failed to delete chat' }, { status: 500 });
  }
}
