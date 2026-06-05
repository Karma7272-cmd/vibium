
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Users, CheckCircle } from 'lucide-react';

interface OperatorsStatsProps {
  totalOperators: number;
  onlineOperators: number;
}

const OperatorsStats: React.FC<OperatorsStatsProps> = ({ totalOperators, onlineOperators }) => {
  return (
    <div className="grid grid-cols-2 gap-2 sm:gap-4 lg:gap-6 mb-4 sm:mb-6 px-1 sm:px-0">
      <Card className="dark:bg-card/40 dark:backdrop-blur-sm dark:border-border">
        <CardContent className="p-2 sm:p-4">
          <div className="flex items-center space-x-1 sm:space-x-2">
            <Users className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-gray-600 dark:text-muted-foreground truncate">Total Operators</p>
              <p className="text-lg sm:text-2xl font-bold truncate dark:text-foreground">{totalOperators}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card className="dark:bg-card/40 dark:backdrop-blur-sm dark:border-border">
        <CardContent className="p-2 sm:p-4">
          <div className="flex items-center space-x-1 sm:space-x-2">
            <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 dark:text-green-400 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-gray-600 dark:text-muted-foreground truncate">Online</p>
              <p className="text-lg sm:text-2xl font-bold truncate dark:text-foreground">{onlineOperators}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OperatorsStats;
