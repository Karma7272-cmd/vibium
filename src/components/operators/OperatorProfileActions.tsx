
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const OperatorProfileActions: React.FC = () => {
  return (
    <Card className="dark:bg-card/40 dark:backdrop-blur-sm dark:border-border">
      <CardHeader className="pb-3 sm:pb-6">
        <CardTitle className="text-lg sm:text-2xl dark:text-foreground">Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        <Button className="w-full text-sm sm:text-base dark:border-border dark:text-foreground dark:hover:bg-accent" variant="outline">
          Follow Operator
        </Button>
        <Button className="w-full text-sm sm:text-base dark:border-border dark:text-foreground dark:hover:bg-accent" variant="outline">
          Send Message
        </Button>
        <Button className="w-full text-sm sm:text-base dark:border-border dark:text-foreground dark:hover:bg-accent" variant="outline">
          View All Nodes
        </Button>
      </CardContent>
    </Card>
  );
};

export default OperatorProfileActions;
