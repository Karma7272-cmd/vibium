
import React, { useState } from 'react';
import { Monitor, Edit, Power, Trash2, Wifi, Save } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

const MyNodesSettings: React.FC = () => {
  // Mock data for user's nodes
  const [myNodes] = useState([
    {
      id: 'node-1',
      name: 'Primary Node',
      location: 'New York, US',
      status: 'online',
      type: 'validator',
      uptime: '99.8%',
      lastActive: '2 minutes ago'
    },
    {
      id: 'node-2',
      name: 'Backup Node',
      location: 'London, UK',
      status: 'online',
      type: 'operator',
      uptime: '97.2%',
      lastActive: '5 minutes ago'
    },
    {
      id: 'node-3',
      name: 'Test Node',
      location: 'Tokyo, JP',
      status: 'offline',
      type: 'operator',
      uptime: '85.1%',
      lastActive: '2 hours ago'
    }
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'text-green-600 bg-green-100';
      case 'offline': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            My Nodes
          </CardTitle>
          <CardDescription>
            Manage and monitor the nodes you own and control in the network
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {myNodes.map((node) => (
              <div key={node.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Monitor className="h-5 w-5 text-gray-600" />
                      <h3 className="font-semibold text-lg">{node.name}</h3>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(node.status)}`}>
                      {node.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Power className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Location:</span>
                    <p className="font-medium">{node.location}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Type:</span>
                    <p className="font-medium capitalize">{node.type}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Uptime:</span>
                    <p className="font-medium">{node.uptime}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Last Active:</span>
                    <p className="font-medium">{node.lastActive}</p>
                  </div>
                </div>
              </div>
            ))}
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Monitor className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Add New Node</h3>
              <p className="text-gray-500 mb-4">Deploy a new node to expand your network presence</p>
              <Button>
                <Wifi className="h-4 w-4 mr-2" />
                Deploy Node
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Node Configuration</CardTitle>
          <CardDescription>
            Global settings for all your nodes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="defaultRegion">Default Region</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select default region" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="us-east">US East</SelectItem>
                  <SelectItem value="us-west">US West</SelectItem>
                  <SelectItem value="eu-central">EU Central</SelectItem>
                  <SelectItem value="asia-pacific">Asia Pacific</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="autoRestart">Auto-restart on Failure</Label>
              <Switch defaultChecked />
            </div>
          </div>
          <Button>
            <Save className="h-4 w-4 mr-2" />
            Save Node Settings
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default MyNodesSettings;
