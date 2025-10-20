
import { useState, useEffect } from 'react';

export interface UseOperatorsPageStateReturn {
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

export const useOperatorsPageState = (): UseOperatorsPageStateReturn => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');
  const [operatorFilter, setOperatorFilter] = useState('all');
  const [filtersOpen, setFiltersOpen] = useState(true);

  // Load filters state from localStorage on mount
  useEffect(() => {
    const savedFiltersState = localStorage.getItem('operators-filters-open');
    if (savedFiltersState !== null) {
      setFiltersOpen(JSON.parse(savedFiltersState));
    }
  }, []);

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
    setFiltersOpen,
    clearFilters,
    hasActiveFilters
  };
};
