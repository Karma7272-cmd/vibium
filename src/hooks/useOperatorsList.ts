
import { useState, useEffect, useMemo } from 'react';
import { OperatorData } from '@/types/operator';
import { OperatorService, OperatorListItem } from '@/services/operatorService';

export interface UseOperatorsListReturn {
  allOperators: OperatorListItem[];
  filteredOperators: OperatorListItem[];
  uniqueLocations: string[];
  uniqueOperators: string[];
  onlineOperatorsCount: number;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useOperatorsList = (
  searchTerm: string,
  statusFilter: string,
  locationFilter: string,
  operatorFilter: string
): UseOperatorsListReturn => {
  const [allOperators, setAllOperators] = useState<OperatorListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOperators = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const operatorsData = await OperatorService.fetchOperatorsList();
      setAllOperators(operatorsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch operators');
      console.error('Error fetching operators:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOperators();
  }, []);

  // Get unique locations for filter
  const uniqueLocations = useMemo(() => {
    const locations = allOperators
      .map(op => op.location)
      .filter(Boolean)
      .map(location => location.split(',').pop()?.trim())
      .filter((location, index, arr) => arr.indexOf(location) === index)
      .sort();
    return locations;
  }, [allOperators]);

  // Get unique operators for filter
  const uniqueOperators = useMemo(() => {
    const operators = allOperators
      .map(op => op.name)
      .filter(Boolean)
      .filter((name, index, arr) => arr.indexOf(name) === index)
      .sort();
    return operators;
  }, [allOperators]);

  // Filter operators based on search term, status, location, and operator
  const filteredOperators = useMemo(() => {
    return allOperators.filter(operator => {
      const matchesSearch = searchTerm === '' || 
        operator.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        operator.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        operator.about.toLowerCase().includes(searchTerm.toLowerCase()) ||
        operator.location?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || operator.status === statusFilter;
      
      const matchesLocation = locationFilter === 'all' || 
        operator.location?.toLowerCase().includes(locationFilter.toLowerCase());

      const matchesOperator = operatorFilter === 'all' || operator.name === operatorFilter;

      return matchesSearch && matchesStatus && matchesLocation && matchesOperator;
    });
  }, [allOperators, searchTerm, statusFilter, locationFilter, operatorFilter]);

  const onlineOperatorsCount = useMemo(() => 
    allOperators.filter(op => op.status === 'online').length, 
    [allOperators]
  );

  const refetch = () => {
    fetchOperators();
  };

  return {
    allOperators,
    filteredOperators,
    uniqueLocations,
    uniqueOperators,
    onlineOperatorsCount,
    loading,
    error,
    refetch
  };
};
