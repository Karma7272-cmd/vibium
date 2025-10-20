
import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Monitor } from 'lucide-react';

interface SpecificNodeSelectorProps {
  specificNode: string;
  setSpecificNode: (specificNode: string) => void;
}

const SpecificNodeSelector: React.FC<SpecificNodeSelectorProps> = ({ specificNode, setSpecificNode }) => {
  const specificNodes = [
    'Cheerful-Blue-Dolphin (NYC)',
    'Brave-Green-Eagle (London)',
    'Swift-Red-Falcon (Tokyo)',
    'Mighty-Blue-Wolf (Sydney)',
    'Golden-Purple-Phoenix (Berlin)',
    'Silver-Orange-Tiger (Mumbai)'
  ];

  return (
    <div className="space-y-2">
      <Label htmlFor="specificNode">Specific Node (Optional)</Label>
      <Select value={specificNode} onValueChange={setSpecificNode}>
        <SelectTrigger>
          <SelectValue placeholder="Select a specific node" />
        </SelectTrigger>
        <SelectContent>
          {specificNodes.map((node) => (
            <SelectItem key={node} value={node}>
              <div className="flex items-center space-x-2">
                <Monitor className="w-4 h-4" />
                <span>{node}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default SpecificNodeSelector;
