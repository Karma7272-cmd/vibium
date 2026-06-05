import React, { useMemo, useState } from 'react';
import { ChevronRight, ChevronDown, Folder, FolderOpen, FileCode, FileText, FileJson, FileType, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TreeFile { path: string; content: string }

interface Node {
  name: string;
  path: string;
  children?: Record<string, Node>;
  file?: TreeFile;
}

function buildTree(files: TreeFile[]): Node {
  const root: Node = { name: '', path: '', children: {} };
  for (const f of files) {
    const parts = f.path.split('/').filter(Boolean);
    let cur = root;
    parts.forEach((part, i) => {
      cur.children = cur.children || {};
      if (!cur.children[part]) {
        cur.children[part] = {
          name: part,
          path: parts.slice(0, i + 1).join('/'),
          children: i === parts.length - 1 ? undefined : {},
          file: i === parts.length - 1 ? f : undefined,
        };
      }
      cur = cur.children[part];
    });
  }
  return root;
}

const iconFor = (name: string) => {
  const ext = name.split('.').pop()?.toLowerCase() || '';
  if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(ext)) return ImageIcon;
  if (['json'].includes(ext)) return FileJson;
  if (['md', 'txt'].includes(ext)) return FileText;
  if (['ts', 'tsx', 'js', 'jsx', 'py', 'go', 'rs', 'java', 'css', 'html', 'sql', 'sh', 'yml', 'yaml'].includes(ext)) return FileCode;
  return FileType;
};

const NodeRow: React.FC<{
  node: Node;
  depth: number;
  selected?: string;
  onSelect: (f: TreeFile) => void;
  defaultOpen?: boolean;
}> = ({ node, depth, selected, onSelect, defaultOpen = true }) => {
  const [open, setOpen] = useState(defaultOpen);
  const isFolder = !!node.children;
  if (!node.name) {
    // root
    const entries = Object.values(node.children || {}).sort((a, b) => {
      const af = !!a.children, bf = !!b.children;
      if (af !== bf) return af ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
    return (
      <div>
        {entries.map(c => (
          <NodeRow key={c.path} node={c} depth={0} selected={selected} onSelect={onSelect} defaultOpen={depth < 1} />
        ))}
      </div>
    );
  }

  if (isFolder) {
    const entries = Object.values(node.children || {}).sort((a, b) => {
      const af = !!a.children, bf = !!b.children;
      if (af !== bf) return af ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
    return (
      <div>
        <button
          onClick={() => setOpen(o => !o)}
          className="w-full flex items-center gap-1 px-2 py-1 text-xs hover:bg-muted/60 text-left"
          style={{ paddingLeft: depth * 12 + 6 }}
        >
          {open ? <ChevronDown className="h-3 w-3 shrink-0" /> : <ChevronRight className="h-3 w-3 shrink-0" />}
          {open ? <FolderOpen className="h-3.5 w-3.5 text-amber-500 shrink-0" /> : <Folder className="h-3.5 w-3.5 text-amber-500 shrink-0" />}
          <span className="truncate">{node.name}</span>
        </button>
        {open && entries.map(c => (
          <NodeRow key={c.path} node={c} depth={depth + 1} selected={selected} onSelect={onSelect} defaultOpen={false} />
        ))}
      </div>
    );
  }

  const Icon = iconFor(node.name);
  const isSel = selected === node.file!.path;
  return (
    <button
      onClick={() => onSelect(node.file!)}
      className={cn(
        'w-full flex items-center gap-1.5 px-2 py-1 text-xs hover:bg-muted/60 text-left truncate',
        isSel && 'bg-primary/10 text-primary'
      )}
      style={{ paddingLeft: depth * 12 + 18 }}
    >
      <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      <span className="truncate">{node.name}</span>
    </button>
  );
};

export const ProjectFileTree: React.FC<{
  files: TreeFile[];
  selectedPath?: string;
  onSelect: (f: TreeFile) => void;
}> = ({ files, selectedPath, onSelect }) => {
  const tree = useMemo(() => buildTree(files), [files]);
  return (
    <div className="py-1">
      <NodeRow node={tree} depth={0} selected={selectedPath} onSelect={onSelect} />
    </div>
  );
};

export default ProjectFileTree;
