import React from 'react';
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import AppSidebar from '../components/AppSidebar';
import Footer from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const History: React.FC = () => {
  const historyItems = [
    { id: 1, url: 'https://example.com', status: 'success', time: '2 min ago', duration: '1.2s', statusCode: 200 },
    { id: 2, url: 'https://test.org', status: 'failed', time: '5 min ago', duration: '3.4s', statusCode: 500 },
    { id: 3, url: 'https://demo.app', status: 'warning', time: '12 min ago', duration: '2.1s', statusCode: 301 },
    { id: 4, url: 'https://api.service.io', status: 'success', time: '18 min ago', duration: '0.8s', statusCode: 200 },
    { id: 5, url: 'https://staging.dev', status: 'success', time: '25 min ago', duration: '1.5s', statusCode: 200 },
  ];

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
              <p className="text-sm text-muted-foreground">View your recent check history</p>
            </div>

            <div className="space-y-3">
              {historyItems.map((item) => (
                <Card key={item.id} className="dark:bg-card/40 dark:backdrop-blur-sm">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(item.status)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{item.url}</p>
                        <p className="text-xs text-muted-foreground">{item.time} · {item.duration} · {item.statusCode}</p>
                      </div>
                      <div className="hidden sm:block">
                        {getStatusBadge(item.status)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
        <Footer />
      </SidebarInset>
    </div>
  );
};

export default History;
