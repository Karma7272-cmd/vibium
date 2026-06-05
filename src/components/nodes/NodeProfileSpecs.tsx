
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Cpu, HardDrive, MemoryStick, Wifi } from 'lucide-react';

interface NodeSpecs {
  cpu: string;
  memory: string;
  storage: string;
  network: string;
}

interface NodeProfileSpecsProps {
  specs: NodeSpecs;
}

const NodeProfileSpecs: React.FC<NodeProfileSpecsProps> = ({ specs }) => {
  return (
    <Card className="dark:bg-card/40 dark:backdrop-blur-sm dark:border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg dark:text-foreground">Hardware Specifications</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-blue-500 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">CPU</p>
              <p className="text-sm text-gray-900 dark:text-white truncate">{specs.cpu}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <MemoryStick className="w-4 h-4 text-green-500 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Memory</p>
              <p className="text-sm text-gray-900 dark:text-white truncate">{specs.memory}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-purple-500 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Storage</p>
              <p className="text-sm text-gray-900 dark:text-white truncate">{specs.storage}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Wifi className="w-4 h-4 text-orange-500 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Network</p>
              <p className="text-sm text-gray-900 dark:text-white truncate">{specs.network}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default NodeProfileSpecs;
