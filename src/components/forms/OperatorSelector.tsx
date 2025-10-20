
import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users } from 'lucide-react';

interface OperatorSelectorProps {
  operator: string;
  setOperator: (operator: string) => void;
}

const OperatorSelector: React.FC<OperatorSelectorProps> = ({ operator, setOperator }) => {
  const operators = [
    'alextech',
    'sarah_ops',
    'dkumar',
    'emmanode',
    'mrodriguez',
    'lisatech',
    'jameswilson',
    'mariaops'
  ];

  return (
    <div className="space-y-2">
      <Label htmlFor="operator">Operator</Label>
      <Select value={operator} onValueChange={setOperator}>
        <SelectTrigger>
          <SelectValue placeholder="Select operator" />
        </SelectTrigger>
        <SelectContent>
          {operators.map((op) => (
            <SelectItem key={op} value={op}>
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4" />
                <span>@{op}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default OperatorSelector;
