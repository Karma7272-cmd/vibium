import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import OperatorCard from './OperatorCard';
import { OperatorListItem } from '@/services/operatorService';

interface OperatorsGridProps {
  filteredOperators: OperatorListItem[];
  allOperatorsCount: number;
  currentOperators: OperatorListItem[];
  totalPages: number;
  currentPage: number;
  handlePageChange: (page: number) => void;
  hasActiveFilters: boolean;
  clearFilters: () => void;
}

const OperatorsGrid: React.FC<OperatorsGridProps> = ({
  filteredOperators,
  allOperatorsCount,
  currentOperators,
  totalPages,
  currentPage,
  handlePageChange,
  hasActiveFilters,
  clearFilters
}) => {
  return (
    <Card className="dark:bg-card/40 dark:backdrop-blur-sm dark:border-border">
      <CardHeader className="p-3 sm:p-6">
        <CardTitle className="text-lg sm:text-xl dark:text-foreground">
          Operators ({filteredOperators.length}
          {filteredOperators.length !== allOperatorsCount && ` of ${allOperatorsCount}`})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 sm:p-6">
        {filteredOperators.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-muted-foreground">No operators found matching your filters.</p>
            {hasActiveFilters && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={clearFilters}
                className="mt-2 dark:border-border dark:text-foreground dark:hover:bg-accent"
              >
                Clear filters
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {currentOperators.map((operator) => (
                <OperatorCard key={operator.npub} operator={operator} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                      className={`${currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'} dark:text-foreground dark:hover:bg-accent`}
                    />
                  </PaginationItem>
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <PaginationItem key={page}>
                      <PaginationLink
                        onClick={() => handlePageChange(page)}
                        isActive={currentPage === page}
                        className="cursor-pointer dark:text-foreground dark:hover:bg-accent"
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                      className={`${currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'} dark:text-foreground dark:hover:bg-accent`}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default OperatorsGrid;
