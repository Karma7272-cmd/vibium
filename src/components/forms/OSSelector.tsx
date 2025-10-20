
import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Monitor } from 'lucide-react';

interface OSSelectorProps {
  os: string;
  setOs: (os: string) => void;
}

const OSSelector: React.FC<OSSelectorProps> = ({ os, setOs }) => {
  const operatingSystems = [
    'macOS',
    'Windows 11',
    'Ubuntu',
    'iOS',
    'Android',
    'Chrome OS'
  ];

  return (
    <div className="space-y-2">
      <Label htmlFor="os">Operating System</Label>
      <Select value={os} onValueChange={setOs}>
        <SelectTrigger>
          <SelectValue placeholder="Select operating system" />
        </SelectTrigger>
        <SelectContent>
          {operatingSystems.map((osOption) => (
            <SelectItem key={osOption} value={osOption}>
              <div className="flex items-center space-x-2">
                <Monitor className="w-4 h-4" />
                <span>{osOption}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default OSSelector;
