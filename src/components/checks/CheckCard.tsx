import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Check } from '@/types/check';
import { getStatusIcon, getStatusColor } from '@/utils/checkHelpers';
import { 
  Calendar,
  Clock,
  Globe,
  User,
  Monitor
} from 'lucide-react';

interface CheckCardProps {
  check: Check;
  variant: 'list' | 'grid';
}

const CheckCard: React.FC<CheckCardProps> = ({ check, variant }) => {
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const formatDuration = (duration: number, status: string) => {
    if (status === 'running') return 'Running...';
    return `${duration}ms`;
  };

  // Fallback placeholder image
  const fallbackImage = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMTgiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5TY3JlZW5zaG90PC90ZXh0Pjwvc3ZnPg==';

  if (variant === 'grid') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Link 
              to={`/check/${check.id}`}
              className="block transition-all duration-200 hover:scale-105"
            >
              <Card className="p-1 h-full flex flex-col hover:shadow-md transition-shadow relative">
                {/* Screenshot thumbnail */}
                <div className="relative">
                  <AspectRatio ratio={16 / 10}>
                    <img
                      src={check.screenshot}
                      alt={`Screenshot of ${check.url}`}
                      className="w-full h-full object-cover rounded border"
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.src = fallbackImage;
                      }}
                    />
                  </AspectRatio>
                  {/* Status icon overlay */}
                  <div className="absolute top-1 left-1">
                    {getStatusIcon(check.status)}
                  </div>
                </div>
              </Card>
            </Link>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-64">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-medium text-sm truncate" title={check.url}>
                  {check.url}
                </h3>
                <Badge 
                  className={`text-xs ${getStatusColor(check.status)}`}
                  variant="outline"
                >
                  {check.status === 'running' ? 'Running' : check.statusCode}
                </Badge>
              </div>
              <div className="space-y-1 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <User className="w-3 h-3" />
                  <span className="truncate">{check.operatorName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Globe className="w-3 h-3" />
                  <span className="truncate">{check.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-3 h-3" />
                  <span>{formatDuration(check.duration, check.status)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-3 h-3" />
                  <span>{formatTimestamp(check.timestamp)}</span>
                </div>
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // List variant
  return (
    <Link 
      to={`/check/${check.id}`}
      className="block transition-all duration-200"
    >
      <Card className="p-4 hover:shadow-md transition-all duration-200 hover:bg-card/80 dark:hover:bg-card/60">
        <div className="flex items-center gap-4">
          {/* Screenshot thumbnail */}
          <div className="relative flex-shrink-0 w-24">
            <AspectRatio ratio={16 / 10}>
              <img
                src={check.screenshot}
                alt={`Screenshot of ${check.url}`}
                className="w-full h-full object-cover rounded border"
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.src = fallbackImage;
                }}
              />
            </AspectRatio>
            {/* Status icon overlay */}
            <div className="absolute top-1 left-1">
              {getStatusIcon(check.status)}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <h3 className="font-semibold text-lg truncate text-foreground dark:text-foreground hover:text-primary dark:hover:text-primary transition-colors">
                  {check.url}
                </h3>
                <Badge className={getStatusColor(check.status)}>
                  {check.status === 'running' ? 'Running' : check.statusCode}
                </Badge>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <User className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{check.operatorName}</span>
              </div>
              
              <div className="flex items-center gap-2 text-muted-foreground">
                <Monitor className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{check.nodeName}</span>
              </div>
              
              <div className="flex items-center gap-2 text-muted-foreground">
                <Globe className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{check.location}</span>
              </div>
              
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="w-4 h-4 flex-shrink-0" />
                <span>{formatDuration(check.duration, check.status)}</span>
              </div>
              
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{formatTimestamp(check.timestamp)}</span>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
};

export default CheckCard;
