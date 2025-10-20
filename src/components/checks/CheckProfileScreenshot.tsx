
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera } from 'lucide-react';

interface CheckProfileScreenshotProps {
  check: {
    url: string;
    screenshot: string;
  };
}

const CheckProfileScreenshot: React.FC<CheckProfileScreenshotProps> = ({ check }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="w-5 h-5" />
          Screenshot
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg overflow-hidden">
          <img 
            src={check.screenshot} 
            alt={`Screenshot of ${check.url}`}
            className="w-full h-auto"
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default CheckProfileScreenshot;
