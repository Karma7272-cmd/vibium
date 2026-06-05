
import { useState, useEffect } from 'react';
import { OperatorData, NostrPost, Node } from '@/types/operator';
import { OperatorService } from '@/services/operatorService';

export interface UseOperatorDataReturn {
  operator: OperatorData | null;
  posts: NostrPost[];
  nodes: Node[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useOperatorData = (npub: string): UseOperatorDataReturn => {
  const [operator, setOperator] = useState<OperatorData | null>(null);
  const [posts, setPosts] = useState<NostrPost[]>([]);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    if (!npub) return;

    try {
      setLoading(true);
      setError(null);
      
      const profileData = await OperatorService.fetchFullOperatorProfile(npub);
      
      setOperator(profileData.operator);
      setPosts(profileData.posts);
      setNodes(profileData.nodes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch operator data');
      console.error('Error fetching operator data:', err);
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
    operator,
    posts,
    nodes,
    loading,
    error,
    refetch
  };
};
