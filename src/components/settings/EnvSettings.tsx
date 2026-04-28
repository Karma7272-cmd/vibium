import React, { useState } from 'react';
import { Plus, Trash2, Key, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useSettings } from '@/contexts/SettingsContext';

const EnvSettings: React.FC = () => {
  const { envVars, addEnvVar, removeEnvVar } = useSettings();
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newKey && newValue) {
      addEnvVar(newKey, newValue);
      setNewKey('');
      setNewValue('');
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Environment Variables
          </CardTitle>
          <CardDescription>
            Manage secrets and configuration for your analysis tasks.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="flex-1">
              <Input
                placeholder="Variable Name (e.g. API_KEY)"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value.toUpperCase())}
                className="bg-background/50"
              />
            </div>
            <div className="flex-1">
              <Input
                type="password"
                placeholder="Value"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                className="bg-background/50"
              />
            </div>
            <Button type="submit" disabled={!newKey || !newValue} className="gap-2">
              <Plus className="h-4 w-4" /> Add
            </Button>
          </form>

          <div className="space-y-3">
            {envVars.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground border-2 border-dashed border-border/50 rounded-lg">
                No environment variables defined.
              </div>
            ) : (
              envVars.map((v) => (
                <div key={v.id} className="flex items-center justify-between p-3 rounded-lg bg-background/40 border border-border/40 group">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <Key className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="flex flex-col overflow-hidden">
                      <span className="font-mono text-sm font-medium truncate">{v.key}</span>
                      <span className="text-xs text-muted-foreground">••••••••••••••••</span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeEnvVar(v.id)}
                    className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EnvSettings;
