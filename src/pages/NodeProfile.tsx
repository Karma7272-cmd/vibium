
import React from 'react';
import { useParams } from 'react-router-dom';
import NodeLayout from '@/components/nodes/NodeLayout';
import NodeLoadingState from '@/components/nodes/NodeLoadingState';
import NodeErrorState from '@/components/nodes/NodeErrorState';
import NodeProfileHeader from '@/components/nodes/NodeProfileHeader';
import NodeProfileInfo from '@/components/nodes/NodeProfileInfo';
import NodeProfileSpecs from '@/components/nodes/NodeProfileSpecs';
import NodeProfileStats from '@/components/nodes/NodeProfileStats';
import NodeRecentChecks from '@/components/nodes/NodeRecentChecks';
import { useNodeData } from '@/hooks/useNodeData';

const NodeProfile: React.FC = () => {
  const { npub } = useParams<{ npub: string }>();
  const { node, operator, recentChecks, loading, error, refetch } = useNodeData(npub || '');

  if (loading) {
    return (
      <NodeLayout 
        breadcrumbItems={[{ label: 'Loading...', isActive: true }]}
        showNetworkBreadcrumb={false}
        nodesIsActive={false}
      >
        <NodeLoadingState message="Loading node profile..." />
      </NodeLayout>
    );
  }

  if (error || !node) {
    return (
      <NodeLayout 
        breadcrumbItems={[{ label: 'Error', isActive: true }]}
        showNetworkBreadcrumb={false}
        nodesIsActive={false}
      >
        <NodeErrorState 
          error={error || 'Node not found'} 
          onRetry={refetch} 
        />
      </NodeLayout>
    );
  }

  const breadcrumbItems = [
    { label: node.profile.display_name || node.profile.name || 'Unknown Node', isActive: true }
  ];

  return (
    <NodeLayout 
      breadcrumbItems={breadcrumbItems}
      showNetworkBreadcrumb={false}
      nodesIsActive={false}
    >
      {/* Header */}
      <NodeProfileHeader node={node} />

      {/* Stats Cards */}
      <NodeProfileStats 
        totalChecks={node.stats?.totalChecks || 1247}
        successRate={node.stats?.successRate || '98.7%'}
        avgResponseTime={node.stats?.avgResponseTime || '145ms'}
        uptime={node.uptime}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Node Information */}
        <div className="space-y-6">
          <NodeProfileInfo node={node} operator={operator} />
          <NodeProfileSpecs specs={node.specs} />
        </div>

        {/* Right Column - Recent Checks */}
        <div>
          <NodeRecentChecks node={node} recentChecks={recentChecks} />
        </div>
      </div>
    </NodeLayout>
  );
};

export default NodeProfile;
