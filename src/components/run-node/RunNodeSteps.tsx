
import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const RunNodeSteps: React.FC = () => {
  const steps = [
    {
      step: 1,
      title: "Choose Your Setup",
      description: "Download Vibium Studio or order Valet Hardware from Tapster Robotics"
    },
    {
      step: 2,
      title: "Install & Configure",
      description: "Follow the setup wizard to configure your node and connect to the network"
    },
    {
      step: 3,
      title: "Register as Operator",
      description: "Create your operator profile and set your availability preferences"
    },
    {
      step: 4,
      title: "Start Testing",
      description: "Begin accepting test jobs and earning rewards for completed tasks"
    }
  ];

  return (
    <Card className="mb-8 dark:bg-card/40 dark:backdrop-blur-sm dark:border-border">
      <CardHeader>
        <CardTitle className="text-2xl dark:text-foreground">Getting Started</CardTitle>
        <CardDescription className="dark:text-muted-foreground">
          Follow these steps to become an active operator on the Vibium Network
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {steps.map((item, index) => (
            <div key={index} className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-8 h-8 bg-primary dark:bg-primary text-white dark:text-primary-foreground rounded-full flex items-center justify-center font-semibold">
                {item.step}
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 dark:text-foreground mb-1">{item.title}</h4>
                <p className="text-gray-600 dark:text-muted-foreground">{item.description}</p>
              </div>
              {index < 3 && (
                <ArrowRight className="h-5 w-5 text-gray-400 dark:text-muted-foreground mt-1" />
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default RunNodeSteps;
