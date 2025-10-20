
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import CheckLayout from '@/components/checks/CheckLayout';
import CheckFilters from '@/components/checks/CheckFilters';
import CheckGrid from '@/components/checks/CheckGrid';
import CheckList from '@/components/checks/CheckList';
import ChecksHeader from '@/components/checks/ChecksHeader';
import ChecksStats from '@/components/checks/ChecksStats';
import ChecksPagination from '@/components/checks/ChecksPagination';
import { useChecksData } from '@/hooks/useChecksData';
import { useFirehose } from '@/hooks/useFirehose';
import { ViewMode } from '@/types/check';
import { parseURLParams, generateURLParams } from '@/utils/urlParams';

const Checks: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Parse initial state from URL parameters with localStorage fallbacks
  const urlParams = parseURLParams(searchParams);
  
  const [currentPage, setCurrentPage] = useState(() => {
    return urlParams.page || 1;
  });
  
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    return urlParams.view || (localStorage.getItem('checks-view-mode') as ViewMode) || 'grid';
  });
  
  const [gridColumns, setGridColumns] = useState(() => {
    return urlParams.size || (localStorage.getItem('checks-grid-columns') ? parseInt(localStorage.getItem('checks-grid-columns')!, 10) : 6);
  });
  
  const [showFilters, setShowFilters] = useState(() => {
    return urlParams.filters !== undefined ? urlParams.filters : (localStorage.getItem('checks-show-filters') === 'true');
  });
  
  const [activeSection, setActiveSection] = useState('checks');
  const checksPerPage = viewMode === 'grid' ? 50 : 20;
  
  const { isLivePlaying, liveChecks, toggleLiveStream, setIsLivePlaying } = useFirehose();
  
  // Initialize live stream state from URL
  useEffect(() => {
    if (urlParams.live !== undefined && urlParams.live !== isLivePlaying) {
      setIsLivePlaying(urlParams.live);
    }
  }, []);
  
  const {
    allChecks,
    filteredChecks,
    filters,
    uniqueOperators,
    uniqueLocations,
    uniqueStatusCodes,
    uniqueNodeNames,
    hasActiveFilters,
    handleFilterChange,
    clearAllFilters,
    initializeFiltersFromURL
  } = useChecksData(liveChecks, urlParams);

  const totalPages = Math.ceil(filteredChecks.length / checksPerPage);
  
  const startIndex = (currentPage - 1) * checksPerPage;
  const endIndex = startIndex + checksPerPage;
  const currentChecks = filteredChecks.slice(startIndex, endIndex);

  // Update URL when state changes
  const updateURL = (newState?: Partial<{
    viewMode: ViewMode;
    isLivePlaying: boolean;
    gridColumns: number;
    showFilters: boolean;
    currentPage: number;
  }>) => {
    const currentState = {
      viewMode,
      isLivePlaying,
      gridColumns,
      filters,
      showFilters,
      currentPage,
      ...newState
    };
    
    const urlString = generateURLParams(currentState);
    setSearchParams(urlString, { replace: true });
  };

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem('checks-view-mode', mode);
    updateURL({ viewMode: mode });
  };

  const handleGridColumnsChange = (columns: number) => {
    setGridColumns(columns);
    localStorage.setItem('checks-grid-columns', columns.toString());
    updateURL({ gridColumns: columns });
  };

  const handleFiltersToggle = () => {
    const newShowFilters = !showFilters;
    setShowFilters(newShowFilters);
    localStorage.setItem('checks-show-filters', String(newShowFilters));
    updateURL({ showFilters: newShowFilters });
  };

  const handleLiveToggle = () => {
    toggleLiveStream();
    updateURL({ isLivePlaying: !isLivePlaying });
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    updateURL({ currentPage: page });
  };

  // Update URL when filters change
  useEffect(() => {
    updateURL();
  }, [filters]);

  // Reset to first page when filters change
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [filters]);

  const renderContent = () => {
    if (viewMode === 'grid') {
      return <CheckGrid checks={currentChecks} columns={gridColumns} />;
    }
    
    return <CheckList checks={currentChecks} />;
  };

  return (
    <CheckLayout showNetworkBreadcrumb={true} checksIsActive={true}>
      <div className="w-full min-h-screen overflow-x-hidden bg-background dark:sunrise-gradient">
        <div className="container mx-auto p-3 max-w-full">
          <div className="mb-4">
            <div className="flex flex-col gap-3 mb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <ChecksStats
                  viewMode={viewMode}
                  isLivePlaying={isLivePlaying}
                  liveChecksCount={liveChecks.length}
                  startIndex={startIndex}
                  endIndex={endIndex}
                  filteredChecksLength={filteredChecks.length}
                  allChecksLength={allChecks.length}
                  hasActiveFilters={hasActiveFilters}
                />
                
                <ChecksHeader
                  viewMode={viewMode}
                  showFilters={showFilters}
                  isLivePlaying={isLivePlaying}
                  gridColumns={gridColumns}
                  onViewModeChange={handleViewModeChange}
                  onFiltersToggle={handleFiltersToggle}
                  onLiveToggle={handleLiveToggle}
                  onGridColumnsChange={handleGridColumnsChange}
                />
              </div>

              {showFilters && (
                <CheckFilters
                  filters={filters}
                  onFilterChange={handleFilterChange}
                  onClearFilters={clearAllFilters}
                  hasActiveFilters={hasActiveFilters}
                  uniqueOperators={uniqueOperators}
                  uniqueLocations={uniqueLocations}
                  uniqueStatusCodes={uniqueStatusCodes}
                  uniqueNodeNames={uniqueNodeNames}
                />
              )}
            </div>
          </div>

          <div className="mb-4 w-full">
            {renderContent()}
          </div>

          <ChecksPagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      </div>
    </CheckLayout>
  );
};

export default Checks;
