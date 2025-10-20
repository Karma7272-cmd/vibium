
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Monitor, Smartphone, Wifi, Globe, ExternalLink } from 'lucide-react';
import { Node } from '@/types/operator';
import { generateMockOperatorData } from '@/data/mockOperatorData';

interface OperatorProfileNodesProps {
  nodes: Node[];
  operatorNpub: string;
}

const OperatorProfileNodes: React.FC<OperatorProfileNodesProps> = ({ nodes, operatorNpub }) => {
  const navigate = useNavigate();

  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'Server':
        return <Monitor className="w-4 h-4" />;
      case 'Mobile':
        return <Smartphone className="w-4 h-4" />;
      case 'Router':
        return <Wifi className="w-4 h-4" />;
      default:
        return <Globe className="w-4 h-4" />;
    }
  };

  const getStatusBadge = (status: 'online' | 'offline' | 'maintenance') => {
    const variants = {
      online: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800',
      offline: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800',
      maintenance: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800'
    };

    return (
      <Badge className={`${variants[status]} border text-xs`}>
        {status}
      </Badge>
    );
  };

  const handleViewAll = () => {
    const operatorData = generateMockOperatorData(operatorNpub);
    const operatorName = operatorData.profile.name || operatorData.profile.display_name || 'Unknown';
    navigate(`/nodes?operator=${encodeURIComponent(operatorName)}`);
  };

  return (
    <Card className="dark:bg-card/40 dark:backdrop-blur-sm dark:border-border">
      <CardHeader className="pb-3 sm:pb-6">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg sm:text-2xl dark:text-foreground">
            Nodes ({nodes.length})
          </CardTitle>
          {nodes.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleViewAll}
              className="flex items-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              View All
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        {nodes.map((node) => (
          <div key={node.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-muted/20 rounded-lg">
            <div className="flex items-center space-x-2 min-w-0 flex-1">
              <div className="flex-shrink-0 text-gray-600 dark:text-muted-foreground">
                {getNodeIcon(node.type)}
              </div>
              <div className="min-w-0 flex-1">
                <a 
                  href={`/node/${operatorNpub}`}
                  className="font-medium text-primary hover:text-primary/80 hover:underline text-sm block truncate"
                >
                  {node.name}
                </a>
                <p className="text-xs text-gray-500 dark:text-muted-foreground truncate">
                  {node.location}
                </p>
              </div>
            </div>
            <div className="text-right flex-shrink-0 ml-2">
              {getStatusBadge(node.status)}
              <p className="text-xs text-gray-500 dark:text-muted-foreground mt-1">{node.uptime}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default OperatorProfileNodes;
