
import React from 'react';
import { useParams } from 'react-router-dom';
import OperatorLayout from '@/components/operators/OperatorLayout';
import OperatorLoadingState from '@/components/operators/OperatorLoadingState';
import OperatorErrorState from '@/components/operators/OperatorErrorState';
import OperatorProfileHeader from '@/components/operators/OperatorProfileHeader';
import OperatorProfileStats from '@/components/operators/OperatorProfileStats';
import OperatorProfilePosts from '@/components/operators/OperatorProfilePosts';
import OperatorProfileNodes from '@/components/operators/OperatorProfileNodes';
import { useOperatorData } from '@/hooks/useOperatorData';

const OperatorProfile: React.FC = () => {
  const { npub } = useParams<{ npub: string }>();
  const { operator, posts, nodes, loading, error } = useOperatorData(npub || '');

  const breadcrumbItems = [
    { 
      label: operator?.profile.name || operator?.profile.display_name || 'Loading...', 
      isActive: true 
    }
  ];

  if (loading) {
    return (
      <OperatorLayout 
        breadcrumbItems={[{ label: 'Loading...', isActive: true }]}
        showNetworkBreadcrumb={false}
        operatorsIsActive={false}
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading operator profile...</p>
          </div>
        </div>
      </OperatorLayout>
    );
  }

  if (error || !operator) {
    return (
      <OperatorLayout 
        breadcrumbItems={[{ label: 'Error', isActive: true }]}
        showNetworkBreadcrumb={false}
        operatorsIsActive={false}
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <p className="text-red-500 mb-4">Failed to load operator profile</p>
            <p className="text-muted-foreground">{error}</p>
          </div>
        </div>
      </OperatorLayout>
    );
  }

  return (
    <OperatorLayout 
      breadcrumbItems={breadcrumbItems}
      showNetworkBreadcrumb={false}
      operatorsIsActive={false}
    >
      <div className="flex flex-col xl:grid xl:grid-cols-3 gap-4 sm:gap-6">
        {/* Profile Information */}
        <div className="xl:col-span-2 space-y-4 sm:space-y-6">
          <OperatorProfileHeader operator={operator} />
          <OperatorProfileStats 
            yearsActive={operator.yearsActive}
            completedChecks={operator.completedChecks}
            activeNodes={nodes.length}
          />
          <OperatorProfilePosts posts={posts} />
        </div>

        {/* Sidebar */}
        <div className="space-y-4 sm:space-y-6">
          <OperatorProfileNodes nodes={nodes} operatorNpub={operator.npub} />
        </div>
      </div>
    </OperatorLayout>
  );
};

export default OperatorProfile;
