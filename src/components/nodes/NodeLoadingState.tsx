import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { LoadingState } from '@/components/ui/LoadingState';

interface NodeLoadingStateProps {
  message?: string;
}

const NodeLoadingState: React.FC<NodeLoadingStateProps> = ({ 
  message = 'Loading nodes...'
}) => {
  return (
    <Card className="dark:bg-card/40 dark:backdrop-blur-sm dark:border-border">
      <CardContent className="p-6 flex items-center justify-center">
        <LoadingState variant="bars" size="sm" message={message} />
      </CardContent>
    </Card>
  );
};

export default NodeLoadingState;
