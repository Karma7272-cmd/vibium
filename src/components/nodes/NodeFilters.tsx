
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Filter, Search, X, ChevronDown, Check, User } from 'lucide-react';

interface NodeFiltersProps {
  searchTerm: string;
  statusFilter: string;
  locationFilter: string;
  operatorFilter: string;
  uniqueLocations: (string | undefined)[];
  uniqueOperators: string[];
  filtersOpen: boolean;
  hasActiveFilters: boolean;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onLocationChange: (value: string) => void;
  onOperatorChange: (value: string) => void;
  onFiltersOpenChange: (open: boolean) => void;
  onClearFilters: () => void;
}

const NodeFilters: React.FC<NodeFiltersProps> = ({
  searchTerm,
  statusFilter,
  locationFilter,
  operatorFilter,
  uniqueLocations,
  uniqueOperators,
  filtersOpen,
  hasActiveFilters,
  onSearchChange,
  onStatusChange,
  onLocationChange,
  onOperatorChange,
  onFiltersOpenChange,
  onClearFilters
}) => {
  const [operatorOpen, setOperatorOpen] = useState(false);

  return (
    <Collapsible open={filtersOpen} onOpenChange={onFiltersOpenChange} className="mb-4 sm:mb-6">
      <Card>
        <CardContent className="p-3 sm:p-6">
          <div className="flex flex-col space-y-4">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="flex items-center justify-between p-0 h-auto hover:bg-transparent">
                <div className="flex items-center space-x-2">
                  <Filter className="w-4 h-4 text-gray-500" />
                  <h3 className="text-sm font-medium text-gray-700">Filters</h3>
                  {hasActiveFilters && (
                    <Badge variant="secondary" className="text-xs">
                      Active
                    </Badge>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  {hasActiveFilters && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={(e) => {
                        e.stopPropagation();
                        onClearFilters();
                      }}
                      className="text-xs text-gray-500 hover:text-gray-700 h-auto p-1"
                    >
                      <X className="w-3 h-3 mr-1" />
                      Clear
                    </Button>
                  )}
                  <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${filtersOpen ? 'rotate-180' : ''}`} />
                </div>
              </Button>
            </CollapsibleTrigger>
            
            <CollapsibleContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search nodes..."
                    value={searchTerm}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <Popover open={operatorOpen} onOpenChange={setOperatorOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={operatorOpen}
                      className="h-10 justify-between text-sm"
                    >
                      <div className="flex items-center">
                        <User className="mr-2 h-4 w-4 text-gray-400" />
                        {operatorFilter === 'all' ? 'All operators' : operatorFilter}
                      </div>
                      <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[250px] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search operators..." />
                      <CommandList>
                        <CommandEmpty>No operators found.</CommandEmpty>
                        <CommandGroup>
                          <CommandItem
                            value="all"
                            onSelect={() => {
                              onOperatorChange('all');
                              setOperatorOpen(false);
                            }}
                          >
                            <Check className={`mr-2 h-4 w-4 ${operatorFilter === 'all' ? 'opacity-100' : 'opacity-0'}`} />
                            All operators
                          </CommandItem>
                          {uniqueOperators.map((operator) => (
                            <CommandItem
                              key={operator}
                              value={operator}
                              onSelect={() => {
                                onOperatorChange(operator);
                                setOperatorOpen(false);
                              }}
                            >
                              <Check className={`mr-2 h-4 w-4 ${operatorFilter === operator ? 'opacity-100' : 'opacity-0'}`} />
                              {operator}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                        {operatorFilter !== 'all' && (
                          <CommandGroup>
                            <CommandItem
                              onSelect={() => {
                                onOperatorChange('all');
                                setOperatorOpen(false);
                              }}
                              className="text-red-600"
                            >
                              <X className="mr-2 h-4 w-4" />
                              Clear selection
                            </CommandItem>
                          </CommandGroup>
                        )}
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>

                <Select value={statusFilter} onValueChange={onStatusChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="online">Online</SelectItem>
                    <SelectItem value="offline">Offline</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={locationFilter} onValueChange={onLocationChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All locations</SelectItem>
                    {uniqueLocations.map(location => (
                      <SelectItem key={location} value={location || ''}>
                        {location}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CollapsibleContent>
          </div>
        </CardContent>
      </Card>
    </Collapsible>
  );
};

export default NodeFilters;
