import { useState, useEffect, useMemo } from 'react';
import { NodeListItem } from '@/types/node';
import { NodeService } from '@/services/nodeService';

export interface UseNodesListReturn {
  allNodes: NodeListItem[];
  filteredNodes: NodeListItem[];
  uniqueLocations: string[];
  uniqueOperators: string[];
  onlineNodesCount: number;
  offlineNodesCount: number;
  maintenanceNodesCount: number;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useNodesList = (
  searchTerm: string,
  statusFilter: string,
  locationFilter: string,
  operatorFilter: string
): UseNodesListReturn => {
  const [allNodes, setAllNodes] = useState<NodeListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNodes = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const nodesData = await NodeService.fetchNodesList();
      setAllNodes(nodesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch nodes');
      console.error('Error fetching nodes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNodes();
  }, []);

  // Get unique locations for filter
  const uniqueLocations = useMemo(() => {
    const locations = allNodes
      .map(node => node.location)
      .filter(Boolean)
      .map(location => location.split(',').pop()?.trim())
      .filter((location, index, arr) => arr.indexOf(location) === index)
      .sort();
    return locations;
  }, [allNodes]);

  // Get unique operators for filter
  const uniqueOperators = useMemo(() => {
    const operatorNames = allNodes
      .map(node => node.operatorName)
      .filter(Boolean)
      .filter((name, index, arr) => arr.indexOf(name) === index)
      .sort();
    return operatorNames;
  }, [allNodes]);

  // Filter nodes based on search term, status, location, and operator
  const filteredNodes = useMemo(() => {
    return allNodes.filter(node => {
      const matchesSearch = searchTerm === '' || 
        node.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        node.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        node.os.toLowerCase().includes(searchTerm.toLowerCase()) ||
        node.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        node.bio?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || node.status === statusFilter;
      
      const matchesLocation = locationFilter === 'all' || 
        node.location?.toLowerCase().includes(locationFilter.toLowerCase());

      const matchesOperator = operatorFilter === 'all' || 
        node.operatorName === operatorFilter;

      return matchesSearch && matchesStatus && matchesLocation && matchesOperator;
    });
  }, [allNodes, searchTerm, statusFilter, locationFilter, operatorFilter]);

  const onlineNodesCount = useMemo(() => 
    allNodes.filter(node => node.status === 'online').length, 
    [allNodes]
  );

  const offlineNodesCount = useMemo(() => 
    allNodes.filter(node => node.status === 'offline').length, 
    [allNodes]
  );

  const maintenanceNodesCount = useMemo(() => 
    allNodes.filter(node => node.status === 'maintenance').length, 
    [allNodes]
  );

  const refetch = () => {
    fetchNodes();
  };

  return {
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
  };
};
