
import React from 'react';
import { Monitor } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const RunNodeHeader: React.FC = () => {
  return (
    <>
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-foreground mb-2">Run a Node</h1>
        <p className="text-lg text-gray-600 dark:text-muted-foreground">
          Join the Vibium Network as an Operator and help provide global testing services
        </p>
      </div>

      <Alert className="mb-8 border-primary/30 dark:border-primary/30 bg-primary/10 dark:bg-primary/10 dark:backdrop-blur-sm">
        <Monitor className="h-4 w-4 text-primary dark:text-primary" />
        <AlertDescription className="text-primary/80 dark:text-foreground">
          As a Network Operator, you'll run tests for websites and applications, earning rewards 
          while contributing to a global testing infrastructure.
        </AlertDescription>
      </Alert>
    </>
  );
};

export default RunNodeHeader;
