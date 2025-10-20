
import React from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Play,
  Calendar,
  Clock,
  Globe
} from 'lucide-react';

interface CheckProfileHeaderProps {
  check: {
    url: string;
    status: string;
    statusCode: number;
    timestamp: string;
    duration: number;
    location: string;
  };
}

const CheckProfileHeader: React.FC<CheckProfileHeaderProps> = ({ check }) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'running':
        return <Play className="w-5 h-5 text-primary" />;
      default:
        return <CheckCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'running':
        return 'bg-primary/10 text-primary border-primary/20';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="mb-6">
      <div className="flex items-start gap-3 mb-2">
        <div className="flex-shrink-0 mt-1">
          {getStatusIcon(check.status)}
        </div>
        <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-foreground break-all min-w-0 flex-1">{check.url}</h1>
        <div className="flex-shrink-0">
          <Badge className={getStatusColor(check.status)}>
            {check.status === 'running' ? 'Running' : check.statusCode}
          </Badge>
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-sm sm:text-base text-gray-600 dark:text-muted-foreground">
        <div className="flex items-center gap-1">
          <Calendar className="w-4 h-4 flex-shrink-0" />
          <span className="truncate">{new Date(check.timestamp).toLocaleString()}</span>
        </div>
        <div className="flex items-center gap-1">
          <Clock className="w-4 h-4 flex-shrink-0" />
          <span>{check.status === 'running' ? 'Running...' : `${check.duration}ms`}</span>
        </div>
        <div className="flex items-center gap-1">
          <Globe className="w-4 h-4 flex-shrink-0" />
          <span className="truncate">{check.location}</span>
        </div>
      </div>
    </div>
  );
};

export default CheckProfileHeader;
