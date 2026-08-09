
import React from 'react';
import { Database, Wifi, WifiOff } from 'lucide-react';
import { LoadingState } from '@/components/ui/LoadingState';
import { useSettings } from '@/contexts/SettingsContext';
import { Badge } from '@/components/ui/badge';

const DataSourceIndicator: React.FC = () => {
  const { dataSource, connectionStatus } = useSettings();

  if (dataSource === 'mock') {
    return (
      <Badge variant="outline" className="gap-1">
        <Database className="h-3 w-3" />
        Mock Data
      </Badge>
    );
  }

  const getIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <Wifi className="h-3 w-3 text-green-500" />;
      case 'connecting':
        return <LoadingState variant="bars" size="sm" className="text-yellow-500" />;
      case 'error':
        return <WifiOff className="h-3 w-3 text-red-500" />;
      default:
        return <WifiOff className="h-3 w-3 text-gray-400" />;
    }
  };

  const getVariant = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'default';
      case 'connecting':
        return 'secondary';
      case 'error':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <Badge variant={getVariant()} className="gap-1">
      {getIcon()}
      Nostr Relays
    </Badge>
  );
};

export default DataSourceIndicator;
