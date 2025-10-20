
import { useState, useEffect } from 'react';
import { NodeData } from '@/types/node';
import { OperatorData } from '@/types/operator';
import { NodeService } from '@/services/nodeService';
import { OperatorService } from '@/services/operatorService';

export interface UseNodeDataReturn {
  node: NodeData | null;
  operator: OperatorData | null;
  recentChecks: any[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useNodeData = (npub: string): UseNodeDataReturn => {
  const [node, setNode] = useState<NodeData | null>(null);
  const [operator, setOperator] = useState<OperatorData | null>(null);
  const [recentChecks, setRecentChecks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    if (!npub) return;

    try {
      setLoading(true);
      setError(null);
      
      const profileData = await NodeService.fetchNodeProfile(npub);
      
      setNode(profileData.node);
      setRecentChecks(profileData.recentChecks);

      // Fetch operator data if operatorNpub exists
      if (profileData.node.operatorNpub) {
        try {
          const operatorData = await OperatorService.fetchOperatorProfile(profileData.node.operatorNpub);
          setOperator(operatorData);
        } catch (operatorError) {
          console.error('Error fetching operator data:', operatorError);
          // Don't fail the whole request if operator fetch fails
          setOperator(null);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch node data');
      console.error('Error fetching node data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [npub]);

  const refetch = () => {
    fetchData();
  };

  return {
    node,
    operator,
    recentChecks,
    loading,
    error,
    refetch
  };
};
