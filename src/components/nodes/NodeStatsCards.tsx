
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Globe } from 'lucide-react';

interface NodeStatsCardsProps {
  totalNodes: number;
  onlineNodes: number;
  offlineNodes: number;
  maintenanceNodes: number;
}

const NodeStatsCards: React.FC<NodeStatsCardsProps> = ({
  totalNodes,
  onlineNodes,
  offlineNodes,
  maintenanceNodes
}) => {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
      <Card className="dark:bg-card/60 dark:border-border">
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Total Nodes</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">{totalNodes}</p>
            </div>
            <Globe className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500 dark:text-blue-400" />
          </div>
        </CardContent>
      </Card>

      <Card className="dark:bg-card/60 dark:border-border">
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Online</p>
              <p className="text-lg sm:text-2xl font-bold text-green-600 dark:text-green-400">{onlineNodes}</p>
            </div>
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NodeStatsCards;
