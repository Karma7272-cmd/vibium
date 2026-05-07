export type DiffLineType = 'unchanged' | 'added' | 'removed';

export interface DiffLine {
  type: DiffLineType;
  oldLineNumber: number | null;
  newLineNumber: number | null;
  content: string;
}

export interface DiffHunk {
  lines: DiffLine[];
  oldStart: number;
  newStart: number;
}

function lcsMatrix(a: string[], b: string[]): number[][] {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }
  return dp;
}

export function computeLineDiff(original: string, modified: string): DiffLine[] {
  const origLines = original.split('\n');
  const modLines = modified.split('\n');

  if (origLines.length === 0 && modLines.length === 0) return [];

  const dp = lcsMatrix(origLines, modLines);
  const result: DiffLine[] = [];
  let i = origLines.length;
  let j = modLines.length;

  const stack: DiffLine[] = [];
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && origLines[i - 1] === modLines[j - 1]) {
      stack.push({ type: 'unchanged', oldLineNumber: i, newLineNumber: j, content: origLines[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      stack.push({ type: 'added', oldLineNumber: null, newLineNumber: j, content: modLines[j - 1] });
      j--;
    } else if (i > 0) {
      stack.push({ type: 'removed', oldLineNumber: i, newLineNumber: null, content: origLines[i - 1] });
      i--;
    }
  }

  for (let k = stack.length - 1; k >= 0; k--) {
    result.push(stack[k]);
  }

  return result;
}

export function splitDiffForSideBySide(diffLines: DiffLine[]): { left: (DiffLine | null)[]; right: (DiffLine | null)[] } {
  const left: (DiffLine | null)[] = [];
  const right: (DiffLine | null)[] = [];

  let idx = 0;
  while (idx < diffLines.length) {
    const line = diffLines[idx];
    if (line.type === 'unchanged') {
      left.push(line);
      right.push(line);
      idx++;
    } else if (line.type === 'removed') {
      const removedBatch: DiffLine[] = [];
      while (idx < diffLines.length && diffLines[idx].type === 'removed') {
        removedBatch.push(diffLines[idx]);
        idx++;
      }
      const addedBatch: DiffLine[] = [];
      while (idx < diffLines.length && diffLines[idx].type === 'added') {
        addedBatch.push(diffLines[idx]);
        idx++;
      }
      const maxLen = Math.max(removedBatch.length, addedBatch.length);
      for (let k = 0; k < maxLen; k++) {
        left.push(k < removedBatch.length ? removedBatch[k] : null);
        right.push(k < addedBatch.length ? addedBatch[k] : null);
      }
    } else if (line.type === 'added') {
      left.push(null);
      right.push(line);
      idx++;
    }
  }

  return { left, right };
}

export function getFileStatusLabel(action: 'edit' | 'create' | 'delete'): { label: string; short: string; color: string } {
  switch (action) {
    case 'create':
      return { label: 'Added', short: 'A', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' };
    case 'delete':
      return { label: 'Deleted', short: 'D', color: 'bg-red-500/20 text-red-400 border-red-500/30' };
    case 'edit':
    default:
      return { label: 'Modified', short: 'M', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' };
  }
}
