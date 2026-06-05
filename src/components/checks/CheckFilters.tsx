
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { FilterX, ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Filters } from '@/types/check';

interface CheckFiltersProps {
  filters: Filters;
  onFilterChange: (key: keyof Filters, value: string) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
  uniqueOperators: string[];
  uniqueLocations: string[];
  uniqueStatusCodes: string[];
  uniqueNodeNames: string[];
}

const CheckFilters: React.FC<CheckFiltersProps> = ({
  filters,
  onFilterChange,
  onClearFilters,
  hasActiveFilters,
  uniqueOperators,
  uniqueLocations,
  uniqueStatusCodes,
  uniqueNodeNames
}) => {
  const [nodeDropdownOpen, setNodeDropdownOpen] = useState(false);
  const [operatorDropdownOpen, setOperatorDropdownOpen] = useState(false);

  return (
    <Card className="p-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        <div>
          <label className="text-xs font-medium mb-1 block">Status</label>
          <Select value={filters.status} onValueChange={(value) => onFilterChange('status', value)}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="running">Running</SelectItem>
              <SelectItem value="success">Success</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="warning">Warning</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-xs font-medium mb-1 block">URL</label>
          <Input
            value={filters.url}
            onChange={(e) => onFilterChange('url', e.target.value)}
            placeholder="Filter by URL"
            className="h-8 text-xs"
          />
        </div>

        <div>
          <label className="text-xs font-medium mb-1 block">Operator</label>
          <Popover open={operatorDropdownOpen} onOpenChange={setOperatorDropdownOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={operatorDropdownOpen}
                className="h-8 text-xs w-full justify-between font-normal"
              >
                {filters.operator || "Filter by operator"}
                <ChevronDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0" align="start">
              <Command>
                <CommandInput placeholder="Search operators..." className="h-8 text-xs" />
                <CommandEmpty>No operator found.</CommandEmpty>
                <CommandGroup>
                  <CommandList className="max-h-[200px]">
                    {filters.operator && (
                      <CommandItem
                        value=""
                        onSelect={() => {
                          onFilterChange('operator', '');
                          setOperatorDropdownOpen(false);
                        }}
                        className="text-xs"
                      >
                        <Check
                          className={cn(
                            "mr-2 h-3 w-3",
                            !filters.operator ? "opacity-100" : "opacity-0"
                          )}
                        />
                        Clear selection
                      </CommandItem>
                    )}
                    {uniqueOperators.map((operatorName) => (
                      <CommandItem
                        key={operatorName}
                        value={operatorName}
                        onSelect={(currentValue) => {
                          onFilterChange('operator', currentValue === filters.operator ? '' : currentValue);
                          setOperatorDropdownOpen(false);
                        }}
                        className="text-xs"
                      >
                        <Check
                          className={cn(
                            "mr-2 h-3 w-3",
                            filters.operator === operatorName ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {operatorName}
                      </CommandItem>
                    ))}
                  </CommandList>
                </CommandGroup>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        <div>
          <label className="text-xs font-medium mb-1 block">Location</label>
          <Select value={filters.location} onValueChange={(value) => onFilterChange('location', value)}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="All locations" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All locations</SelectItem>
              {uniqueLocations.map(location => (
                <SelectItem key={location} value={location}>{location}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-xs font-medium mb-1 block">Status Code</label>
          <Select value={filters.statusCode} onValueChange={(value) => onFilterChange('statusCode', value)}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="All codes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All codes</SelectItem>
              {uniqueStatusCodes.map(code => (
                <SelectItem key={code} value={code}>{code}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-xs font-medium mb-1 block">Node</label>
          <Popover open={nodeDropdownOpen} onOpenChange={setNodeDropdownOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={nodeDropdownOpen}
                className="h-8 text-xs w-full justify-between font-normal"
              >
                {filters.node || "Filter by node"}
                <ChevronDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0" align="start">
              <Command>
                <CommandInput placeholder="Search nodes..." className="h-8 text-xs" />
                <CommandEmpty>No node found.</CommandEmpty>
                <CommandGroup>
                  <CommandList className="max-h-[200px]">
                    {filters.node && (
                      <CommandItem
                        value=""
                        onSelect={() => {
                          onFilterChange('node', '');
                          setNodeDropdownOpen(false);
                        }}
                        className="text-xs"
                      >
                        <Check
                          className={cn(
                            "mr-2 h-3 w-3",
                            !filters.node ? "opacity-100" : "opacity-0"
                          )}
                        />
                        Clear selection
                      </CommandItem>
                    )}
                    {uniqueNodeNames.map((nodeName) => (
                      <CommandItem
                        key={nodeName}
                        value={nodeName}
                        onSelect={(currentValue) => {
                          onFilterChange('node', currentValue === filters.node ? '' : currentValue);
                          setNodeDropdownOpen(false);
                        }}
                        className="text-xs"
                      >
                        <Check
                          className={cn(
                            "mr-2 h-3 w-3",
                            filters.node === nodeName ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {nodeName}
                      </CommandItem>
                    ))}
                  </CommandList>
                </CommandGroup>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {hasActiveFilters && (
        <div className="mt-3 pt-3 border-t">
          <Button
            onClick={onClearFilters}
            variant="outline"
            size="sm"
            className="flex items-center gap-1 text-xs"
          >
            <FilterX className="w-3 h-3" />
            Clear all filters
          </Button>
        </div>
      )}
    </Card>
  );
};

export default CheckFilters;
