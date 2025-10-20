
import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Monitor, Smartphone } from 'lucide-react';

interface NodeSelectorProps {
  nodeType: string;
  setNodeType: (nodeType: string) => void;
}

const NodeSelector: React.FC<NodeSelectorProps> = ({ nodeType, setNodeType }) => {
  const nodeTypeOptions = [
    'MacBook Pro',
    'Windows PC',
    'Chrome Desktop',
    'iPhone 15',
    'Samsung Galaxy',
    'iPad Pro',
    'Android Tablet'
  ];

  return (
    <div className="space-y-2">
      <Label htmlFor="nodeType">Node Type</Label>
      <Select value={nodeType} onValueChange={setNodeType}>
        <SelectTrigger>
          <SelectValue placeholder="Select node type" />
        </SelectTrigger>
        <SelectContent>
          {nodeTypeOptions.map((nodeOption) => (
            <SelectItem key={nodeOption} value={nodeOption}>
              <div className="flex items-center space-x-2">
                {nodeOption.includes('Phone') || nodeOption.includes('Galaxy') ? (
                  <Smartphone className="w-4 h-4" />
                ) : (
                  <Monitor className="w-4 h-4" />
                )}
                <span>{nodeOption}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default NodeSelector;
