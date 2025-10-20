
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock } from 'lucide-react';

interface OperatorProfileStatsProps {
  yearsActive: number;
  completedChecks: number;
  activeNodes: number;
}

const OperatorProfileStats: React.FC<OperatorProfileStatsProps> = ({ 
  yearsActive, 
  completedChecks, 
  activeNodes 
}) => {
  return (
    <Card className="dark:bg-card/40 dark:backdrop-blur-sm dark:border-border">
      <CardHeader className="pb-3 sm:pb-4">
        <CardTitle className="text-lg sm:text-xl dark:text-foreground">Operator Stats</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Experience */}
          <div className="bg-gradient-to-r from-primary/10 to-accent/10 dark:from-primary/20 dark:to-accent/20 p-4 rounded-lg border border-primary/20 dark:border-primary/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-foreground">Experience</span>
              <Clock className="w-4 h-4 text-primary" />
            </div>
            <div className="flex items-center space-x-1">
              <span className="text-2xl font-bold text-gray-900 dark:text-foreground">{yearsActive}</span>
              <span className="text-sm text-gray-600 dark:text-muted-foreground">
                year{yearsActive !== 1 ? 's' : ''}
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-muted-foreground mt-1">Operating infrastructure</p>
          </div>

          {/* Completed Checks */}
          <div className="bg-gray-50 dark:bg-muted/20 p-4 rounded-lg border border-gray-200 dark:border-border">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-foreground">
                {completedChecks.toLocaleString()}
              </p>
              <p className="text-sm text-gray-600 dark:text-muted-foreground">Completed Checks</p>
            </div>
          </div>

          {/* Active Nodes */}
          <div className="bg-gray-50 dark:bg-muted/20 p-4 rounded-lg border border-gray-200 dark:border-border">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-foreground">{activeNodes}</p>
              <p className="text-sm text-gray-600 dark:text-muted-foreground">Active Nodes</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default OperatorProfileStats;
