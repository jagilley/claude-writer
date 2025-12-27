import * as Diff from 'diff';

export type LineDiffType = 'added' | 'modified' | 'removed' | 'unchanged';

export interface LineDiff {
  lineNumber: number;
  type: LineDiffType;
}

/**
 * Computes line-by-line differences between committed and current content.
 * Returns an array of line diffs for the current content, indicating which
 * lines are added, modified, or unchanged.
 */
export function computeLineDiffs(committedContent: string, currentContent: string): LineDiff[] {
  if (!committedContent && !currentContent) {
    return [];
  }

  // If there's no committed content, all current lines are "added"
  if (!committedContent) {
    const lines = currentContent.split('\n');
    return lines.map((_, index) => ({
      lineNumber: index + 1,
      type: 'added' as LineDiffType,
    }));
  }

  // If content is identical, no diffs
  if (committedContent === currentContent) {
    return [];
  }

  const changes = Diff.diffLines(committedContent, currentContent);
  const lineDiffs: LineDiff[] = [];
  let currentLineNumber = 1;

  for (const change of changes) {
    const lineCount = change.count || 0;

    if (change.added) {
      // These lines were added in current content
      for (let i = 0; i < lineCount; i++) {
        lineDiffs.push({
          lineNumber: currentLineNumber + i,
          type: 'added',
        });
      }
      currentLineNumber += lineCount;
    } else if (change.removed) {
      // These lines were removed - we show a marker at the current position
      // but don't increment line number since they don't exist in current
      if (lineDiffs.length > 0 && lineDiffs[lineDiffs.length - 1].lineNumber === currentLineNumber - 1) {
        // Mark the previous line as modified instead of just added
        // (this handles the case where a line was changed, not just added/removed)
        const prevDiff = lineDiffs[lineDiffs.length - 1];
        if (prevDiff.type === 'added') {
          prevDiff.type = 'modified';
        }
      }
    } else {
      // Unchanged lines - just advance the line counter
      currentLineNumber += lineCount;
    }
  }

  return lineDiffs;
}

/**
 * Check if there are any uncommitted changes
 */
export function hasUncommittedChanges(committedContent: string, currentContent: string): boolean {
  return committedContent !== currentContent;
}
