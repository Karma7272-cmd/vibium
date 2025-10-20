
import React, { useState } from 'react';
import { Save } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

const NotificationSettings: React.FC = () => {
  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    pushNotifications: false,
    testResults: true,
    networkStatus: true
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification Preferences</CardTitle>
        <CardDescription>
          Choose how you want to be notified about network activities
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Email Alerts</Label>
            <p className="text-sm text-gray-500">Receive important updates via email</p>
          </div>
          <Switch
            checked={notifications.emailAlerts}
            onCheckedChange={(checked) => setNotifications({ ...notifications, emailAlerts: checked })}
          />
        </div>
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Push Notifications</Label>
            <p className="text-sm text-gray-500">Browser notifications for real-time updates</p>
          </div>
          <Switch
            checked={notifications.pushNotifications}
            onCheckedChange={(checked) => setNotifications({ ...notifications, pushNotifications: checked })}
          />
        </div>
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Test Results</Label>
            <p className="text-sm text-gray-500">Notifications when test jobs complete</p>
          </div>
          <Switch
            checked={notifications.testResults}
            onCheckedChange={(checked) => setNotifications({ ...notifications, testResults: checked })}
          />
        </div>
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Network Status</Label>
            <p className="text-sm text-gray-500">Updates about network health and maintenance</p>
          </div>
          <Switch
            checked={notifications.networkStatus}
            onCheckedChange={(checked) => setNotifications({ ...notifications, networkStatus: checked })}
          />
        </div>
        <Button className="mt-6">
          <Save className="h-4 w-4 mr-2" />
          Save Preferences
        </Button>
      </CardContent>
    </Card>
  );
};

export default NotificationSettings;
