import React, { useEffect, useState } from 'react';
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import AppSidebar from '../components/AppSidebar';
import Footer from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, CheckCircle, XCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { realCheckService } from '@/services/realCheckService';
import { Check } from '@/types/check';
import { formatDistanceToNow } from 'date-fns';

const History: React.FC = () => {
  const [items, setItems] = useState<Check[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const checks = await realCheckService.getChecks();
      if (!cancelled) {
        setItems(checks);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4 text-emerald-500" />;
      case 'failed': return <XCircle className="h-4 w-4 text-destructive" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default: return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success': return <Badge variant="outline" className="text-emerald-500 border-emerald-500/30 text-xs">Success</Badge>;
      case 'failed': return <Badge variant="outline" className="text-destructive border-destructive/30 text-xs">Failed</Badge>;
      case 'warning': return <Badge variant="outline" className="text-yellow-500 border-yellow-500/30 text-xs">Warning</Badge>;
      case 'running': return <Badge variant="outline" className="text-blue-500 border-blue-500/30 text-xs">Running</Badge>;
      default: return <Badge variant="outline" className="text-xs">Unknown</Badge>;
    }
  };

  return (
    <div className="min-h-screen flex w-full bg-background dark:sunrise-gradient">
      <AppSidebar activeSection="history" onSectionChange={() => {}} />
      <SidebarInset className="flex-1 flex flex-col">
        <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border px-2 sm:px-4 bg-background/80 dark:bg-background/20 backdrop-blur-sm">
          <SidebarTrigger className="-ml-1" />
          <div className="ml-auto">
            <h1 className="text-lg sm:text-xl font-semibold text-foreground">History</h1>
          </div>
        </header>
        <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-4xl mx-auto space-y-6">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-1">History</h2>
              <p className="text-sm text-muted-foreground">
                {loading ? 'Loading…' : `${items.length} recent check${items.length === 1 ? '' : 's'}`}
              </p>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : items.length === 0 ? (
              <Card className="dark:bg-card/40 dark:backdrop-blur-sm">
                <CardContent className="p-8 text-center text-sm text-muted-foreground">
                  No checks yet. Run your first check to see it here.
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {items.map((item) => (
                  <Card key={item.id} className="dark:bg-card/40 dark:backdrop-blur-sm">
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(item.status)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{item.url}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
                            {item.duration ? ` · ${(item.duration / 1000).toFixed(2)}s` : ''}
                            {item.statusCode ? ` · ${item.statusCode}` : ''}
                            {item.nodeName && item.nodeName !== 'Unknown' ? ` · ${item.nodeName}` : ''}
                          </p>
                        </div>
                        <div className="hidden sm:block">
                          {getStatusBadge(item.status)}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
        <Footer />
      </SidebarInset>
    </div>
  );
};

export default History;
