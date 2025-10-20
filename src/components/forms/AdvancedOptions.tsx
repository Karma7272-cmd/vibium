
import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import NodeSelector from './NodeSelector';
import LocationSelector from './LocationSelector';
import OperatorSelector from './OperatorSelector';
import OSSelector from './OSSelector';
import SpecificNodeSelector from './SpecificNodeSelector';

interface AdvancedOptionsProps {
  nodeType: string;
  setNodeType: (nodeType: string) => void;
  location: string;
  setLocation: (location: string) => void;
  operator: string;
  setOperator: (operator: string) => void;
  os: string;
  setOs: (os: string) => void;
  specificNode: string;
  setSpecificNode: (specificNode: string) => void;
}

const AdvancedOptions: React.FC<AdvancedOptionsProps> = ({
  nodeType,
  setNodeType,
  location,
  setLocation,
  operator,
  setOperator,
  os,
  setOs,
  specificNode,
  setSpecificNode,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button variant="outline" className="w-full justify-between">
          Advanced Options
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-4 mt-4">
        <NodeSelector nodeType={nodeType} setNodeType={setNodeType} />
        <LocationSelector location={location} setLocation={setLocation} />
        <OperatorSelector operator={operator} setOperator={setOperator} />
        <OSSelector os={os} setOs={setOs} />
        <SpecificNodeSelector specificNode={specificNode} setSpecificNode={setSpecificNode} />
      </CollapsibleContent>
    </Collapsible>
  );
};

export default AdvancedOptions;
