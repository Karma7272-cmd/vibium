
import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin } from 'lucide-react';

interface LocationSelectorProps {
  location: string;
  setLocation: (location: string) => void;
}

const LocationSelector: React.FC<LocationSelectorProps> = ({ location, setLocation }) => {
  const locations = [
    'New York, USA',
    'London, UK',
    'Tokyo, Japan',
    'Sydney, Australia',
    'Berlin, Germany',
    'Mumbai, India',
    'Toronto, Canada',
    'Singapore',
    'Paris, France',
    'Mexico City, Mexico'
  ];

  return (
    <div className="space-y-2">
      <Label htmlFor="location">Location</Label>
      <Select value={location} onValueChange={setLocation}>
        <SelectTrigger>
          <SelectValue placeholder="Select location" />
        </SelectTrigger>
        <SelectContent>
          {locations.map((loc) => (
            <SelectItem key={loc} value={loc}>
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4" />
                <span>{loc}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default LocationSelector;
