import * as Diff from 'diff';

export type BlockDiffType = 'added' | 'modified' | 'removed';

export interface BlockDiff {
  blockIndex: number;
  type: BlockDiffType;
}

/**
 * Split markdown content into blocks (paragraphs, headings, etc.)
 * Blocks are separated by blank lines in markdown.
 */
function splitIntoBlocks(content: string): string[] {
  if (!content) return [];

  // Split by double newlines (paragraph breaks) but also treat single lines as blocks
  // This handles headings, list items, etc.
  const blocks = content
    .split(/\n\n+/)
    .map(block => block.trim())
    .filter(block => block.length > 0);

  return blocks;
}

/**
 * Computes block-level differences between committed and current content.
 * Returns an array of block indices that have been added or modified.
 */
export function computeBlockDiffs(committedContent: string, currentContent: string): BlockDiff[] {
  if (!committedContent && !currentContent) {
    return [];
  }

  const committedBlocks = splitIntoBlocks(committedContent);
  const currentBlocks = splitIntoBlocks(currentContent);

  // If there's no committed content, all current blocks are "added"
  if (committedBlocks.length === 0) {
    return currentBlocks.map((_, index) => ({
      blockIndex: index,
      type: 'added' as BlockDiffType,
    }));
  }

  // If content is identical, no diffs
  if (committedContent === currentContent) {
    return [];
  }

  // Use diff to compare blocks
  const changes = Diff.diffArrays(committedBlocks, currentBlocks);
  const blockDiffs: BlockDiff[] = [];
  let currentBlockIndex = 0;

  for (const change of changes) {
    const count = change.count || 0;

    if (change.added) {
      // These blocks were added in current content
      for (let i = 0; i < count; i++) {
        blockDiffs.push({
          blockIndex: currentBlockIndex + i,
          type: 'added',
        });
      }
      currentBlockIndex += count;
    } else if (change.removed) {
      // Blocks were removed - check if this is a modification (removed + added at same spot)
      // We mark blocks as modified if there's already an "added" entry near this position
      for (let i = blockDiffs.length - 1; i >= 0; i--) {
        if (blockDiffs[i].type === 'added' && blockDiffs[i].blockIndex < currentBlockIndex) {
          blockDiffs[i].type = 'modified';
          break;
        }
      }
    } else {
      // Unchanged blocks - just advance the counter
      currentBlockIndex += count;
    }
  }

  return blockDiffs;
}

/**
 * Check if there are any uncommitted changes
 */
export function hasUncommittedChanges(committedContent: string, currentContent: string): boolean {
  return committedContent !== currentContent;
}

// Re-export for backwards compatibility during transition
export type LineDiff = BlockDiff;
export const computeLineDiffs = computeBlockDiffs;
