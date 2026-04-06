import { useState } from "react";
import { ChevronRight, ChevronDown, Folder, File } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: FileNode[];
  language?: string;
}

interface FileTreeViewProps {
  files: Array<{ name: string; content: string; language: string }>;
  selectedFile: string | null;
  onFileSelect: (fileName: string) => void;
}

export const FileTreeView = ({ files, selectedFile, onFileSelect }: FileTreeViewProps) => {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  const buildFileTree = (files: Array<{ name: string; content: string; language: string }>): FileNode[] => {
    const root: FileNode[] = [];
    const folderMap = new Map<string, FileNode>();

    files.forEach(file => {
      const parts = file.name.split('/');
      let currentPath = '';
      let currentLevel = root;

      parts.forEach((part, index) => {
        const isLast = index === parts.length - 1;
        currentPath = currentPath ? `${currentPath}/${part}` : part;

        if (isLast) {
          // It's a file
          currentLevel.push({
            name: part,
            path: file.name,
            type: 'file',
            language: file.language,
          });
        } else {
          // It's a folder
          let folder = folderMap.get(currentPath);
          
          if (!folder) {
            folder = {
              name: part,
              path: currentPath,
              type: 'folder',
              children: [],
            };
            folderMap.set(currentPath, folder);
            currentLevel.push(folder);
          }
          
          currentLevel = folder.children!;
        }
      });
    });

    return root;
  };

  const toggleFolder = (path: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const renderNode = (node: FileNode, level: number = 0) => {
    const isExpanded = expandedFolders.has(node.path);
    const isSelected = node.type === 'file' && node.path === selectedFile;
    const paddingLeft = level * 16 + 8;

    if (node.type === 'folder') {
      return (
        <div key={node.path}>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-left h-8 px-2 hover:bg-accent"
            style={{ paddingLeft: `${paddingLeft}px` }}
            onClick={() => toggleFolder(node.path)}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 mr-1 flex-shrink-0" />
            ) : (
              <ChevronRight className="h-4 w-4 mr-1 flex-shrink-0" />
            )}
            <Folder className="h-4 w-4 mr-2 flex-shrink-0 text-blue-500" />
            <span className="truncate text-sm">{node.name}</span>
          </Button>
          {isExpanded && node.children && (
            <div>
              {node.children.map(child => renderNode(child, level + 1))}
            </div>
          )}
        </div>
      );
    }

    return (
      <Button
        key={node.path}
        variant={isSelected ? "secondary" : "ghost"}
        size="sm"
        className="w-full justify-start text-left h-8 px-2 hover:bg-accent"
        style={{ paddingLeft: `${paddingLeft}px` }}
        onClick={() => onFileSelect(node.path)}
      >
        <File className="h-4 w-4 mr-2 ml-5 flex-shrink-0 text-gray-500" />
        <span className="truncate text-sm">{node.name}</span>
      </Button>
    );
  };

  const fileTree = buildFileTree(files);

  return (
    <ScrollArea className="h-full">
      <div className="py-2 pr-2">
        {fileTree.map(node => renderNode(node))}
      </div>
    </ScrollArea>
  );
};
