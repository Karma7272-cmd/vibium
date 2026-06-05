
import React from 'react';
import { ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const RunNodeSupport: React.FC = () => {
  return (
    <Card className="dark:bg-card/40 dark:backdrop-blur-sm dark:border-border">
      <CardHeader>
        <CardTitle className="dark:text-foreground">Need Help?</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-gray-600 dark:text-muted-foreground">
          Our team is here to help you get started. Reach out if you have questions about 
          hardware requirements, setup process, or network operations.
        </p>
        <div className="flex flex-wrap gap-4">
          <Button variant="outline" className="dark:border-border dark:hover:bg-accent/20">
            <ExternalLink className="h-4 w-4 mr-2" />
            Documentation
          </Button>
          <Button variant="outline" className="dark:border-border dark:hover:bg-accent/20">
            <ExternalLink className="h-4 w-4 mr-2" />
            Support Forum
          </Button>
          <Button variant="outline" className="dark:border-border dark:hover:bg-accent/20">
            <ExternalLink className="h-4 w-4 mr-2" />
            Contact Support
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default RunNodeSupport;
