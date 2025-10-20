
import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NetworkOperatorSelectorProps {
  operator: string;
  setOperator: (operator: string) => void;
}

const NetworkOperatorSelector: React.FC<NetworkOperatorSelectorProps> = ({ operator, setOperator }) => {
  const [openOperator, setOpenOperator] = useState(false);

  const networkOperators = [
    { id: 'npub1a2b3c4d5e6f', name: 'TechValidator Pro', location: 'San Francisco, CA', status: 'online' },
    { id: 'npub2b3c4d5e6f7g', name: 'GlobalTester', location: 'New York, NY', status: 'online' },
    { id: 'npub3c4d5e6f7g8h', name: 'QualityChecker', location: 'London, UK', status: 'online' },
    { id: 'npub4d5e6f7g8h9i', name: 'WebValidator', location: 'Tokyo, Japan', status: 'online' },
    { id: 'npub5e6f7g8h9i0j', name: 'PerformanceGuru', location: 'Sydney, Australia', status: 'online' },
    { id: 'npub6f7g8h9i0j1k', name: 'ReliabilityNode', location: 'Frankfurt, Germany', status: 'online' },
    { id: 'npub7g8h9i0j1k2l', name: 'SpeedChecker', location: 'Singapore', status: 'online' },
    { id: 'npub8h9i0j1k2l3m', name: 'UptimeGuard', location: 'São Paulo, Brazil', status: 'online' }
  ];

  return (
    <div className="space-y-2">
      <Label>Network Operator</Label>
      <Popover open={openOperator} onOpenChange={setOpenOperator}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={openOperator}
            className="w-full justify-between"
          >
            {operator
              ? networkOperators.find((op) => op.id === operator)?.name
              : "Select operator..."}
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <Command>
            <CommandInput placeholder="Search operators..." />
            <CommandEmpty>No operator found.</CommandEmpty>
            <CommandGroup>
              <CommandList>
                {networkOperators.map((op) => (
                  <CommandItem
                    key={op.id}
                    value={op.id}
                    onSelect={(currentValue) => {
                      setOperator(currentValue === operator ? "" : currentValue);
                      setOpenOperator(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        operator === op.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex flex-col">
                      <span>{op.name}</span>
                      <span className="text-sm text-gray-500">{op.location}</span>
                    </div>
                  </CommandItem>
                ))}
              </CommandList>
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default NetworkOperatorSelector;
