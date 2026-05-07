import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Copy, Download, FileCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { getFileStatusLabel } from './diff-utils';
import DiffViewer from './DiffViewer';

interface FileChangeCardProps {
  path: string;
  action: 'edit' | 'create' | 'delete';
  before: string;
  after: string;
  note?: string;
  isActive?: boolean;
  onSelect?: () => void;
  sideBySide?: boolean;
  defaultExpanded?: boolean;
}

const FileChangeCard: React.FC<FileChangeCardProps> = ({
  path,
  action,
  before,
  after,
  note,
  isActive,
  onSelect,
  sideBySide = true,
  defaultExpanded = false,
}) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const { toast } = useToast();
  const status = getFileStatusLabel(action);
  const fileName = path.split('/').pop() || path;
  const dirPath = path.includes('/') ? path.substring(0, path.lastIndexOf('/')) : '';

  const addedLines = after.split('\n').length - before.split('\n').length;
  const linesChanged = Math.abs(addedLines);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(after);
    toast({ title: 'Copied', description: `${path} content copied to clipboard` });
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    const blob = new Blob([after], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleExpand = () => {
    setExpanded(!expanded);
    if (!expanded && onSelect) onSelect();
  };

  return (
    <div
      className={`rounded-lg border transition-all duration-200 ${
        isActive
          ? 'border-primary/40 shadow-md shadow-primary/5'
          : 'border-border/60 hover:border-border'
      } bg-card overflow-hidden`}
    >
      {/* Card header */}
      <button
        onClick={toggleExpand}
        className="w-full flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2.5 md:py-3 text-left hover:bg-muted/30 transition-colors group"
      >
        <span className="text-muted-foreground/60 transition-transform duration-200">
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </span>

        <span
          className={`inline-flex items-center justify-center w-5 h-5 md:w-6 md:h-6 rounded text-[10px] md:text-[11px] font-bold border shrink-0 ${status.color}`}
        >
          {status.short}
        </span>

        <div className="flex-1 min-w-0 flex flex-col md:flex-row md:items-center gap-0.5 md:gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <FileCode className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0 hidden md:block" />
            <span className="text-xs md:text-sm font-medium truncate">{fileName}</span>
          </div>
          {dirPath && (
            <span className="text-[10px] md:text-xs text-muted-foreground/50 truncate font-mono">{dirPath}/</span>
          )}
        </div>

        {note && (
          <span className="hidden lg:inline text-[10px] text-muted-foreground/50 max-w-xs truncate italic">{note}</span>
        )}

        <div className="flex items-center gap-1 shrink-0">
          {action !== 'delete' && addedLines !== 0 && (
            <span className={`text-[10px] md:text-xs font-mono ${addedLines > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {addedLines > 0 ? `+${addedLines}` : addedLines}
            </span>
          )}
          {linesChanged > 0 && (
            <span className="text-[10px] md:text-xs text-muted-foreground/40">
              ({linesChanged} line{linesChanged !== 1 ? 's' : ''})
            </span>
          )}
        </div>

        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleDownload} title="Download">
            <Download className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleCopy} title="Copy">
            <Copy className="h-3 w-3" />
          </Button>
        </div>
      </button>

      {/* Card body: diff view */}
      {expanded && (
        <div className="border-t border-border/40 bg-background/50">
          {action === 'delete' ? (
            <div className="p-4 text-center text-sm text-red-400/80">
              This file was deleted
            </div>
          ) : action === 'create' ? (
            <DiffViewer original="" modified={after} sideBySide={false} />
          ) : (
            <DiffViewer original={before} modified={after} sideBySide={sideBySide} />
          )}
        </div>
      )}
    </div>
  );
};

export default FileChangeCard;
