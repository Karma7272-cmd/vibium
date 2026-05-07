import React, { useMemo } from 'react';
import { computeLineDiff, splitDiffForSideBySide, type DiffLine } from './diff-utils';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

interface DiffViewerProps {
  original: string;
  modified: string;
  language?: string;
  sideBySide?: boolean;
  maxHeight?: string;
}

const LineContent: React.FC<{ content: string }> = ({ content }) => (
  <span className="whitespace-pre font-mono text-[11px] md:text-xs leading-5">
    {content || '\u00A0'}
  </span>
);

const UnifiedDiffView: React.FC<{ diffLines: DiffLine[] }> = ({ diffLines }) => (
  <div className="w-full">
    {diffLines.map((line, idx) => {
      const bgClass =
        line.type === 'added'
          ? 'bg-emerald-500/10 dark:bg-emerald-500/8'
          : line.type === 'removed'
            ? 'bg-red-500/10 dark:bg-red-500/8'
            : '';
      const textClass =
        line.type === 'added'
          ? 'text-emerald-300'
          : line.type === 'removed'
            ? 'text-red-300'
            : 'text-muted-foreground/40';
      const prefix = line.type === 'added' ? '+' : line.type === 'removed' ? '-' : ' ';

      return (
        <div key={idx} className={`flex items-start ${bgClass} hover:brightness-110 transition-colors`}>
          <span className="w-10 md:w-12 shrink-0 text-right pr-2 text-[10px] md:text-[11px] text-muted-foreground/40 select-none leading-5 font-mono">
            {line.oldLineNumber ?? ''}
          </span>
          <span className="w-10 md:w-12 shrink-0 text-right pr-2 text-[10px] md:text-[11px] text-muted-foreground/40 select-none leading-5 font-mono">
            {line.newLineNumber ?? ''}
          </span>
          <span className={`w-4 shrink-0 text-center text-[11px] md:text-xs select-none leading-5 font-mono ${textClass}`}>
            {prefix}
          </span>
          <div className="flex-1 min-w-0 px-2 overflow-hidden">
            <LineContent content={line.content} />
          </div>
        </div>
      );
    })}
  </div>
);

const SideBySideDiffView: React.FC<{ diffLines: DiffLine[] }> = ({ diffLines }) => {
  const { left, right } = useMemo(() => splitDiffForSideBySide(diffLines), [diffLines]);

  return (
    <div className="flex w-full min-w-0">
      {/* Left (original) */}
      <div className="flex-1 min-w-0 border-r border-border/50">
        {left.map((line, idx) => {
          const bgClass = line?.type === 'removed' ? 'bg-red-500/10 dark:bg-red-500/8' : '';
          const lineNumClass = line?.type === 'removed' ? 'text-red-400/60' : 'text-muted-foreground/40';

          return (
            <div key={idx} className={`flex items-start ${bgClass} hover:brightness-110 transition-colors`}>
              <span className={`w-10 md:w-12 shrink-0 text-right pr-2 text-[10px] md:text-[11px] select-none leading-5 font-mono ${lineNumClass}`}>
                {line?.oldLineNumber ?? ''}
              </span>
              <span className="w-4 shrink-0 text-center text-[11px] md:text-xs select-none leading-5 font-mono text-red-400/60">
                {line?.type === 'removed' ? '-' : ''}
              </span>
              <div className="flex-1 min-w-0 px-2 overflow-hidden">
                <LineContent content={line?.content ?? ''} />
              </div>
            </div>
          );
        })}
      </div>
      {/* Right (modified) */}
      <div className="flex-1 min-w-0">
        {right.map((line, idx) => {
          const bgClass = line?.type === 'added' ? 'bg-emerald-500/10 dark:bg-emerald-500/8' : '';
          const lineNumClass = line?.type === 'added' ? 'text-emerald-400/60' : 'text-muted-foreground/40';

          return (
            <div key={idx} className={`flex items-start ${bgClass} hover:brightness-110 transition-colors`}>
              <span className={`w-10 md:w-12 shrink-0 text-right pr-2 text-[10px] md:text-[11px] select-none leading-5 font-mono ${lineNumClass}`}>
                {line?.newLineNumber ?? ''}
              </span>
              <span className="w-4 shrink-0 text-center text-[11px] md:text-xs select-none leading-5 font-mono text-emerald-400/60">
                {line?.type === 'added' ? '+' : ''}
              </span>
              <div className="flex-1 min-w-0 px-2 overflow-hidden">
                <LineContent content={line?.content ?? ''} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const DiffViewer: React.FC<DiffViewerProps> = ({
  original,
  modified,
  sideBySide = true,
  maxHeight = '500px',
}) => {
  const diffLines = useMemo(() => computeLineDiff(original, modified), [original, modified]);

  if (diffLines.length === 0) {
    return (
      <div className="p-6 text-center text-sm text-muted-foreground">
        No differences found
      </div>
    );
  }

  return (
    <ScrollArea className="w-full" style={{ maxHeight }}>
      <div className="min-w-0">
        {sideBySide ? (
          <SideBySideDiffView diffLines={diffLines} />
        ) : (
          <UnifiedDiffView diffLines={diffLines} />
        )}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
};

export default DiffViewer;
