
export const allNodes = [
  {
    id: 1,
    name: 'Cheerful-Blue-Dolphin',
    type: 'Server',
    location: 'New York, USA',
    status: 'online',
    uptime: '99.9%',
    lastSeen: '2 minutes ago',
    ip: '192.168.1.10',
    os: 'Ubuntu',
    osImage: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=64&h=64&fit=crop&crop=center',
    profileImage: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=128&h=128&fit=crop&crop=center',
    npub: 'npub1xyz123abc456def789012345678901234567890abcdef1234567890abcdef',
    bio: 'High-performance server node located in a Tier 3 data center in Manhattan. Optimized for low-latency applications and equipped with enterprise-grade hardware for maximum reliability.'
  },
  {
    id: 2,
    name: 'Brave-Green-Eagle',
    type: 'Server',
    location: 'London, UK',
    status: 'online',
    uptime: '98.7%',
    lastSeen: '5 minutes ago',
    ip: '192.168.1.15',
    os: 'CentOS',
    osImage: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=64&h=64&fit=crop&crop=center',
    profileImage: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=128&h=128&fit=crop&crop=center',
    npub: 'npub1abc789def012345678901234567890123456789abcdef0123456789abcdef',
    bio: 'European gateway node with excellent connectivity and redundant power systems.'
  },
  {
    id: 3,
    name: 'Swift-Red-Falcon',
    type: 'Mobile',
    location: 'Tokyo, Japan',
    status: 'maintenance',
    uptime: '95.2%',
    lastSeen: '1 hour ago',
    ip: '192.168.1.25',
    os: 'iOS',
    osImage: 'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=64&h=64&fit=crop&crop=center',
    profileImage: 'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=128&h=128&fit=crop&crop=center',
    npub: 'npub1def456ghi789012345678901234567890123456789abcdef0123456789abcdef',
    bio: 'Mobile testing node for iOS applications in the Asia-Pacific region.'
  },
  {
    id: 4,
    name: 'Mighty-Blue-Wolf',
    type: 'Server',
    location: 'Sydney, Australia',
    status: 'offline',
    uptime: '89.1%',
    lastSeen: '3 hours ago',
    ip: '192.168.1.30',
    os: 'Windows',
    osImage: 'https://images.unsplash.com/photo-1633419461186-7d40a38105ec?w=64&h=64&fit=crop&crop=center',
    profileImage: 'https://images.unsplash.com/photo-1633419461186-7d40a38105ec?w=128&h=128&fit=crop&crop=center',
    npub: 'npub1ghi789jkl012345678901234567890123456789abcdef0123456789abcdef',
    bio: 'Windows-based testing node serving the Australian market.'
  }
];

export const nodeProfiles = [
  {
    id: 1,
    name: 'Cheerful-Blue-Dolphin',
    type: 'Server',
    location: 'New York, USA',
    geoHash: 'dr5regw3p',
    status: 'online',
    uptime: '99.9%',
    lastSeen: '2 minutes ago',
    ip: '192.168.1.10',
    os: 'Ubuntu 22.04 LTS',
    osImage: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=128&h=128&fit=crop&crop=center',
    npub: 'npub1xyz123abc456def789012345678901234567890abcdef1234567890abcdef',
    bio: 'High-performance NYC server node 🏙️ Enterprise-grade hardware for low-latency apps',
    specs: {
      cpu: 'Intel Xeon E5-2670',
      memory: '32 GB DDR4',
      storage: '1 TB NVMe SSD',
      network: '1 Gbps'
    },
    metrics: {
      cpuUsage: '45%',
      memoryUsage: '68%',
      diskUsage: '34%',
      networkIn: '125 MB/s',
      networkOut: '89 MB/s'
    }
  },
  {
    id: 2,
    name: 'Brave-Green-Eagle',
    type: 'Server',
    location: 'London, UK',
    geoHash: 'gcpuvpk5c',
    status: 'online',
    uptime: '98.7%',
    lastSeen: '5 minutes ago',
    ip: '192.168.1.15',
    os: 'CentOS 8',
    osImage: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=128&h=128&fit=crop&crop=center',
    npub: 'npub1abc789def012345678901234567890123456789abcdef0123456789abcdef',
    bio: 'European gateway node 🇬🇧 Redundant power & multiple uplinks for reliability',
    specs: {
      cpu: 'AMD Ryzen 7 3700X',
      memory: '16 GB DDR4',
      storage: '512 GB SSD',
      network: '1 Gbps'
    },
    metrics: {
      cpuUsage: '32%',
      memoryUsage: '54%',
      diskUsage: '67%',
      networkIn: '89 MB/s',
      networkOut: '112 MB/s'
    }
  }
];
