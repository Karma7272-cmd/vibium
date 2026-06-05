
import React from 'react';
import { Download, Cpu, ExternalLink, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const RunNodeOptions: React.FC = () => {
  return (
    <div className="grid md:grid-cols-2 gap-8 mb-12">
      {/* Software Option - Coming Soon */}
      <Card className="border-2 border-gray-200 dark:border-border bg-gray-50 dark:bg-card/40 dark:backdrop-blur-sm opacity-75 relative">
        <Badge 
          variant="secondary" 
          className="absolute top-4 right-4 bg-primary/20 dark:bg-primary/20 text-primary dark:text-primary border-primary/30 dark:border-primary/30"
        >
          <Clock className="h-3 w-3 mr-1" />
          Coming Soon
        </Badge>
        <CardHeader>
          <div className="flex items-center space-x-3">
            <Download className="h-8 w-8 text-gray-400 dark:text-muted-foreground" />
            <div>
              <CardTitle className="text-xl text-gray-500 dark:text-muted-foreground">Vibium Studio</CardTitle>
              <CardDescription className="text-gray-400 dark:text-muted-foreground/80">Software Solution</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-500 dark:text-muted-foreground">
            Download and install our Electron app on your computer to start running tests immediately.
          </p>
          
          <div className="space-y-2">
            <h4 className="font-semibold text-gray-600 dark:text-muted-foreground">System Requirements:</h4>
            <ul className="text-sm text-gray-500 dark:text-muted-foreground/80 space-y-1">
              <li>• Windows 10+, macOS 10.14+, or Linux</li>
              <li>• 4GB RAM minimum (8GB recommended)</li>
              <li>• 2GB available disk space</li>
              <li>• Stable internet connection</li>
            </ul>
          </div>

          <Button className="w-full mt-4" disabled variant="secondary">
            <Download className="h-4 w-4 mr-2" />
            Coming Soon
          </Button>
          
          <p className="text-xs text-gray-500 dark:text-muted-foreground/80 text-center mt-2">
            Join our waitlist to be notified when available
          </p>
        </CardContent>
      </Card>

      {/* Hardware Option */}
      <Card className="border-2 hover:border-primary/50 dark:hover:border-primary/50 dark:bg-card/40 dark:backdrop-blur-sm dark:border-border transition-colors">
        <CardHeader>
          <div className="flex items-center space-x-3">
            <Cpu className="h-8 w-8 text-primary dark:text-primary" />
            <div>
              <CardTitle className="text-xl dark:text-foreground">Valet Hardware</CardTitle>
              <CardDescription className="dark:text-muted-foreground">Dedicated Devices</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600 dark:text-muted-foreground">
            Get dedicated testing hardware for professional operations and maximum reliability.
          </p>
          
          <div className="space-y-3">
            <div className="border dark:border-border rounded-lg p-3 dark:bg-card/20">
              <h5 className="font-medium text-gray-900 dark:text-foreground">Valet Link</h5>
              <p className="text-sm text-gray-600 dark:text-muted-foreground">Compact testing unit for basic operations</p>
            </div>
            <div className="border dark:border-border rounded-lg p-3 dark:bg-card/20">
              <h5 className="font-medium text-gray-900 dark:text-foreground">Valet Vision</h5>
              <p className="text-sm text-gray-600 dark:text-muted-foreground">Advanced unit with visual testing capabilities</p>
            </div>
          </div>

          <Button variant="outline" className="w-full mt-4 dark:border-border dark:hover:bg-accent/20">
            <ExternalLink className="h-4 w-4 mr-2" />
            Visit Tapster Robotics
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default RunNodeOptions;
