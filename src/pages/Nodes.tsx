
import React, { useMemo } from 'react';
import NodeLayout from '@/components/nodes/NodeLayout';
import NodesHeader from '@/components/nodes/NodesHeader';
import NodeStatsCards from '@/components/nodes/NodeStatsCards';
import NodeFilters from '@/components/nodes/NodeFilters';
import NodeTable from '@/components/nodes/NodeTable';
import NodeMobileCards from '@/components/nodes/NodeMobileCards';
import NodeLoadingState from '@/components/nodes/NodeLoadingState';
import NodeErrorState from '@/components/nodes/NodeErrorState';
import { useNodesPageState } from '@/hooks/useNodesPageState';
import { useNodesList } from '@/hooks/useNodesList';

const Nodes: React.FC = () => {
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
  } = useNodesPageState();

  const {
    allNodes,
    filteredNodes,
    uniqueLocations,
    uniqueOperators,
    onlineNodesCount,
    offlineNodesCount,
    maintenanceNodesCount,
    loading,
    error,
    refetch
  } = useNodesList(searchTerm, statusFilter, locationFilter, operatorFilter);

  const nodesPerPage = 10;

  // Calculate pagination for filtered results
  const totalPages = Math.ceil(filteredNodes.length / nodesPerPage);
  const startIndex = (currentPage - 1) * nodesPerPage;
  const endIndex = startIndex + nodesPerPage;
  const currentNodes = filteredNodes.slice(startIndex, endIndex);

  if (loading) {
    return (
      <NodeLayout showNetworkBreadcrumb={true} nodesIsActive={true}>
        <NodesHeader />
        <NodeLoadingState />
      </NodeLayout>
    );
  }

  if (error) {
    return (
      <NodeLayout showNetworkBreadcrumb={true} nodesIsActive={true}>
        <NodesHeader />
        <NodeErrorState error={error} onRetry={refetch} />
      </NodeLayout>
    );
  }

  return (
    <NodeLayout showNetworkBreadcrumb={true} nodesIsActive={true}>
      {/* Header */}
      <NodesHeader />

      {/* Stats Cards */}
      <NodeStatsCards
        totalNodes={allNodes.length}
        onlineNodes={onlineNodesCount}
        offlineNodes={offlineNodesCount}
        maintenanceNodes={maintenanceNodesCount}
      />

      {/* Filters */}
      <NodeFilters
        searchTerm={searchTerm}
        statusFilter={statusFilter}
        locationFilter={locationFilter}
        operatorFilter={operatorFilter}
        uniqueLocations={uniqueLocations}
        uniqueOperators={uniqueOperators}
        filtersOpen={filtersOpen}
        hasActiveFilters={hasActiveFilters}
        onSearchChange={setSearchTerm}
        onStatusChange={setStatusFilter}
        onLocationChange={setLocationFilter}
        onOperatorChange={setOperatorFilter}
        onFiltersOpenChange={setFiltersOpen}
        onClearFilters={clearFilters}
      />

      {/* Mobile Card View */}
      <NodeMobileCards
        nodes={currentNodes}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={clearFilters}
      />

      {/* Desktop Table View */}
      <NodeTable
        nodes={currentNodes}
        totalNodes={allNodes.length}
        filteredCount={filteredNodes.length}
        currentPage={currentPage}
        totalPages={totalPages}
        hasActiveFilters={hasActiveFilters}
        onPageChange={setCurrentPage}
        onClearFilters={clearFilters}
      />
    </NodeLayout>
  );
};

export default Nodes;
