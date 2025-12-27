import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

// Get list of markdown files in the working directory
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const dirPath = searchParams.get('path') || process.cwd();

  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    const files = [];

    for (const entry of entries) {
      if (entry.isFile() && (entry.name.endsWith('.md') || entry.name.endsWith('.txt'))) {
        const filePath = path.join(dirPath, entry.name);
        const stats = await fs.stat(filePath);
        files.push({
          path: filePath,
          name: entry.name,
          lastModified: stats.mtime.toISOString(),
        });
      }
    }

    return NextResponse.json({ files, currentDir: dirPath });
  } catch (error) {
    console.error('Error listing files:', error);
    return NextResponse.json({ error: 'Failed to list files' }, { status: 500 });
  }
}

// Read a specific file
export async function POST(request: NextRequest) {
  try {
    const { path: filePath, action } = await request.json();

    if (action === 'read') {
      const content = await fs.readFile(filePath, 'utf-8');
      const stats = await fs.stat(filePath);
      return NextResponse.json({
        path: filePath,
        name: path.basename(filePath),
        content,
        lastModified: stats.mtime.toISOString(),
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error reading file:', error);
    return NextResponse.json({ error: 'Failed to read file' }, { status: 500 });
  }
}

// Save a file
export async function PUT(request: NextRequest) {
  try {
    const { path: filePath, content } = await request.json();

    await fs.writeFile(filePath, content, 'utf-8');
    const stats = await fs.stat(filePath);

    return NextResponse.json({
      path: filePath,
      name: path.basename(filePath),
      lastModified: stats.mtime.toISOString(),
      success: true,
    });
  } catch (error) {
    console.error('Error saving file:', error);
    return NextResponse.json({ error: 'Failed to save file' }, { status: 500 });
  }
}
