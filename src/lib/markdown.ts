import { marked } from 'marked';
import TurndownService from 'turndown';

// Configure marked for parsing markdown to HTML
marked.setOptions({
  gfm: true,
  breaks: true,
});

// Configure turndown for converting HTML back to markdown
const turndownService = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
  bulletListMarker: '-',
});

// Add custom rules for better markdown conversion
turndownService.addRule('strikethrough', {
  filter: ['del', 's'] as const,
  replacement: function (content) {
    return '~~' + content + '~~';
  },
});

export function markdownToHtml(markdown: string): string {
  return marked.parse(markdown, { async: false }) as string;
}

export function htmlToMarkdown(html: string): string {
  return turndownService.turndown(html);
}

// Helper to extract plain text from markdown (for previews)
export function markdownToPlainText(markdown: string): string {
  const html = markdownToHtml(markdown);
  // Strip HTML tags
  return html.replace(/<[^>]*>/g, '').trim();
}

// Get a title from markdown content (first heading or first line)
export function getTitleFromMarkdown(markdown: string): string {
  const lines = markdown.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('#')) {
      return trimmed.replace(/^#+\s*/, '');
    }
    if (trimmed.length > 0) {
      return trimmed.slice(0, 50) + (trimmed.length > 50 ? '...' : '');
    }
  }
  return 'Untitled';
}
