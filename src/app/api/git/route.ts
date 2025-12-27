import { NextRequest, NextResponse } from 'next/server';
import simpleGit from 'simple-git';
import path from 'path';

const git = simpleGit(process.cwd());

// Get git status and recent commits
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const action = searchParams.get('action') || 'status';

  try {
    switch (action) {
      case 'status': {
        const status = await git.status();
        return NextResponse.json({ status });
      }

      case 'log': {
        const log = await git.log({ maxCount: 20 });
        return NextResponse.json({
          commits: log.all.map(commit => ({
            hash: commit.hash,
            message: commit.message,
            date: commit.date,
            author: commit.author_name,
          }))
        });
      }

      case 'diff': {
        const filePath = searchParams.get('file');
        if (filePath) {
          const diff = await git.diff([filePath]);
          return NextResponse.json({ diff });
        }
        const allDiff = await git.diff();
        return NextResponse.json({ diff: allDiff });
      }

      case 'isRepo': {
        const isRepo = await git.checkIsRepo();
        return NextResponse.json({ isRepo });
      }

      case 'showFile': {
        // Get file content at HEAD (last commit)
        const filePath = searchParams.get('file');
        if (!filePath) {
          return NextResponse.json({ error: 'File path required' }, { status: 400 });
        }
        try {
          // Convert absolute path to relative path from repo root
          const repoRoot = process.cwd();
          const relativePath = path.relative(repoRoot, filePath);

          // Get the file content at HEAD
          const content = await git.show([`HEAD:${relativePath}`]);
          return NextResponse.json({ content });
        } catch {
          // File might not exist in git yet (new file)
          return NextResponse.json({ content: null });
        }
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Git error:', error);
    return NextResponse.json({ error: 'Git operation failed' }, { status: 500 });
  }
}

// Perform git operations
export async function POST(request: NextRequest) {
  try {
    const { action, message, files } = await request.json();

    switch (action) {
      case 'init': {
        await git.init();
        return NextResponse.json({ success: true, message: 'Git repository initialized' });
      }

      case 'add': {
        if (files && files.length > 0) {
          await git.add(files);
        } else {
          await git.add('.');
        }
        return NextResponse.json({ success: true });
      }

      case 'commit': {
        if (!message) {
          return NextResponse.json({ error: 'Commit message required' }, { status: 400 });
        }

        // Add only the specified file(s), or all if none specified
        if (files && files.length > 0) {
          await git.add(files);
        } else {
          await git.add('.');
        }

        // Then commit
        const result = await git.commit(message);
        return NextResponse.json({
          success: true,
          commit: {
            hash: result.commit,
            message: message,
          }
        });
      }

      case 'autoCommit': {
        // Auto-commit for document saves
        const status = await git.status();
        if (status.modified.length === 0 && status.created.length === 0) {
          return NextResponse.json({ success: true, message: 'No changes to commit' });
        }

        await git.add('.');
        const timestamp = new Date().toISOString();
        const autoMessage = message || `Auto-save: ${timestamp}`;
        const result = await git.commit(autoMessage);

        return NextResponse.json({
          success: true,
          commit: {
            hash: result.commit,
            message: autoMessage,
          }
        });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Git error:', error);
    return NextResponse.json({ error: 'Git operation failed', details: String(error) }, { status: 500 });
  }
}
