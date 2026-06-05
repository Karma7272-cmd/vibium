
import React from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { OperatorListItem } from '@/services/operatorService';

interface OperatorCardProps {
  operator: OperatorListItem;
}

const OperatorCard: React.FC<OperatorCardProps> = ({ operator }) => {
  const getStatusBadge = (status: string) => {
    const variants = {
      online: 'bg-green-100 text-green-800 border-green-200',
      offline: 'bg-red-100 text-red-800 border-red-200',
      maintenance: 'bg-yellow-100 text-yellow-800 border-yellow-200'
    };

    return (
      <Badge className={`${variants[status as keyof typeof variants]} border text-xs`}>
        {status}
      </Badge>
    );
  };

  return (
    <div className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-white dark:bg-card/60 dark:border-border dark:backdrop-blur-sm">
      <div className="flex items-start space-x-3">
        <Avatar className="w-12 h-12">
          <AvatarImage src={operator.picture} alt={operator.name} />
          <AvatarFallback className="dark:bg-muted dark:text-foreground">
            {operator.name.split(' ').map(n => n[0]).join('')}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <Link 
            to={`/operator/${operator.npub}`}
            className="font-medium text-primary hover:text-primary/80 hover:underline block truncate"
          >
            {operator.name}
          </Link>
          <p className="text-sm text-gray-500 dark:text-muted-foreground truncate">@{operator.displayName}</p>
          <p className="text-sm text-gray-600 dark:text-muted-foreground mt-1 line-clamp-2">{operator.about}</p>
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center space-x-2">
              {getStatusBadge(operator.status)}
              <span className="text-xs text-gray-500 dark:text-muted-foreground">{operator.uptime}</span>
            </div>
            <div className="text-xs text-gray-500 dark:text-muted-foreground">
              {operator.nodesCount} node{operator.nodesCount !== 1 ? 's' : ''}
            </div>
          </div>
          {operator.location && (
            <p className="text-xs text-gray-500 dark:text-muted-foreground mt-1">{operator.location}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default OperatorCard;
