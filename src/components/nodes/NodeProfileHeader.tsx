
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Monitor, Smartphone, Wifi, Globe, Activity, Clock, MapPin } from 'lucide-react';
import { NodeData } from '@/types/node';

interface NodeProfileHeaderProps {
  node: NodeData;
}

const NodeProfileHeader: React.FC<NodeProfileHeaderProps> = ({ node }) => {
  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'Server':
        return <Monitor className="w-6 h-6 text-gray-500 dark:text-gray-400" />;
      case 'Mobile':
        return <Smartphone className="w-6 h-6 text-gray-500 dark:text-gray-400" />;
      case 'Router':
        return <Wifi className="w-6 h-6 text-gray-500 dark:text-gray-400" />;
      default:
        return <Globe className="w-6 h-6 text-gray-500 dark:text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      online: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800',
      offline: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
      maintenance: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800'
    };

    const icons = {
      online: <Activity className="w-4 h-4" />,
      offline: <Activity className="w-4 h-4" />,
      maintenance: <Clock className="w-4 h-4" />
    };

    return (
      <Badge className={`${variants[status as keyof typeof variants]} border flex items-center gap-2`}>
        {icons[status as keyof typeof icons]}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <Card className="mb-6 dark:bg-card/40 dark:backdrop-blur-sm dark:border-border">
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <Avatar className="h-16 w-16 sm:h-20 sm:w-20">
            <AvatarImage src={node.profile.picture || node.osImage} alt={node.profile.display_name || node.profile.name} />
            <AvatarFallback className="bg-gray-100 dark:bg-gray-800">
              {getNodeIcon(node.type)}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                {node.profile.display_name || node.profile.name || 'Unknown Node'}
              </h1>
              {getStatusBadge(node.status)}
            </div>
            
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-300">
              <div className="flex items-center gap-1">
                {getNodeIcon(node.type)}
                <span>{node.type}</span>
              </div>
              
              <div className="flex items-center gap-1">
                <img 
                  src={node.osImage} 
                  alt={node.os}
                  className="w-4 h-4 rounded object-cover"
                />
                <span>{node.os}</span>
              </div>
              
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                <span>{node.location}</span>
              </div>
            </div>
            
            {(node.profile.about || node.bio) && (
              <p className="text-gray-700 dark:text-gray-300 mt-2">
                {node.profile.about || node.bio}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default NodeProfileHeader;
