
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText } from 'lucide-react';

interface CheckProfileLogsProps {
  check: {
    timestamp: string;
    duration: number;
    statusCode: number;
    responseSize?: number;
    status: string;
    url: string;
  };
}

const CheckProfileLogs: React.FC<CheckProfileLogsProps> = ({ check }) => {
  const generateLogs = () => {
    const logs = [
      `[${new Date(check.timestamp).toISOString()}] Starting check for ${check.url}`,
      `[${new Date(Date.parse(check.timestamp) + 10).toISOString()}] DNS resolution completed`,
      `[${new Date(Date.parse(check.timestamp) + 50).toISOString()}] TCP connection established`,
      `[${new Date(Date.parse(check.timestamp) + 80).toISOString()}] SSL handshake completed`,
      `[${new Date(Date.parse(check.timestamp) + 120).toISOString()}] HTTP request sent`,
      `[${new Date(Date.parse(check.timestamp) + check.duration).toISOString()}] HTTP response received: ${check.statusCode}`,
      `[${new Date(Date.parse(check.timestamp) + check.duration + 10).toISOString()}] Response size: ${check.responseSize || 0} bytes`,
      `[${new Date(Date.parse(check.timestamp) + check.duration + 20).toISOString()}] Screenshot captured`,
      `[${new Date(Date.parse(check.timestamp) + check.duration + 30).toISOString()}] Check completed successfully`,
    ];
    
    if (check.status === 'failed') {
      logs[logs.length - 1] = `[${new Date(Date.parse(check.timestamp) + check.duration + 30).toISOString()}] Check failed with status ${check.statusCode}`;
    }
    
    return logs;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Check Logs
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
          <pre className="text-green-400 font-mono text-sm whitespace-pre-wrap">
            {generateLogs().join('\n')}
          </pre>
        </div>
      </CardContent>
    </Card>
  );
};

export default CheckProfileLogs;
