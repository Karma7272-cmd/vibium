import React, { useState } from 'react';
import { Plus, Trash2, Key } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSettings, EnvVar } from '@/contexts/SettingsContext';
import { toast } from '@/components/ui/sonner';

const EnvSettings: React.FC = () => {
  const { envVars, setEnvVars } = useSettings();
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');

  const addEnvVar = () => {
    if (!newKey.trim()) {
      toast.error('Key is required');
      return;
    }
    if (envVars.some(v => v.key === newKey)) {
      toast.error('Key already exists');
      return;
    }
    setEnvVars([...envVars, { key: newKey, value: newValue }]);
    setNewKey('');
    setNewValue('');
    toast.success('Environment variable added');
  };

  const removeEnvVar = (key: string) => {
    setEnvVars(envVars.filter(v => v.key !== key));
    toast.success('Environment variable removed');
  };

  const updateEnvVar = (key: string, value: string) => {
    setEnvVars(envVars.map(v => v.key === key ? { ...v, value } : v));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          Environment Variables
        </CardTitle>
        <CardDescription>
          Manage secret keys and configuration values for your tests and integrations.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="new-key">Variable Name</Label>
              <Input
                id="new-key"
                placeholder="API_KEY"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-value">Value</Label>
              <div className="flex gap-2">
                <Input
                  id="new-value"
                  type="password"
                  placeholder="••••••••"
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                />
                <Button onClick={addEnvVar}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <Label>Stored Variables</Label>
          {envVars.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">No environment variables defined.</p>
          ) : (
            <div className="space-y-2">
              {envVars.map((v) => (
                <div key={v.key} className="flex flex-col sm:flex-row gap-2 p-3 border rounded-lg bg-muted/30">
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-bold text-muted-foreground block mb-1">NAME</span>
                    <span className="text-sm font-mono truncate block">{v.key}</span>
                  </div>
                  <div className="flex-[2] min-w-0">
                    <span className="text-xs font-bold text-muted-foreground block mb-1">VALUE</span>
                    <Input
                      type="password"
                      value={v.value}
                      onChange={(e) => updateEnvVar(v.key, e.target.value)}
                      className="h-8 text-sm font-mono"
                    />
                  </div>
                  <div className="flex items-end justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeEnvVar(v.key)}
                      className="h-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default EnvSettings;
