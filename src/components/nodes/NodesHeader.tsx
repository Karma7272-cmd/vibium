
import React from 'react';
import { Server } from 'lucide-react';

const NodesHeader: React.FC = () => {
  return (
    <div className="mb-4 sm:mb-6">
      <div className="flex items-center space-x-3 mb-2">
        <Server className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-foreground">Network Nodes</h1>
      </div>
      <p className="text-sm sm:text-base text-gray-600 dark:text-muted-foreground">
        Monitor and manage nodes across the global network
      </p>
    </div>
  );
};

export default NodesHeader;
