import React, { useState } from 'react';
import { Plus, Bot, Play, Pause, Settings, Trash2, Clock, Bell, Shield, Cpu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Link } from 'react-router-dom';
import AppSidebar from '@/components/AppSidebar';
import Footer from '@/components/Footer';

interface Agent {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'paused' | 'error';
  prompt: string;
  trigger: 'schedule' | 'webhook' | 'manual';
  schedule?: string;
  llmProvider: 'openai' | 'anthropic' | 'local';
  notifications: string[];
  mcpTools: string[];
  environment: 'sandboxed' | 'isolated' | 'trusted';
  lastRun?: string;
  nextRun?: string;
}

const Agents: React.FC = () => {
  const [activeSection, setActiveSection] = useState('agents');
  const [agents] = useState<Agent[]>([
    {
      id: '1',
      name: 'Site Health Monitor',
      description: 'Monitors website performance and alerts on issues',
      status: 'active',
      prompt: 'Monitor the website performance metrics and alert if any critical issues are detected...',
      trigger: 'schedule',
      schedule: '*/15 * * * *',
      llmProvider: 'openai',
      notifications: ['email', 'slack'],
      mcpTools: ['web-scraper', 'api-client', 'database'],
      environment: 'sandboxed',
      lastRun: '2 minutes ago',
      nextRun: 'in 13 minutes'
    },
    {
      id: '2',
      name: 'Security Vulnerability Scanner',
      description: 'Scans for security vulnerabilities and generates reports',
      status: 'paused',
      prompt: 'Analyze the system for potential security vulnerabilities and create detailed reports...',
      trigger: 'webhook',
      llmProvider: 'anthropic',
      notifications: ['email'],
      mcpTools: ['security-scanner', 'report-generator'],
      environment: 'isolated',
      lastRun: '1 hour ago'
    },
    {
      id: '3',
      name: 'Performance Optimizer',
      description: 'Analyzes performance data and suggests optimizations',
      status: 'error',
      prompt: 'Review performance metrics and provide optimization recommendations...',
      trigger: 'manual',
      llmProvider: 'local',
      notifications: ['dashboard'],
      mcpTools: ['metrics-analyzer', 'performance-profiler'],
      environment: 'trusted',
      lastRun: '5 hours ago'
    }
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700';
      case 'paused': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-700';
      case 'error': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 dark:border-red-700';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800/50 dark:text-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <Play className="w-3 h-3" />;
      case 'paused': return <Pause className="w-3 h-3" />;
      case 'error': return <Trash2 className="w-3 h-3" />;
      default: return <Bot className="w-3 h-3" />;
    }
  };

  const getEnvironmentColor = (env: string) => {
    switch (env) {
      case 'sandboxed': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-700';
      case 'isolated': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-700';
      case 'trusted': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-700';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800/50 dark:text-gray-300';
    }
  };

  return (
    <div className="min-h-screen flex w-full bg-background sunrise-gradient">
      <AppSidebar 
        activeSection={activeSection} 
        onSectionChange={setActiveSection} 
      />
      <SidebarInset className="flex-1 flex flex-col">
        <header className="flex h-12 shrink-0 items-center gap-2 border-b dark:border-border px-2 sm:px-4">
          <SidebarTrigger className="-ml-1" />
          <div className="ml-auto flex items-center gap-4">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link to="/network" className="text-primary hover:text-primary/80">Network</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>AI Agents</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        
        <div className="flex-1 overflow-auto">
          <div className="p-2 sm:p-4 lg:p-6 bg-gray-50 dark:bg-background min-h-full">
            <div className="max-w-7xl mx-auto">
              {/* Header */}
              <div className="mb-4 sm:mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-foreground mb-2">AI Agents</h1>
                    <p className="text-sm sm:text-base lg:text-lg text-gray-600 dark:text-muted-foreground">Manage your intelligent automation agents</p>
                  </div>
                  <Button className="bg-primary hover:bg-primary/90 dark:bg-primary dark:hover:bg-primary/90 dark:text-primary-foreground">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Agent
                  </Button>
                </div>
              </div>

              {/* Stats - 2x2 grid layout */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 lg:gap-6 mb-4 sm:mb-6 px-1 sm:px-0">
                <Card className="dark:bg-card/40 dark:backdrop-blur-sm dark:border-border">
                  <CardContent className="p-2 sm:p-4 lg:p-6">
                    <div className="flex items-center space-x-1 sm:space-x-2">
                      <Bot className="w-4 h-4 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-primary dark:text-primary flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-muted-foreground truncate">Total Agents</p>
                        <p className="text-lg sm:text-xl lg:text-2xl font-bold dark:text-foreground truncate">{agents.length}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="dark:bg-card/40 dark:backdrop-blur-sm dark:border-border">
                  <CardContent className="p-2 sm:p-4 lg:p-6">
                    <div className="flex items-center space-x-1 sm:space-x-2">
                      <Play className="w-4 h-4 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-green-600 dark:text-green-400 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-muted-foreground truncate">Active</p>
                        <p className="text-lg sm:text-xl lg:text-2xl font-bold dark:text-foreground truncate">{agents.filter(a => a.status === 'active').length}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="dark:bg-card/40 dark:backdrop-blur-sm dark:border-border">
                  <CardContent className="p-2 sm:p-4 lg:p-6">
                    <div className="flex items-center space-x-1 sm:space-x-2">
                      <Pause className="w-4 h-4 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-muted-foreground truncate">Paused</p>
                        <p className="text-lg sm:text-xl lg:text-2xl font-bold dark:text-foreground truncate">{agents.filter(a => a.status === 'paused').length}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="dark:bg-card/40 dark:backdrop-blur-sm dark:border-border">
                  <CardContent className="p-2 sm:p-4 lg:p-6">
                    <div className="flex items-center space-x-1 sm:space-x-2">
                      <Shield className="w-4 h-4 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-muted-foreground truncate">Secured</p>
                        <p className="text-lg sm:text-xl lg:text-2xl font-bold dark:text-foreground truncate">{agents.filter(a => a.environment === 'sandboxed').length}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Filters */}
              <div className="bg-white dark:bg-card/40 dark:backdrop-blur-sm dark:border-border rounded-xl shadow-sm border border-gray-200 p-3 sm:p-6 mb-4 sm:mb-8">
                <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                  <div className="flex items-center space-x-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-foreground">Status:</label>
                    <Select defaultValue="all">
                      <SelectTrigger className="w-32 dark:bg-background dark:border-border dark:text-foreground">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="dark:bg-popover dark:border-border">
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="paused">Paused</SelectItem>
                        <SelectItem value="error">Error</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-foreground">Provider:</label>
                    <Select defaultValue="all">
                      <SelectTrigger className="w-32 dark:bg-background dark:border-border dark:text-foreground">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="dark:bg-popover dark:border-border">
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="openai">OpenAI</SelectItem>
                        <SelectItem value="anthropic">Anthropic</SelectItem>
                        <SelectItem value="local">Local</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-foreground">Environment:</label>
                    <Select defaultValue="all">
                      <SelectTrigger className="w-32 dark:bg-background dark:border-border dark:text-foreground">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="dark:bg-popover dark:border-border">
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="sandboxed">Sandboxed</SelectItem>
                        <SelectItem value="isolated">Isolated</SelectItem>
                        <SelectItem value="trusted">Trusted</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Agents List */}
              <div className="space-y-4">
                {agents.map((agent) => (
                  <Card key={agent.id} className="hover:shadow-md transition-shadow dark:bg-card/40 dark:backdrop-blur-sm dark:border-border">
                    <CardHeader className="pb-4">
                      <div className="flex flex-col sm:flex-row items-start justify-between space-y-2 sm:space-y-0">
                        <div className="flex items-start space-x-4 min-w-0 flex-1">
                          <div className="p-2 bg-primary/10 dark:bg-primary/20 rounded-lg flex-shrink-0">
                            <Bot className="w-6 h-6 text-primary dark:text-primary" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-2 mb-1">
                              <CardTitle className="text-lg sm:text-xl truncate dark:text-foreground">{agent.name}</CardTitle>
                              <Badge className={`${getStatusColor(agent.status)} border w-fit`}>
                                {getStatusIcon(agent.status)}
                                <span className="ml-1 capitalize">{agent.status}</span>
                              </Badge>
                            </div>
                            <CardDescription className="text-sm sm:text-base dark:text-muted-foreground">{agent.description}</CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 flex-shrink-0">
                          <Switch checked={agent.status === 'active'} className="data-[state=checked]:bg-primary" />
                          <Button variant="outline" size="sm" className="dark:border-border dark:text-foreground dark:hover:bg-accent">
                            <Settings className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="pt-0">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                        <div>
                          <p className="text-sm font-medium text-gray-600 dark:text-muted-foreground mb-1">Trigger</p>
                          <div className="flex items-center space-x-1">
                            <Clock className="w-4 h-4 text-gray-400 dark:text-muted-foreground" />
                            <span className="text-sm capitalize dark:text-foreground">{agent.trigger}</span>
                            {agent.schedule && <span className="text-xs text-gray-500 dark:text-muted-foreground hidden sm:inline">({agent.schedule})</span>}
                          </div>
                        </div>
                        
                        <div>
                          <p className="text-sm font-medium text-gray-600 dark:text-muted-foreground mb-1">LLM Provider</p>
                          <div className="flex items-center space-x-1">
                            <Cpu className="w-4 h-4 text-gray-400 dark:text-muted-foreground" />
                            <span className="text-sm capitalize dark:text-foreground">{agent.llmProvider}</span>
                          </div>
                        </div>
                        
                        <div>
                          <p className="text-sm font-medium text-gray-600 dark:text-muted-foreground mb-1">Environment</p>
                          <Badge className={`${getEnvironmentColor(agent.environment)} border`}>
                            <Shield className="w-3 h-3 mr-1" />
                            {agent.environment}
                          </Badge>
                        </div>
                        
                        <div>
                          <p className="text-sm font-medium text-gray-600 dark:text-muted-foreground mb-1">Notifications</p>
                          <div className="flex items-center space-x-1">
                            <Bell className="w-4 h-4 text-gray-400 dark:text-muted-foreground" />
                            <span className="text-sm dark:text-foreground">{agent.notifications.join(', ')}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-sm font-medium text-gray-600 dark:text-muted-foreground mb-1">MCP Tools</p>
                          <div className="flex flex-wrap gap-1">
                            {agent.mcpTools.map((tool) => (
                              <Badge key={tool} variant="secondary" className="text-xs dark:bg-secondary/50 dark:text-secondary-foreground">
                                {tool}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        
                        <div>
                          <p className="text-sm font-medium text-gray-600 dark:text-muted-foreground mb-1">Last Run / Next Run</p>
                          <div className="text-sm text-gray-500 dark:text-muted-foreground">
                            {agent.lastRun && <span>Last: {agent.lastRun}</span>}
                            {agent.nextRun && (
                              <>
                                {agent.lastRun && ' • '}
                                <span>Next: {agent.nextRun}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-muted-foreground mb-2">AI Prompt</p>
                        <div className="bg-gray-50 dark:bg-muted/20 rounded-lg p-3 border dark:border-border">
                          <p className="text-sm text-gray-700 dark:text-foreground line-clamp-2">{agent.prompt}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>

        <Footer />
      </SidebarInset>
    </div>
  );
};

export default Agents;
