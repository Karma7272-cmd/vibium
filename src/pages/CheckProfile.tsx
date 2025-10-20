
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { isValidNeventId } from '@/utils/nostrEvents';
import { checkService } from '@/services/checkService';
import { Check } from '@/types/check';
import CheckLayout from '@/components/checks/CheckLayout';
import CheckProfileHeader from '@/components/checks/CheckProfileHeader';
import CheckProfileDetails from '@/components/checks/CheckProfileDetails';
import CheckProfileScreenshot from '@/components/checks/CheckProfileScreenshot';
import CheckProfileLogs from '@/components/checks/CheckProfileLogs';
import CheckLoadingState from '@/components/checks/CheckLoadingState';
import CheckErrorState from '@/components/checks/CheckErrorState';

const CheckProfile: React.FC = () => {
  const { checkId } = useParams<{ checkId: string }>();
  const [check, setCheck] = useState<Check | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCheck = async () => {
    if (!checkId) {
      setError('No check ID provided');
      setIsLoading(false);
      return;
    }

    // Validate nevent ID format
    if (!isValidNeventId(checkId)) {
      console.warn('Invalid nevent ID format:', checkId);
      // Continue anyway - in the future we'll support other ID formats
    }

    try {
      setIsLoading(true);
      setError(null);
      const checkData = await checkService.getCheckById(checkId);
      
      if (!checkData) {
        setError('Check not found');
      } else {
        setCheck(checkData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load check');
      console.error('Error loading check:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCheck();
  }, [checkId]);

  const getBreadcrumbItems = () => {
    if (isLoading) {
      return [{ label: 'Loading...', isActive: true }];
    }
    if (error || !check) {
      return [{ label: 'Error', isActive: true }];
    }
    return [{ label: check.url, isActive: true }];
  };

  const renderContent = () => {
    if (isLoading) {
      return <CheckLoadingState message="Loading check details..." />;
    }

    if (error) {
      return <CheckErrorState error={error} onRetry={loadCheck} />;
    }

    if (!check) {
      return <CheckErrorState error="Check not found" />;
    }

    return (
      <>
        <CheckProfileHeader check={check} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <CheckProfileDetails check={check} />
          <CheckProfileScreenshot check={check} />
        </div>

        <CheckProfileLogs check={check} />
      </>
    );
  };

  return (
    <CheckLayout 
      breadcrumbItems={getBreadcrumbItems()}
      showNetworkBreadcrumb={false}
      checksIsActive={false}
    >
      {renderContent()}
    </CheckLayout>
  );
};

export default CheckProfile;
