
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import OperatorsHeader from './OperatorsHeader';

interface OperatorErrorStateProps {
  error: string;
  onRetry?: () => void;
  showHeader?: boolean;
}

const OperatorErrorState: React.FC<OperatorErrorStateProps> = ({ 
  error, 
  onRetry, 
  showHeader = false 
}) => {
  return (
    <>
      {showHeader && <OperatorsHeader />}
      <Card className="dark:bg-card/40 dark:backdrop-blur-sm dark:border-border">
        <CardContent className="p-6 text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          {onRetry && (
            <button 
              onClick={onRetry}
              className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
            >
              Try Again
            </button>
          )}
        </CardContent>
      </Card>
    </>
  );
};

export default OperatorErrorState;
