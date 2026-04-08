import React from 'react';
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import AppSidebar from '../components/AppSidebar';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, TrendingUp, Activity, Clock } from 'lucide-react';

const Analytics: React.FC = () => {
  const stats = [
    { label: 'Total Checks', value: '12,847', icon: Activity, change: '+12.5%' },
    { label: 'Avg Response Time', value: '234ms', icon: Clock, change: '-8.2%' },
    { label: 'Success Rate', value: '99.2%', icon: TrendingUp, change: '+0.3%' },
    { label: 'Active Nodes', value: '156', icon: BarChart3, change: '+5.1%' },
  ];

  return (
    <div className="min-h-screen flex w-full bg-background dark:sunrise-gradient">
      <AppSidebar activeSection="analytics" onSectionChange={() => {}} />
      <SidebarInset className="flex-1 flex flex-col">
        <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border px-2 sm:px-4 bg-background/80 dark:bg-background/20 backdrop-blur-sm">
          <SidebarTrigger className="-ml-1" />
          <div className="ml-auto">
            <h1 className="text-lg sm:text-xl font-semibold text-foreground">Analytics</h1>
          </div>
        </header>
        <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-6xl mx-auto space-y-6">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-1">Analytics</h2>
              <p className="text-sm text-muted-foreground">Monitor your network performance and usage</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {stats.map((stat) => {
                const Icon = stat.icon;
                return (
                  <Card key={stat.label} className="dark:bg-card/40 dark:backdrop-blur-sm">
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex items-center justify-between mb-2">
                        <Icon className="h-5 w-5 text-muted-foreground" />
                        <span className="text-xs text-emerald-500 font-medium">{stat.change}</span>
                      </div>
                      <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                      <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <Card className="dark:bg-card/40 dark:backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-foreground">Performance Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-48 sm:h-64 flex items-center justify-center text-muted-foreground border border-dashed border-border rounded-lg">
                  <div className="text-center">
                    <BarChart3 className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Charts coming soon</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        <Footer />
      </SidebarInset>
    </div>
  );
};

export default Analytics;
