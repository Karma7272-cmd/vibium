import React from 'react';
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import AppSidebar from '../components/AppSidebar';
import Footer from '../components/Footer';
import {
  Share2,
  Cloud,
  Zap,
  Triangle,
  Flame,
  Book,
  Mail,
  ListTodo,
  UserCheck,
  Server,
  ExternalLink,
  CheckCircle2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const CONNECTORS = [
  {
    id: 'netlify',
    name: 'Netlify',
    description: 'Deploy modern static websites and serverless functions.',
    icon: Cloud,
    category: 'Deployment',
    status: 'available'
  },
  {
    id: 'render',
    name: 'Render',
    description: 'Unified cloud to build and run all your apps and websites.',
    icon: Server,
    category: 'Deployment',
    status: 'available'
  },
  {
    id: 'railway',
    name: 'Railway',
    description: 'Infrastructure made easy. Provision and deploy in seconds.',
    icon: Zap,
    category: 'Deployment',
    status: 'available'
  },
  {
    id: 'vercel',
    name: 'Vercel',
    description: 'Develop, preview, and ship high-performance web apps.',
    icon: Triangle,
    category: 'Deployment',
    status: 'available'
  },
  {
    id: 'firecrawl',
    name: 'Firecrawl',
    description: 'Turn websites into LLM-ready data with ease.',
    icon: Flame,
    category: 'AI & Data',
    status: 'available'
  },
  {
    id: 'notion',
    name: 'Notion',
    description: 'The connected workspace where better, faster work happens.',
    icon: Book,
    category: 'Productivity',
    status: 'available'
  },
  {
    id: 'resend',
    name: 'Resend',
    description: 'Email API for developers to send transactional emails.',
    icon: Mail,
    category: 'Communication',
    status: 'available'
  },
  {
    id: 'linear',
    name: 'Linear',
    description: 'Streamline issues, projects, and product roadmaps.',
    icon: ListTodo,
    category: 'Productivity',
    status: 'available'
  },
  {
    id: 'clerk',
    name: 'Clerk',
    description: 'Authentication and user management for the modern web.',
    icon: UserCheck,
    category: 'Auth & Security',
    status: 'available'
  }
];

const Connectors: React.FC = () => {
  return (
    <div className="min-h-screen flex w-full bg-background dark:sunrise-gradient">
      <AppSidebar
        activeSection=""
        onSectionChange={() => {}}
      />
      <SidebarInset className="flex-1 flex flex-col">
        <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border px-2 sm:px-4 bg-background/80 dark:bg-background/20 backdrop-blur-sm">
          <SidebarTrigger className="-ml-1" />
          <div className="ml-auto">
            <h1 className="text-lg sm:text-xl font-semibold text-foreground">Connectors</h1>
          </div>
        </header>

        <div className="flex-1 overflow-auto bg-gray-50/50 dark:bg-transparent">
          <div className="max-w-6xl mx-auto p-6 sm:p-8">
            <div className="mb-10 text-center max-w-2xl mx-auto">
              <div className="inline-flex items-center justify-center p-2 bg-primary/10 rounded-full mb-4">
                <Share2 className="w-6 h-6 text-primary" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-foreground mb-4">
                Integrations Marketplace
              </h1>
              <p className="text-lg text-gray-600 dark:text-muted-foreground leading-relaxed">
                Connect your favorite tools and platforms to automate your workflow and enhance your testing capabilities.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {CONNECTORS.map((connector) => (
                <Card key={connector.id} className="group hover:shadow-lg transition-all duration-300 border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden flex flex-col">
                  <CardHeader className="relative">
                    <div className="flex justify-between items-start mb-2">
                      <div className="p-2.5 bg-background rounded-xl border border-border group-hover:border-primary/50 transition-colors shadow-sm">
                        <connector.icon className="w-6 h-6 text-primary" />
                      </div>
                      <Badge variant="secondary" className="text-[10px] uppercase tracking-wider font-bold">
                        {connector.category}
                      </Badge>
                    </div>
                    <CardTitle className="text-xl group-hover:text-primary transition-colors">{connector.name}</CardTitle>
                    <CardDescription className="line-clamp-2 min-h-[40px]">
                      {connector.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="mt-auto pt-4 flex gap-3">
                    <Button className="flex-1 gap-2" variant="default">
                      Connect
                    </Button>
                    <Button variant="outline" size="icon" className="shrink-0">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="mt-16 p-8 rounded-2xl bg-primary/5 border border-primary/10 text-center">
              <h2 className="text-2xl font-bold mb-4">Missing a connector?</h2>
              <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
                We're constantly adding new integrations. If you don't see what you need, check our SDK to build your own or request a new one.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Button variant="secondary" className="gap-2">
                  <CheckCircle2 className="h-4 w-4" /> Request Integration
                </Button>
                <Button variant="ghost" className="gap-2">
                  View SDK Documentation
                </Button>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </SidebarInset>
    </div>
  );
};

export default Connectors;
