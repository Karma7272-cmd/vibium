
import React from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Grid, List, Filter, Play, Pause } from 'lucide-react';
import { ViewMode } from '@/types/check';

interface ChecksHeaderProps {
  viewMode: ViewMode;
  showFilters: boolean;
  isLivePlaying: boolean;
  gridColumns?: number;
  onViewModeChange: (mode: ViewMode) => void;
  onFiltersToggle: () => void;
  onLiveToggle: () => void;
  onGridColumnsChange?: (columns: number) => void;
}

const ChecksHeader: React.FC<ChecksHeaderProps> = ({
  viewMode,
  showFilters,
  isLivePlaying,
  gridColumns = 6,
  onViewModeChange,
  onFiltersToggle,
  onLiveToggle,
  onGridColumnsChange
}) => {
  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-1">
        <Button
          variant={showFilters ? 'default' : 'outline'}
          size="sm"
          onClick={onFiltersToggle}
          className="flex items-center gap-1 text-xs px-2"
        >
          <Filter className="w-3 h-3" />
          <span className="hidden sm:inline">Filter</span>
        </Button>
        <Button
          variant={isLivePlaying ? 'default' : 'outline'}
          size="sm"
          onClick={onLiveToggle}
          className="flex items-center gap-1 text-xs px-2"
        >
          {isLivePlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
          <span className="hidden sm:inline">{isLivePlaying ? 'Pause' : 'Live'}</span>
        </Button>
        <Button
          variant={viewMode === 'list' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onViewModeChange('list')}
          className="flex items-center gap-1 text-xs px-2"
        >
          <List className="w-3 h-3" />
          <span className="hidden sm:inline">List</span>
        </Button>
        <Button
          variant={viewMode === 'grid' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onViewModeChange('grid')}
          className="flex items-center gap-1 text-xs px-2"
        >
          <Grid className="w-3 h-3" />
          <span className="hidden sm:inline">Grid</span>
        </Button>
      </div>
      
      {viewMode === 'grid' && onGridColumnsChange && (
        <div className="flex items-center gap-2 min-w-[120px]">
          <span className="text-xs text-gray-600 dark:text-gray-300 whitespace-nowrap">Size:</span>
          <Slider
            value={[gridColumns]}
            onValueChange={(value) => onGridColumnsChange(value[0])}
            min={1}
            max={12}
            step={1}
            className="w-20"
          />
          <span className="text-xs text-gray-500 dark:text-gray-400 w-6">{gridColumns}</span>
        </div>
      )}
    </div>
  );
};

export default ChecksHeader;
