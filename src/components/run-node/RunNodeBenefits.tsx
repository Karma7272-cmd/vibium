
import React from 'react';
import { CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const RunNodeBenefits: React.FC = () => {
  const benefits = [
    "Earn rewards for running tests",
    "Contribute to global web quality",
    "Flexible operation schedule",
    "Low maintenance requirements",
    "Scale with multiple devices",
    "Join a growing community"
  ];

  return (
    <Card className="mb-8 dark:bg-card/40 dark:backdrop-blur-sm dark:border-border">
      <CardHeader>
        <CardTitle className="text-2xl dark:text-foreground">Why Run a Node?</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-6">
          {benefits.map((benefit, index) => (
            <div key={index} className="flex items-center space-x-3">
              <CheckCircle className="h-5 w-5 text-primary dark:text-primary flex-shrink-0" />
              <span className="text-gray-700 dark:text-muted-foreground">{benefit}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default RunNodeBenefits;
