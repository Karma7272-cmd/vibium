import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Clock, ExternalLink } from 'lucide-react';
import { NodeData } from '@/types/node';

interface NodeRecentChecksProps {
  node: NodeData;
  recentChecks?: any[];
}

const NodeRecentChecks: React.FC<NodeRecentChecksProps> = ({ node, recentChecks = [] }) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      success: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800',
      failed: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800'
    };

    return (
      <Badge className={`${variants[status as keyof typeof variants]} border text-xs`}>
        {status}
      </Badge>
    );
  };

  // Generate the URL with node filter
  const nodeFilterUrl = `/checks?node=${encodeURIComponent(node.profile.display_name || node.profile.name || '')}`;

  return (
    <Card className="dark:bg-card/40 dark:backdrop-blur-sm dark:border-border">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg dark:text-foreground">Recent Checks</CardTitle>
        <Button variant="outline" size="sm" className="dark:border-border dark:text-foreground dark:hover:bg-accent" asChild>
          <Link to={nodeFilterUrl}>
            View All
            <ExternalLink className="w-4 h-4 ml-2" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentChecks.map((check) => (
            <Link 
              key={check.id} 
              to={`/check/${check.id}`}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-card/60 rounded-lg border dark:border-border hover:bg-gray-100 dark:hover:bg-card/80 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                {getStatusIcon(check.status)}
                <div>
                  <p className="font-medium text-gray-900 dark:text-white text-sm">{check.type}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-300 truncate max-w-[200px]">{check.url}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-xs text-gray-500 dark:text-gray-400">{check.duration}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{check.timestamp}</p>
                </div>
                {getStatusBadge(check.status)}
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default NodeRecentChecks;
