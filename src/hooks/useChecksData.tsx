
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Check, Filters } from '@/types/check';
import { checkService } from '@/services/checkService';
import { ChecksURLParams } from '@/utils/urlParams';

export const useChecksData = (liveChecks: Check[] = [], urlParams?: ChecksURLParams) => {
  const [staticChecks, setStaticChecks] = useState<Check[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize filters from URL params, then localStorage, then defaults
  const [filters, setFilters] = useState<Filters>(() => {
    const defaultFilters = {
      status: 'all',
      url: '',
      operator: '',
      location: 'all',
      statusCode: 'all',
      node: ''
    };

    // If URL params exist, use them
    if (urlParams) {
      return {
        status: urlParams.status || defaultFilters.status,
        url: urlParams.url || defaultFilters.url,
        operator: urlParams.operator || defaultFilters.operator,
        location: urlParams.location || defaultFilters.location,
        statusCode: urlParams.statusCode || defaultFilters.statusCode,
        node: urlParams.node || defaultFilters.node
      };
    }

    // Otherwise, check localStorage
    const savedFilters = localStorage.getItem('checks-filters');
    if (savedFilters) {
      try {
        const parsed = JSON.parse(savedFilters);
        // Ensure node field exists in saved filters and migrate operator from 'all' to ''
        const migratedFilters = { 
          ...defaultFilters, 
          ...parsed,
          operator: parsed.operator === 'all' ? '' : (parsed.operator || '')
        };
        return migratedFilters;
      } catch {
        // If parsing fails, use defaults
      }
    }
    
    return defaultFilters;
  });

  // Load static checks from service
  useEffect(() => {
    const loadChecks = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const checks = await checkService.getChecks();
        setStaticChecks(checks);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load checks');
        console.error('Error loading checks:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadChecks();
  }, []);

  // Combine static checks with live checks, with live checks first
  const allChecks = useMemo(() => {
    return [...liveChecks, ...staticChecks];
  }, [liveChecks, staticChecks]);

  // Get unique values for filter dropdowns
  const uniqueOperators = useMemo(() => {
    if (!allChecks || allChecks.length === 0) return [];
    return [...new Set(allChecks.map(check => check.operatorName))].sort();
  }, [allChecks]);
  
  const uniqueLocations = useMemo(() => {
    if (!allChecks || allChecks.length === 0) return [];
    return [...new Set(allChecks.map(check => check.location))].sort();
  }, [allChecks]);

  const uniqueStatusCodes = useMemo(() => {
    if (!allChecks || allChecks.length === 0) return [];
    return [...new Set(allChecks.map(check => check.statusCode.toString()))].sort();
  }, [allChecks]);

  const uniqueNodeNames = useMemo(() => {
    if (!allChecks || allChecks.length === 0) return [];
    return [...new Set(allChecks.map(check => check.nodeName))].sort();
  }, [allChecks]);

  // Filter checks based on current filters
  const filteredChecks = useMemo(() => {
    if (!allChecks || allChecks.length === 0) return [];
    
    return allChecks.filter(check => {
      try {
        if (filters.status !== 'all' && check.status !== filters.status) return false;
        if (filters.url && !check.url.toLowerCase().includes(filters.url.toLowerCase())) return false;
        if (filters.operator && check.operatorName !== filters.operator) return false;
        if (filters.location !== 'all' && check.location !== filters.location) return false;
        if (filters.statusCode !== 'all' && check.statusCode.toString() !== filters.statusCode) return false;
        if (filters.node && !check.nodeName.toLowerCase().includes(filters.node.toLowerCase())) return false;
        return true;
      } catch (error) {
        console.error('Error filtering check:', error, check);
        return true;
      }
    });
  }, [allChecks, filters]);

  const clearAllFilters = useCallback(() => {
    const defaultFilters = {
      status: 'all',
      url: '',
      operator: '',
      location: 'all',
      statusCode: 'all',
      node: ''
    };
    setFilters(defaultFilters);
    localStorage.setItem('checks-filters', JSON.stringify(defaultFilters));
  }, []);

  const hasActiveFilters = useMemo(() => 
    filters.status !== 'all' || 
    filters.url !== '' || 
    filters.operator !== '' || 
    filters.location !== 'all' || 
    filters.statusCode !== 'all' ||
    filters.node !== '', 
    [filters]
  );

  const handleFilterChange = useCallback((key: keyof Filters, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    localStorage.setItem('checks-filters', JSON.stringify(newFilters));
  }, [filters]);

  const initializeFiltersFromURL = useCallback((urlParams: ChecksURLParams) => {
    const newFilters = {
      status: urlParams.status || 'all',
      url: urlParams.url || '',
      operator: urlParams.operator || '',
      location: urlParams.location || 'all',
      statusCode: urlParams.statusCode || 'all',
      node: urlParams.node || ''
    };
    setFilters(newFilters);
    localStorage.setItem('checks-filters', JSON.stringify(newFilters));
  }, []);

  return {
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
    staticChecks,
    initializeFiltersFromURL,
    isLoading,
    error
  };
};
