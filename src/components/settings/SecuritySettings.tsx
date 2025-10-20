
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const SecuritySettings: React.FC = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Password & Authentication</CardTitle>
          <CardDescription>
            Manage your account security settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button variant="outline">Change Password</Button>
          <Button variant="outline">Setup Two-Factor Authentication</Button>
          <Button variant="outline">Manage API Keys</Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Session Management</CardTitle>
          <CardDescription>
            View and manage your active sessions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive">Sign Out All Devices</Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default SecuritySettings;
