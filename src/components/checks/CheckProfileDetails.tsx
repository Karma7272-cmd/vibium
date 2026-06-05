
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Monitor } from 'lucide-react';

interface CheckProfileDetailsProps {
  check: {
    url: string;
    operatorNpub: string;
    operatorName: string;
    nodeName: string;
    location: string;
    duration: number;
    responseSize?: number;
    userAgent?: string;
  };
}

const CheckProfileDetails: React.FC<CheckProfileDetailsProps> = ({ check }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Monitor className="w-5 h-5" />
          Check Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium text-gray-500">URL Tested</label>
          <p className="text-lg">{check.url}</p>
        </div>
        
        <div>
          <label className="text-sm font-medium text-gray-500">Operator</label>
          <p className="text-lg">
            <Link 
              to={`/operator/${check.operatorNpub}`}
              className="text-primary hover:text-primary/80 transition-colors hover:underline"
            >
              {check.operatorName}
            </Link>
          </p>
        </div>
        
        <div>
          <label className="text-sm font-medium text-gray-500">Node</label>
          <p className="text-lg">
            <Link 
              to={`/node/${check.operatorNpub}`}
              className="text-primary hover:text-primary/80 transition-colors hover:underline"
            >
              {check.nodeName}
            </Link>
          </p>
        </div>
        
        <div>
          <label className="text-sm font-medium text-gray-500">Location</label>
          <p className="text-lg">{check.location}</p>
        </div>
        
        <div>
          <label className="text-sm font-medium text-gray-500">Duration</label>
          <p className="text-lg">{check.duration}ms</p>
        </div>
        
        <div>
          <label className="text-sm font-medium text-gray-500">Response Size</label>
          <p className="text-lg">{check.responseSize ? `${(check.responseSize / 1024).toFixed(2)} KB` : 'N/A'}</p>
        </div>
        
        <div>
          <label className="text-sm font-medium text-gray-500">User Agent</label>
          <p className="text-lg font-mono text-sm">{check.userAgent || 'N/A'}</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default CheckProfileDetails;
