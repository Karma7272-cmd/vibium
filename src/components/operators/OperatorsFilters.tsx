
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Search, Filter, X, ChevronDown, Check, User } from 'lucide-react';

interface OperatorsFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  locationFilter: string;
  setLocationFilter: (location: string) => void;
  operatorFilter: string;
  setOperatorFilter: (operator: string) => void;
  filtersOpen: boolean;
  setFiltersOpen: (open: boolean) => void;
  uniqueLocations: string[];
  uniqueOperators: string[];
  hasActiveFilters: boolean;
  clearFilters: () => void;
}

const OperatorsFilters: React.FC<OperatorsFiltersProps> = ({
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  locationFilter,
  setLocationFilter,
  operatorFilter,
  setOperatorFilter,
  filtersOpen,
  setFiltersOpen,
  uniqueLocations,
  uniqueOperators,
  hasActiveFilters,
  clearFilters
}) => {
  const [operatorOpen, setOperatorOpen] = useState(false);

  const handleFiltersOpenChange = (open: boolean) => {
    setFiltersOpen(open);
    localStorage.setItem('operators-filters-open', JSON.stringify(open));
  };

  return (
    <Collapsible open={filtersOpen} onOpenChange={handleFiltersOpenChange} className="mb-4 sm:mb-6">
      <Card className="dark:bg-card/40 dark:backdrop-blur-sm dark:border-border">
        <CardContent className="p-3 sm:p-6">
          <div className="flex flex-col space-y-4">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="flex items-center justify-between p-0 h-auto hover:bg-transparent dark:hover:bg-transparent">
                <div className="flex items-center space-x-2">
                  <Filter className="w-4 h-4 text-gray-500 dark:text-muted-foreground" />
                  <h3 className="text-sm font-medium text-gray-700 dark:text-foreground">Filters</h3>
                  {hasActiveFilters && (
                    <Badge variant="secondary" className="text-xs dark:bg-secondary/20 dark:text-foreground">
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
                        clearFilters();
                      }}
                      className="text-xs text-gray-500 dark:text-muted-foreground hover:text-gray-700 dark:hover:text-foreground h-auto p-1"
                    >
                      <X className="w-3 h-3 mr-1" />
                      Clear
                    </Button>
                  )}
                  <ChevronDown className={`w-4 h-4 text-gray-500 dark:text-muted-foreground transition-transform duration-200 ${filtersOpen ? 'rotate-180' : ''}`} />
                </div>
              </Button>
            </CollapsibleTrigger>
            
            <CollapsibleContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-muted-foreground" />
                  <Input
                    placeholder="Search operators..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 dark:bg-input dark:border-border dark:text-foreground"
                  />
                </div>

                {/* Operator Filter */}
                <Popover open={operatorOpen} onOpenChange={setOperatorOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={operatorOpen}
                      className="h-8 justify-between text-xs dark:bg-input dark:border-border dark:text-foreground"
                    >
                      <div className="flex items-center">
                        <User className="mr-2 h-3 w-3 text-gray-400 dark:text-muted-foreground" />
                        {operatorFilter === 'all' ? 'All operators' : operatorFilter}
                      </div>
                      <ChevronDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[250px] p-0 dark:bg-popover dark:border-border" align="start">
                    <Command className="dark:bg-popover">
                      <CommandInput placeholder="Search operators..." className="text-xs" />
                      <CommandList>
                        <CommandEmpty>No operators found.</CommandEmpty>
                        <CommandGroup>
                          <CommandItem
                            value="all"
                            onSelect={() => {
                              setOperatorFilter('all');
                              setOperatorOpen(false);
                            }}
                            className="text-xs"
                          >
                            <Check className={`mr-2 h-3 w-3 ${operatorFilter === 'all' ? 'opacity-100' : 'opacity-0'}`} />
                            All operators
                          </CommandItem>
                          {uniqueOperators.map((operator) => (
                            <CommandItem
                              key={operator}
                              value={operator}
                              onSelect={() => {
                                setOperatorFilter(operator);
                                setOperatorOpen(false);
                              }}
                              className="text-xs"
                            >
                              <Check className={`mr-2 h-3 w-3 ${operatorFilter === operator ? 'opacity-100' : 'opacity-0'}`} />
                              {operator}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                        {operatorFilter !== 'all' && (
                          <CommandGroup>
                            <CommandItem
                              onSelect={() => {
                                setOperatorFilter('all');
                                setOperatorOpen(false);
                              }}
                              className="text-xs text-red-600 dark:text-red-400"
                            >
                              <X className="mr-2 h-3 w-3" />
                              Clear selection
                            </CommandItem>
                          </CommandGroup>
                        )}
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>

                {/* Status Filter */}
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="dark:bg-input dark:border-border dark:text-foreground">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-popover dark:border-border">
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="online">Online</SelectItem>
                    <SelectItem value="offline">Offline</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                  </SelectContent>
                </Select>

                {/* Location Filter */}
                <Select value={locationFilter} onValueChange={setLocationFilter}>
                  <SelectTrigger className="dark:bg-input dark:border-border dark:text-foreground">
                    <SelectValue placeholder="Filter by location" />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-popover dark:border-border">
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

export default OperatorsFilters;
