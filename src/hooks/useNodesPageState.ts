
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

export interface UseNodesPageStateReturn {
  currentPage: number;
  searchTerm: string;
  statusFilter: string;
  locationFilter: string;
  operatorFilter: string;
  filtersOpen: boolean;
  setCurrentPage: (page: number) => void;
  setSearchTerm: (term: string) => void;
  setStatusFilter: (filter: string) => void;
  setLocationFilter: (filter: string) => void;
  setOperatorFilter: (filter: string) => void;
  setFiltersOpen: (open: boolean) => void;
  clearFilters: () => void;
  hasActiveFilters: boolean;
}

export const useNodesPageState = (): UseNodesPageStateReturn => {
  const [searchParams] = useSearchParams();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');
  const [operatorFilter, setOperatorFilter] = useState('all');
  const [filtersOpen, setFiltersOpen] = useState(true);

  // Initialize filters from URL parameters on mount
  useEffect(() => {
    const operatorParam = searchParams.get('operator');
    if (operatorParam) {
      setOperatorFilter(decodeURIComponent(operatorParam));
    }

    const savedFiltersState = localStorage.getItem('nodes-filters-open');
    if (savedFiltersState !== null) {
      setFiltersOpen(JSON.parse(savedFiltersState));
    }
  }, [searchParams]);

  // Save filters state to localStorage when it changes
  const handleFiltersOpenChange = (open: boolean) => {
    setFiltersOpen(open);
    localStorage.setItem('nodes-filters-open', JSON.stringify(open));
  };

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, locationFilter, operatorFilter]);

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setLocationFilter('all');
    setOperatorFilter('all');
  };

  const hasActiveFilters = searchTerm !== '' || statusFilter !== 'all' || locationFilter !== 'all' || operatorFilter !== 'all';

  return {
    currentPage,
    searchTerm,
    statusFilter,
    locationFilter,
    operatorFilter,
    filtersOpen,
    setCurrentPage,
    setSearchTerm,
    setStatusFilter,
    setLocationFilter,
    setOperatorFilter,
    setFiltersOpen: handleFiltersOpenChange,
    clearFilters,
    hasActiveFilters
  };
};
