
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
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
          <div className="flex items-center space-x-2">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span>{message}</span>
          </div>
        </CardContent>
      </Card>
    </>
  );
};

export default OperatorLoadingState;
