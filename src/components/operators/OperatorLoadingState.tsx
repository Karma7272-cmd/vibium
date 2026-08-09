import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { LoadingState } from '@/components/ui/LoadingState';
import OperatorsHeader from './OperatorsHeader';

interface OperatorLoadingStateProps {
  message?: string;
  showHeader?: boolean;
}

const OperatorLoadingState: React.FC<OperatorLoadingStateProps> = ({ 
  message = 'Loading operators...', 
  showHeader = false 
}) => {
  return (
    <>
      {showHeader && <OperatorsHeader />}
      <Card className="dark:bg-card/40 dark:backdrop-blur-sm dark:border-border">
        <CardContent className="p-6 flex items-center justify-center">
          <LoadingState variant="bars" size="sm" message={message} />
        </CardContent>
      </Card>
    </>
  );
};

export default OperatorLoadingState;
