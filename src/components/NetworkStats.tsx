
import React from 'react';
import { Activity, Clock, CheckCircle, BarChart3 } from 'lucide-react';

const NetworkStats: React.FC = () => {
  const stats = [
    {
      label: 'Active Nodes',
      value: '847',
      change: '+12',
      icon: Activity,
      color: 'text-green-600 dark:text-green-400'
    },
    {
      label: 'Running Jobs',
      value: '23',
      change: '+5',
      icon: Clock,
      color: 'text-blue-600 dark:text-blue-400'
    },
    {
      label: 'Completed Today',
      value: '1,245',
      change: '+156',
      icon: CheckCircle,
      color: 'text-green-600 dark:text-green-400'
    },
    {
      label: 'Total Tests Run',
      value: '2.8M',
      change: '+1.2K',
      icon: BarChart3,
      color: 'text-blue-600 dark:text-blue-400'
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 lg:gap-6 mb-6 sm:mb-8 px-1 sm:px-0">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        
        return (
          <div key={index} className="bg-white dark:bg-card/40 dark:backdrop-blur-sm rounded-lg sm:rounded-xl p-2 sm:p-4 lg:p-6 border border-gray-100 dark:border-border shadow-sm hover:shadow-md transition-shadow duration-200 min-w-0">
            <div className="flex items-center justify-between mb-1 sm:mb-2 lg:mb-4">
              <Icon className={`w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 ${stat.color} flex-shrink-0`} />
              <span className={`text-xs font-medium px-1 py-0.5 sm:px-1.5 sm:py-0.5 lg:px-2 lg:py-1 rounded-full whitespace-nowrap ${
                stat.change.startsWith('+') ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
              }`}>
                {stat.change}
              </span>
            </div>
            
            <div className="min-w-0">
              <p className="text-lg sm:text-xl lg:text-3xl font-bold text-gray-900 dark:text-foreground mb-0.5 sm:mb-1 truncate">{stat.value}</p>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-muted-foreground truncate leading-tight">{stat.label}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default NetworkStats;
