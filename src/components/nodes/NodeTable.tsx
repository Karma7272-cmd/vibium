
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Monitor, Smartphone, Wifi, Globe, Activity, Clock, X } from 'lucide-react';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

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

interface NodeTableProps {
  nodes: Node[];
  totalNodes: number;
  filteredCount: number;
  currentPage: number;
  totalPages: number;
  hasActiveFilters: boolean;
  onPageChange: (page: number) => void;
  onClearFilters: () => void;
}

const NodeTable: React.FC<NodeTableProps> = ({
  nodes,
  totalNodes,
  filteredCount,
  currentPage,
  totalPages,
  hasActiveFilters,
  onPageChange,
  onClearFilters,
}) => {
  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'Server':
        return <Monitor className="w-4 h-4 text-foreground dark:text-white" />;
      case 'Mobile':
        return <Smartphone className="w-4 h-4 text-foreground dark:text-white" />;
      case 'Router':
        return <Wifi className="w-4 h-4 text-foreground dark:text-white" />;
      default:
        return <Globe className="w-4 h-4 text-foreground dark:text-white" />;
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
    <div className="hidden lg:block">
      <Card className="dark:bg-card/40 dark:backdrop-blur-sm dark:border-border">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-xl dark:text-foreground">
            Network Nodes ({filteredCount}
            {filteredCount !== totalNodes && ` of ${totalNodes}`})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {nodes.length === 0 ? (
            <div className="text-center py-12">
              <Monitor className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No nodes found</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                {hasActiveFilters 
                  ? "No nodes match your current filters. Try adjusting your search criteria."
                  : "There are no nodes in the network yet."
                }
              </p>
              {hasActiveFilters && (
                <Button 
                  variant="outline" 
                  onClick={onClearFilters}
                  className="dark:border-border dark:text-foreground dark:hover:bg-accent"
                >
                  <X className="w-4 h-4 mr-2" />
                  Clear filters
                </Button>
              )}
            </div>
          ) : (
            <>
              {/* Grid layout updated to match Operators page breakpoints */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {nodes.map((node) => (
                  <div key={node.npub} className="border border-gray-200 dark:border-border rounded-lg p-4 hover:shadow-md transition-shadow bg-white dark:bg-card/60 dark:backdrop-blur-sm">
                    <div className="flex items-start space-x-3 mb-3">
                      <Avatar className="h-10 w-10 flex-shrink-0">
                        <AvatarImage src={node.profileImage} alt={node.name} />
                        <AvatarFallback className="bg-gray-100 dark:bg-gray-800">
                          {getNodeIcon(node.type)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <Link 
                          to={`/node/${node.npub}`}
                          className="font-medium text-primary hover:text-primary/80 dark:text-primary dark:hover:text-primary/80 hover:underline block truncate"
                        >
                          {node.name}
                        </Link>
                        <div className="flex items-center gap-2 mt-1">
                          {getNodeIcon(node.type)}
                          <span className="text-sm font-medium text-gray-900 dark:text-white truncate">{node.type}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-300">Status</span>
                        {getStatusBadge(node.status)}
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <img 
                          src={node.osImage} 
                          alt={node.os}
                          className="w-4 h-4 rounded object-cover flex-shrink-0"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300 font-medium truncate">{node.os}</span>
                      </div>
                      
                      <div className="text-sm text-gray-600 dark:text-gray-300">
                        <span className="truncate block">{node.location}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="mt-6">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                          className={`${currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'} dark:text-foreground dark:hover:bg-accent`}
                        />
                      </PaginationItem>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <PaginationItem key={page}>
                          <PaginationLink
                            onClick={() => onPageChange(page)}
                            isActive={currentPage === page}
                            className="cursor-pointer dark:text-foreground dark:hover:bg-accent"
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
                      <PaginationItem>
                        <PaginationNext
                          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                          className={`${currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'} dark:text-foreground dark:hover:bg-accent`}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default NodeTable;
