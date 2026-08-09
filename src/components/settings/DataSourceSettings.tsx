
import React, { useState } from 'react';
import { AlertCircle, Plus, Trash2, Wifi, WifiOff } from 'lucide-react';
import { LoadingState } from '@/components/ui/LoadingState';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { useSettings } from '@/contexts/SettingsContext';
import { toast } from '@/components/ui/sonner';

const DataSourceSettings: React.FC = () => {
  const [newRelayUrl, setNewRelayUrl] = useState('');

  const { dataSource, setDataSource, relayUrls, setRelayUrls, connectionStatus } = useSettings();

  const handleDataSourceToggle = (checked: boolean) => {
    setDataSource(checked ? 'nostr' : 'mock');
    if (checked) {
      toast.info('Switching to Nostr relays...');
    } else {
      toast.info('Switched to mock data');
    }
  };

  const addRelayUrl = () => {
    if (newRelayUrl && !relayUrls.includes(newRelayUrl)) {
      setRelayUrls([...relayUrls, newRelayUrl]);
      setNewRelayUrl('');
      toast.success('Relay added');
    }
  };

  const removeRelayUrl = (url: string) => {
    setRelayUrls(relayUrls.filter(relay => relay !== url));
    toast.success('Relay removed');
  };

  const resetToDefaultRelays = () => {
    const defaultRelays = [
      'wss://relay.damus.io',
      'wss://nos.lol',
      'wss://relay.snort.social',
      'wss://relay.nostr.band'
    ];
    setRelayUrls(defaultRelays);
    toast.success('Reset to default relays');
  };

  const getConnectionStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <Wifi className="h-4 w-4 text-green-500" />;
      case 'connecting':
        return <LoadingState variant="bars" size="sm" className="text-yellow-500" />;
      case 'error':
        return <WifiOff className="h-4 w-4 text-red-500" />;
      default:
        return <WifiOff className="h-4 w-4 text-gray-400" />;
    }
  };

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Connected to relays';
      case 'connecting':
        return 'Connecting to relays...';
      case 'error':
        return 'Connection failed';
      default:
        return 'Disconnected';
    }
  };

  const isRelaySettingsDisabled = dataSource === 'mock';

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Data Source</CardTitle>
          <CardDescription>
            Choose between mock data for testing or real Nostr relay data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="data-source">Use Nostr Relays</Label>
              <p className="text-sm text-muted-foreground">
                {dataSource === 'nostr' ? 'Fetching data from Nostr relays' : 'Using mock data for testing'}
              </p>
            </div>
            <Switch
              id="data-source"
              checked={dataSource === 'nostr'}
              onCheckedChange={handleDataSourceToggle}
            />
          </div>

          {dataSource === 'nostr' && (
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              {getConnectionStatusIcon()}
              <span className="text-sm">{getConnectionStatusText()}</span>
            </div>
          )}

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {dataSource === 'nostr' 
                ? 'Connected to Nostr relays. Data will be fetched in real-time from the network.'
                : 'Using mock data. Enable Nostr relays above to connect to the real network.'
              }
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <Card className={isRelaySettingsDisabled ? 'opacity-50' : ''}>
        <CardHeader>
          <CardTitle className={isRelaySettingsDisabled ? 'text-muted-foreground' : ''}>
            Relay Configuration
          </CardTitle>
          <CardDescription className={isRelaySettingsDisabled ? 'text-muted-foreground' : ''}>
            Manage your Nostr relay connections
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className={isRelaySettingsDisabled ? 'text-muted-foreground' : ''}>
              Add New Relay
            </Label>
            <div className="flex gap-2">
              <Input
                placeholder="wss://relay.example.com"
                value={newRelayUrl}
                onChange={(e) => setNewRelayUrl(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !isRelaySettingsDisabled && addRelayUrl()}
                disabled={isRelaySettingsDisabled}
                className={isRelaySettingsDisabled ? 'cursor-not-allowed' : ''}
              />
              <Button 
                onClick={addRelayUrl} 
                size="sm"
                disabled={isRelaySettingsDisabled}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label className={isRelaySettingsDisabled ? 'text-muted-foreground' : ''}>
              Connected Relays
            </Label>
            <div className="space-y-2">
              {relayUrls.map((url) => (
                <div key={url} className="flex items-center justify-between p-2 border rounded">
                  <span className={`text-sm font-mono ${isRelaySettingsDisabled ? 'text-muted-foreground' : ''}`}>
                    {url}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeRelayUrl(url)}
                    disabled={isRelaySettingsDisabled}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t">
            <button
              onClick={resetToDefaultRelays}
              disabled={isRelaySettingsDisabled}
              className={`text-xs text-primary hover:text-primary/80 transition-colors hover:underline ${
                isRelaySettingsDisabled ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              Reset to default relays
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DataSourceSettings;
