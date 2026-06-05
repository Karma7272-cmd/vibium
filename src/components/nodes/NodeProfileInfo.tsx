
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Globe, Clock, Wifi, User } from 'lucide-react';
import { NodeData } from '@/types/node';
import { OperatorData } from '@/types/operator';

interface NodeProfileInfoProps {
  node: NodeData;
  operator: OperatorData | null;
}

const NodeProfileInfo: React.FC<NodeProfileInfoProps> = ({ node, operator }) => {
  return (
    <Card className="dark:bg-card/40 dark:backdrop-blur-sm dark:border-border">
      <CardHeader>
        <CardTitle className="text-lg dark:text-foreground">Node Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Operator</label>
            <div className="flex items-center gap-2 mt-1">
              <User className="w-4 h-4 text-gray-400" />
              {operator ? (
                <Link 
                  to={`/operator/${node.operatorNpub}`}
                  className="text-primary hover:text-primary/80 transition-colors hover:underline"
                >
                  {operator.profile.display_name || operator.profile.name || 'Unknown Operator'}
                </Link>
              ) : (
                <span className="text-gray-500 dark:text-gray-400">Loading operator...</span>
              )}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">IP Address</label>
            <div className="flex items-center gap-2 mt-1">
              <Globe className="w-4 h-4 text-gray-400" />
              <span className="text-gray-900 dark:text-white">{node.ip}</span>
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Uptime</label>
            <div className="flex items-center gap-2 mt-1">
              <Clock className="w-4 h-4 text-gray-400" />
              <span className="text-gray-900 dark:text-white">{node.uptime}</span>
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Last Seen</label>
            <div className="flex items-center gap-2 mt-1">
              <Clock className="w-4 h-4 text-gray-400" />
              <span className="text-gray-900 dark:text-white">{node.lastSeen}</span>
            </div>
          </div>
          
          <div className="sm:col-span-2">
            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Network</label>
            <div className="flex items-center gap-2 mt-1">
              <Wifi className="w-4 h-4 text-gray-400" />
              <span className="text-gray-900 dark:text-white">Connected</span>
            </div>
          </div>
        </div>
        
        <div>
          <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Node Public Key</label>
          <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 break-all font-mono bg-gray-50 dark:bg-gray-800 p-2 rounded">
            {node.npub}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default NodeProfileInfo;
