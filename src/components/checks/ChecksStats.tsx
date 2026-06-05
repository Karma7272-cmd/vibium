
import React from 'react';
import { ViewMode } from '@/types/check';

interface ChecksStatsProps {
  viewMode: ViewMode;
  isLivePlaying: boolean;
  liveChecksCount: number;
  startIndex: number;
  endIndex: number;
  filteredChecksLength: number;
  allChecksLength: number;
  hasActiveFilters: boolean;
}

const ChecksStats: React.FC<ChecksStatsProps> = ({
  viewMode,
  isLivePlaying,
  liveChecksCount,
  startIndex,
  endIndex,
  filteredChecksLength,
  allChecksLength,
  hasActiveFilters
}) => {
  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Network Checks</h1>
        {isLivePlaying && (
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-red-500 font-medium">LIVE</span>
          </div>
        )}
      </div>
      <p className="text-gray-600 dark:text-gray-300 text-sm">
        {`${startIndex + 1}-${Math.min(endIndex, filteredChecksLength)} of ${filteredChecksLength}`}
        {hasActiveFilters && ` (filtered from ${allChecksLength})`}
        {isLivePlaying && liveChecksCount > 0 && ` • ${liveChecksCount} live checks`}
      </p>
    </div>
  );
};

export default ChecksStats;
