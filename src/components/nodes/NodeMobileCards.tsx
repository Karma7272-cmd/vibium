
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Monitor, Smartphone, Wifi, Globe, Activity, Clock, X, MapPin } from 'lucide-react';

interface Node {
  name: string;
  type: string;
  os: string;
  osImage: string;
  profileImage: string;
  status: string;
  location: string;
  ip: string;
  uptime: string;
  lastSeen: string;
  npub: string;
}

interface NodeMobileCardsProps {
  nodes: Node[];
  hasActiveFilters: boolean;
  onClearFilters: () => void;
}

const NodeMobileCards: React.FC<NodeMobileCardsProps> = ({
  nodes,
  hasActiveFilters,
  onClearFilters,
}) => {
  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'Server':
        return <Monitor className="w-4 h-4 text-gray-500 dark:text-gray-400" />;
      case 'Mobile':
        return <Smartphone className="w-4 h-4 text-gray-500 dark:text-gray-400" />;
      case 'Router':
        return <Wifi className="w-4 h-4 text-gray-500 dark:text-gray-400" />;
      default:
        return <Globe className="w-4 h-4 text-gray-500 dark:text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      online: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800',
      offline: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
      maintenance: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800'
    };

    const icons = {
      online: <Activity className="w-3 h-3" />,
      offline: <Activity className="w-3 h-3" />,
      maintenance: <Clock className="w-3 h-3" />
    };

    return (
      <Badge className={`${variants[status as keyof typeof variants]} border flex items-center gap-1 text-xs`}>
        {icons[status as keyof typeof icons]}
        {status}
      </Badge>
    );
  };

  return (
    <div className="lg:hidden mb-6">
      <Card className="dark:bg-card/40 dark:backdrop-blur-sm dark:border-border">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg dark:text-foreground">Network Nodes ({nodes.length})</CardTitle>
        </CardHeader>
        <CardContent className="px-3 sm:px-6">
          {nodes.length === 0 ? (
            <div className="text-center py-8">
              <Monitor className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <h3 className="text-base font-medium text-gray-900 dark:text-white mb-2">No nodes found</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                {hasActiveFilters 
                  ? "No nodes match your filters."
                  : "No nodes available."
                }
              </p>
              {hasActiveFilters && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={onClearFilters}
                  className="dark:border-border dark:text-foreground dark:hover:bg-accent"
                >
                  <X className="w-4 h-4 mr-2" />
                  Clear filters
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {nodes.map((node) => (
                <div key={node.npub} className="border rounded-lg p-3 sm:p-4 bg-white dark:bg-card/60 dark:border-border space-y-3">
                  {/* Header with avatar, name and status */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <Avatar className="h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0">
                        <AvatarImage src={node.profileImage} alt={node.name} />
                        <AvatarFallback className="bg-gray-100 dark:bg-gray-800">
                          {getNodeIcon(node.type)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <Link 
                          to={`/node/${node.npub}`}
                          className="font-medium text-blue-600 dark:text-primary hover:text-blue-800 dark:hover:text-primary/80 hover:underline block truncate text-sm sm:text-base"
                        >
                          {node.name}
                        </Link>
                        <div className="flex items-center gap-2 text-xs sm:text-sm">
                          <div className="flex items-center gap-1 font-medium text-gray-900 dark:text-white">
                            {getNodeIcon(node.type)}
                            <span className="truncate">{node.type}</span>
                          </div>
                          <span className="text-gray-300 dark:text-gray-600">•</span>
                          <div className="flex items-center space-x-1 min-w-0">
                            <img 
                              src={node.osImage} 
                              alt={node.os}
                              className="w-3 h-3 sm:w-4 sm:h-4 rounded object-cover flex-shrink-0"
                            />
                            <span className="text-gray-700 dark:text-gray-300 font-medium truncate">{node.os}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      {getStatusBadge(node.status)}
                    </div>
                  </div>

                  {/* Location and Last Seen */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm">
                    <div className="min-w-0">
                      <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        <MapPin className="w-3 h-3 inline flex-shrink-0" />
                        Location:
                      </span>
                      <span className="text-gray-900 dark:text-white truncate block">{node.location}</span>
                    </div>
                    <div className="min-w-0">
                      <span className="text-gray-500 dark:text-gray-400">Last Seen:</span>
                      <span className="text-gray-900 dark:text-white truncate block">{node.lastSeen}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default NodeMobileCards;
