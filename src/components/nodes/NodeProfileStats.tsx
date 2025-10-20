
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, Clock, TrendingUp, Activity } from 'lucide-react';

interface NodeProfileStatsProps {
  totalChecks: number;
  successRate: string;
  avgResponseTime: string;
  uptime: string;
}

const NodeProfileStats: React.FC<NodeProfileStatsProps> = ({
  totalChecks,
  successRate,
  avgResponseTime,
  uptime
}) => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card className="dark:bg-card/40 dark:backdrop-blur-sm dark:border-border">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-8 h-8 text-blue-500" />
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalChecks.toLocaleString()}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Checks</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="dark:bg-card/40 dark:backdrop-blur-sm dark:border-border">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-green-500" />
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{successRate}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Success Rate</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="dark:bg-card/40 dark:backdrop-blur-sm dark:border-border">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Clock className="w-8 h-8 text-purple-500" />
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{avgResponseTime}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Avg Response</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="dark:bg-card/40 dark:backdrop-blur-sm dark:border-border">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Activity className="w-8 h-8 text-orange-500" />
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{uptime}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Uptime</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NodeProfileStats;
