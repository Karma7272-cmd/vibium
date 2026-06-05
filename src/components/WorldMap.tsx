import React, { useState, useEffect } from 'react';
import { Monitor } from 'lucide-react';

interface TestJob {
  id: string;
  location: string;
  coordinates: { lat: number; lng: number };
  screenshot: string;
  node: string;
  status: 'completed' | 'running' | 'failed';
  timestamp: string;
  url: string;
  createdAt: number;
}

interface WorldMapProps {
  liveMode?: boolean;
}

const WorldMap: React.FC<WorldMapProps> = ({ liveMode = false }) => {
  const [hoveredJob, setHoveredJob] = useState<string | null>(null);
  const [liveJobs, setLiveJobs] = useState<TestJob[]>([]);
  
  const staticTestJobs: TestJob[] = [
    {
      id: '1',
      location: 'San Francisco, CA',
      coordinates: { lat: 37.7749, lng: -122.4194 },
      screenshot: '/placeholder.svg',
      node: 'MacBook Pro',
      status: 'completed',
      timestamp: '2 min ago',
      url: 'example.com',
      createdAt: Date.now() - 120000
    },
    {
      id: '2',
      location: 'London, UK',
      coordinates: { lat: 51.5074, lng: -0.1278 },
      screenshot: '/placeholder.svg',
      node: 'Chrome Desktop',
      status: 'running',
      timestamp: 'Just now',
      url: 'testsite.com',
      createdAt: Date.now() - 30000
    },
    {
      id: '3',
      location: 'Tokyo, Japan',
      coordinates: { lat: 35.6762, lng: 139.6503 },
      screenshot: '/placeholder.svg',
      node: 'iPhone 15',
      status: 'completed',
      timestamp: '5 min ago',
      url: 'mobile-app.com',
      createdAt: Date.now() - 300000
    },
    {
      id: '4',
      location: 'Sydney, Australia',
      coordinates: { lat: -33.8688, lng: 151.2093 },
      screenshot: '/placeholder.svg',
      node: 'Samsung Galaxy',
      status: 'completed',
      timestamp: '8 min ago',
      url: 'responsive-site.com',
      createdAt: Date.now() - 480000
    },
    {
      id: '5',
      location: 'São Paulo, Brazil',
      coordinates: { lat: -23.5505, lng: -46.6333 },
      screenshot: '/placeholder.svg',
      node: 'Windows PC',
      status: 'failed',
      timestamp: '12 min ago',
      url: 'test-page.com',
      createdAt: Date.now() - 720000
    }
  ];

  const generateLiveJob = (): TestJob => {
    const urls = [
      'https://google.com',
      'https://github.com',
      'https://stackoverflow.com',
      'https://reddit.com',
      'https://twitter.com',
      'https://facebook.com',
      'https://linkedin.com',
      'https://amazon.com',
      'https://netflix.com',
      'https://youtube.com'
    ];
    
    const locations = [
      { name: 'New York, USA', lat: 40.7128, lng: -74.0060 },
      { name: 'London, UK', lat: 51.5074, lng: -0.1278 },
      { name: 'Tokyo, Japan', lat: 35.6762, lng: 139.6503 },
      { name: 'Sydney, Australia', lat: -33.8688, lng: 151.2093 },
      { name: 'Berlin, Germany', lat: 52.5200, lng: 13.4050 },
      { name: 'Mumbai, India', lat: 19.0760, lng: 72.8777 },
      { name: 'Toronto, Canada', lat: 43.6532, lng: -79.3832 },
      { name: 'Singapore', lat: 1.3521, lng: 103.8198 },
      { name: 'Paris, France', lat: 48.8566, lng: 2.3522 },
      { name: 'Mexico City, Mexico', lat: 19.4326, lng: -99.1332 }
    ];

    const nodes = ['MacBook Pro', 'iPhone 15', 'Chrome Desktop', 'Samsung Galaxy', 'Windows PC', 'iPad Air', 'Pixel 8'];
    const screenshots = [
      'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=300&fit=crop'
    ];

    const location = locations[Math.floor(Math.random() * locations.length)];
    const statusOptions = ['completed', 'running', 'failed'] as const;
    const status = statusOptions[Math.floor(Math.random() * statusOptions.length)];
    
    return {
      id: `live-${Date.now()}-${Math.random()}`,
      location: location.name,
      coordinates: { lat: location.lat, lng: location.lng },
      screenshot: screenshots[Math.floor(Math.random() * screenshots.length)],
      node: nodes[Math.floor(Math.random() * nodes.length)],
      status,
      timestamp: 'Just now',
      url: urls[Math.floor(Math.random() * urls.length)],
      createdAt: Date.now()
    };
  };

  useEffect(() => {
    if (!liveMode) return;

    const interval = setInterval(() => {
      const newJob = generateLiveJob();
      setLiveJobs(prev => {
        const updated = [newJob, ...prev];
        // Remove jobs older than 2 minutes
        return updated.filter(job => Date.now() - job.createdAt < 120000);
      });
    }, Math.random() * 4000 + 2000); // Random interval between 2-6 seconds

    return () => clearInterval(interval);
  }, [liveMode]);

  // Clean up old jobs periodically
  useEffect(() => {
    if (!liveMode) return;

    const cleanupInterval = setInterval(() => {
      setLiveJobs(prev => prev.filter(job => Date.now() - job.createdAt < 120000));
    }, 10000); // Clean up every 10 seconds

    return () => clearInterval(cleanupInterval);
  }, [liveMode]);

  const testJobs = liveMode ? [...liveJobs, ...staticTestJobs] : staticTestJobs;

  const convertToPixels = (lat: number, lng: number) => {
    const x = ((lng + 180) / 360) * 100;
    const y = ((90 - lat) / 180) * 100;
    return { x, y };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#10b981';
      case 'running': return '#3b82f6';
      case 'failed': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getJobOpacity = (createdAt: number) => {
    if (!liveMode) return 1;
    
    const age = Date.now() - createdAt;
    const maxAge = 120000; // 2 minutes
    
    if (age > maxAge) return 0;
    
    // Fade out over the last 30 seconds
    const fadeStart = maxAge - 30000;
    if (age > fadeStart) {
      return Math.max(0, 1 - (age - fadeStart) / 30000);
    }
    
    return 1;
  };

  const hoveredJobData = testJobs.find(job => job.id === hoveredJob);

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden bg-blue-50">
      {/* World Map Background */}
      <div className="relative w-full h-full">
        <img 
          src="https://upload.wikimedia.org/wikipedia/commons/8/83/Equirectangular_projection_SW.jpg"
          alt="World Map"
          className="w-full h-full object-cover"
          onError={(e) => {
            // Fallback to a different world map if the first one fails
            e.currentTarget.src = "https://eoimages.gsfc.nasa.gov/images/imagerecords/73000/73909/world.topo.bathy.200412.3x5400x2700.jpg";
          }}
        />
        
        {/* Overlay for better pin visibility */}
        <div className="absolute inset-0 bg-gradient-to-b from-blue-50/30 to-gray-50/30"></div>
        
        {/* Test Job Pins */}
        {testJobs.map((job) => {
          const { x, y } = convertToPixels(job.coordinates.lat, job.coordinates.lng);
          const opacity = getJobOpacity(job.createdAt);
          const isNew = liveMode && Date.now() - job.createdAt < 5000; // Mark as new for first 5 seconds
          
          if (opacity === 0) return null;
          
          return (
            <div
              key={job.id}
              className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-500 hover:scale-150 hover:z-10 ${
                isNew ? 'animate-scale-in' : ''
              }`}
              style={{
                left: `${x}%`,
                top: `${y}%`,
                opacity,
              }}
              onMouseEnter={() => setHoveredJob(job.id)}
              onMouseLeave={() => setHoveredJob(null)}
            >
              <div
                className={`w-4 h-4 rounded-full border-2 border-white shadow-lg transition-all duration-300 ${
                  job.status === 'running' ? 'animate-pulse' : ''
                } ${hoveredJob === job.id ? 'shadow-2xl ring-4 ring-white/30' : ''} ${
                  isNew ? 'ring-4 ring-yellow-400/50' : ''
                }`}
                style={{
                  backgroundColor: getStatusColor(job.status),
                  boxShadow: hoveredJob === job.id 
                    ? `0 0 30px ${getStatusColor(job.status)}, 0 8px 20px rgba(0,0,0,0.3)` 
                    : isNew
                    ? `0 0 20px ${getStatusColor(job.status)}, 0 4px 12px rgba(0,0,0,0.4)`
                    : '0 4px 12px rgba(0,0,0,0.4)'
                }}
              />
            </div>
          );
        })}
      </div>
      
      {/* Floating Screenshot Window */}
      {hoveredJobData && (
        <div className="absolute top-4 left-4 bg-white rounded-lg shadow-2xl border border-gray-200 p-4 min-w-72 z-20 animate-in fade-in-0 slide-in-from-left-2 duration-300">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Monitor className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-900">{hoveredJobData.node}</span>
            </div>
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
              hoveredJobData.status === 'completed' ? 'bg-green-100 text-green-700' :
              hoveredJobData.status === 'running' ? 'bg-blue-100 text-blue-700' :
              'bg-red-100 text-red-700'
            }`}>
              {hoveredJobData.status}
            </span>
          </div>
          
          <div className="bg-gray-50 rounded-md p-3 mb-3 border">
            <img 
              src={hoveredJobData.screenshot} 
              alt={`Screenshot from ${hoveredJobData.location}`}
              className="w-full h-32 object-cover rounded border shadow-sm"
            />
          </div>
          
          <div className="space-y-2">
            <p className="text-sm font-semibold text-gray-900">{hoveredJobData.location}</p>
            <p className="text-xs text-blue-600 font-medium">{hoveredJobData.url}</p>
            <p className="text-xs text-gray-500">{hoveredJobData.timestamp}</p>
          </div>
        </div>
      )}
      
      {/* Live indicator */}
      {liveMode && (
        <div className="absolute top-4 right-4 flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 text-xs font-medium text-gray-700">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
          LIVE
        </div>
      )}
    </div>
  );
};

export default WorldMap;
