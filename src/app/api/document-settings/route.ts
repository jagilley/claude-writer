import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { DocumentSettings, DEFAULT_DOCUMENT_SETTINGS } from '@/lib/types';

const SETTINGS_DIR = path.join(process.cwd(), '.writer', 'document-settings');

async function ensureSettingsDir() {
  try {
    await fs.mkdir(SETTINGS_DIR, { recursive: true });
  } catch (error) {
    // Directory already exists
  }
}

function getSettingsFilename(documentPath: string): string {
  // Use base64 encoding to safely store any filename
  return Buffer.from(documentPath).toString('base64') + '.json';
}

// Get settings for a document
export async function GET(request: NextRequest) {
  await ensureSettingsDir();

  const documentPath = request.nextUrl.searchParams.get('path');
  if (!documentPath) {
    return NextResponse.json({ settings: DEFAULT_DOCUMENT_SETTINGS });
  }

  try {
    const filename = getSettingsFilename(documentPath);
    const filePath = path.join(SETTINGS_DIR, filename);
    const content = await fs.readFile(filePath, 'utf-8');
    const settings: DocumentSettings = JSON.parse(content);
    return NextResponse.json({ settings: { ...DEFAULT_DOCUMENT_SETTINGS, ...settings } });
  } catch (error) {
    // File doesn't exist, return defaults
    return NextResponse.json({ settings: DEFAULT_DOCUMENT_SETTINGS });
  }
}

// Save settings for a document
export async function PUT(request: NextRequest) {
  await ensureSettingsDir();

  try {
    const { documentPath, settings }: { documentPath: string; settings: DocumentSettings } = await request.json();

    if (!documentPath) {
      return NextResponse.json({ error: 'Document path required' }, { status: 400 });
    }

    const filename = getSettingsFilename(documentPath);
    const filePath = path.join(SETTINGS_DIR, filename);

    await fs.writeFile(filePath, JSON.stringify(settings, null, 2), 'utf-8');

    return NextResponse.json({ success: true, settings });
  } catch (error) {
    console.error('Error saving document settings:', error);
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
  }
}
