
import React from 'react';
import OperatorLayout from '@/components/operators/OperatorLayout';
import OperatorsHeader from '@/components/operators/OperatorsHeader';
import OperatorsStats from '@/components/operators/OperatorsStats';
import OperatorsFilters from '@/components/operators/OperatorsFilters';
import OperatorsGrid from '@/components/operators/OperatorsGrid';
import OperatorLoadingState from '@/components/operators/OperatorLoadingState';
import OperatorErrorState from '@/components/operators/OperatorErrorState';
import { useOperatorsList } from '@/hooks/useOperatorsList';
import { useOperatorsPageState } from '@/hooks/useOperatorsPageState';

const Operators: React.FC = () => {
  const {
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
  } = useOperatorsPageState();

  const operatorsPerPage = 12;

  const {
    allOperators,
    filteredOperators,
    uniqueLocations,
    uniqueOperators,
    onlineOperatorsCount,
    loading,
    error,
    refetch
  } = useOperatorsList(searchTerm, statusFilter, locationFilter, operatorFilter);

  // Calculate pagination for filtered results
  const totalPages = Math.ceil(filteredOperators.length / operatorsPerPage);
  const startIndex = (currentPage - 1) * operatorsPerPage;
  const currentOperators = filteredOperators.slice(startIndex, startIndex + operatorsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (loading) {
    return (
      <OperatorLayout showNetworkBreadcrumb={true} operatorsIsActive={true}>
        <OperatorLoadingState showHeader />
      </OperatorLayout>
    );
  }

  if (error) {
    return (
      <OperatorLayout showNetworkBreadcrumb={true} operatorsIsActive={true}>
        <OperatorErrorState error={error} onRetry={refetch} showHeader />
      </OperatorLayout>
    );
  }

  return (
    <OperatorLayout showNetworkBreadcrumb={true} operatorsIsActive={true}>
      <OperatorsHeader />
      
      <OperatorsStats 
        totalOperators={allOperators.length}
        onlineOperators={onlineOperatorsCount}
      />

      <OperatorsFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        locationFilter={locationFilter}
        setLocationFilter={setLocationFilter}
        operatorFilter={operatorFilter}
        setOperatorFilter={setOperatorFilter}
        filtersOpen={filtersOpen}
        setFiltersOpen={setFiltersOpen}
        uniqueLocations={uniqueLocations}
        uniqueOperators={uniqueOperators}
        hasActiveFilters={hasActiveFilters}
        clearFilters={clearFilters}
      />

      <OperatorsGrid
        filteredOperators={filteredOperators}
        allOperatorsCount={allOperators.length}
        currentOperators={currentOperators}
        totalPages={totalPages}
        currentPage={currentPage}
        handlePageChange={handlePageChange}
        hasActiveFilters={hasActiveFilters}
        clearFilters={clearFilters}
      />
    </OperatorLayout>
  );
};

export default Operators;
