import { NodeData, NodeListItem, NodeProfileResponse } from '@/types/node';
import { NostrService } from './nostrService';
import { generateMockOperatorData } from '@/data/mockOperatorData';

// Check if we should use Nostr relays or mock data
const getDataSource = (): 'mock' | 'nostr' => {
  const saved = localStorage.getItem('valet-data-source');
  return (saved as 'mock' | 'nostr') || 'mock';
};

export class NodeService {
  static async fetchNodesList(): Promise<NodeListItem[]> {
    const dataSource = getDataSource();
    
    if (dataSource === 'nostr') {
      try {
        const nostrNodes = await NostrService.fetchNodesList();
        if (nostrNodes.length > 0) {
          return nostrNodes;
        }
        console.log('No nodes found in Nostr relays, falling back to mock data');
      } catch (error) {
        console.error('Error fetching nodes from Nostr relays:', error);
        console.log('Falling back to mock data');
      }
    }

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    return mockNodesList;
  }

  static async fetchNodeProfile(npub: string): Promise<NodeProfileResponse> {
    const dataSource = getDataSource();
    
    if (dataSource === 'nostr') {
      try {
        const nostrProfile = await NostrService.fetchNodeProfile(npub);
        if (nostrProfile) {
          return nostrProfile;
        }
        console.log('Node profile not found in Nostr relays, falling back to mock data');
      } catch (error) {
        console.error('Error fetching node profile from Nostr relays:', error);
        console.log('Falling back to mock data');
      }
    }

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const node = mockNodesData.find(n => n.npub === npub) || mockNodesData[0];
    
    return {
      node,
      recentChecks: mockRecentChecks
    };
  }

  static async fetchNodeMetrics(npub: string) {
    const dataSource = getDataSource();
    
    if (dataSource === 'nostr') {
      try {
        // For now, NostrService doesn't have metrics-specific endpoints
        // but we could add this in the future
        console.log('Nostr metrics fetching not yet implemented, using mock data');
      } catch (error) {
        console.error('Error fetching node metrics from Nostr relays:', error);
      }
    }

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const node = mockNodesData.find(n => n.npub === npub);
    return node?.metrics || mockNodesData[0].metrics;
  }
}

// Mock operator npubs that match the mock operators
const mockOperatorNpubs = [
  'npub1operator1abc456def789012345678901234567890abcdef1234567890abc',
  'npub1operator2def789012345678901234567890123456789abcdef0123456789',
  'npub1operator3ghi012345678901234567890123456789abcdef0123456789def',
  'npub1operator4jkl345678901234567890123456789abcdef0123456789012345'
];

// Mock data - will be replaced with Nostr relay data
const mockNodesList: NodeListItem[] = [
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
    operatorNpub: mockOperatorNpubs[0], // Managed by first operator
    operatorName: generateMockOperatorData(mockOperatorNpubs[0]).profile.name || 'Unknown',
    bio: 'High-performance server node located in a Tier 3 data center in Manhattan.'
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
    operatorNpub: mockOperatorNpubs[1], // Managed by second operator
    operatorName: generateMockOperatorData(mockOperatorNpubs[1]).profile.name || 'Unknown',
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
    operatorNpub: mockOperatorNpubs[2], // Managed by third operator
    operatorName: generateMockOperatorData(mockOperatorNpubs[2]).profile.name || 'Unknown',
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
    operatorNpub: mockOperatorNpubs[3], // Managed by fourth operator
    operatorName: generateMockOperatorData(mockOperatorNpubs[3]).profile.name || 'Unknown',
    bio: 'Windows-based testing node serving the Australian market.'
  }
];

const mockNodesData: NodeData[] = [
  {
    id: 1,
    npub: 'npub1xyz123abc456def789012345678901234567890abcdef1234567890abcdef',
    pubkey: 'xyz123abc456def789012345678901234567890abcdef1234567890abcdef',
    operatorNpub: mockOperatorNpubs[0],
    profile: {
      name: 'Cheerful-Blue-Dolphin',
      display_name: 'Cheerful Blue Dolphin',
      about: 'High-performance NYC server node 🏙️ Enterprise-grade hardware for low-latency apps',
      picture: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=128&h=128&fit=crop&crop=center',
      location: 'New York, USA',
      node_type: 'Server',
      os: 'Ubuntu 22.04 LTS'
    },
    type: 'Server',
    location: 'New York, USA',
    geoHash: 'dr5regw3p',
    status: 'online',
    uptime: '99.9%',
    lastSeen: '2 minutes ago',
    ip: '192.168.1.10',
    os: 'Ubuntu 22.04 LTS',
    osImage: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=128&h=128&fit=crop&crop=center',
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
    },
    stats: {
      totalChecks: 1247,
      successRate: '98.7%',
      avgResponseTime: '145ms'
    },
    bio: 'High-performance NYC server node 🏙️ Enterprise-grade hardware for low-latency apps',
    created_at: Date.now() - 86400000 * 30
  },
  {
    id: 2,
    npub: 'npub1abc789def012345678901234567890123456789abcdef0123456789abcdef',
    pubkey: 'abc789def012345678901234567890123456789abcdef0123456789abcdef',
    operatorNpub: mockOperatorNpubs[1],
    profile: {
      name: 'Brave-Green-Eagle',
      display_name: 'Brave Green Eagle',
      about: 'European gateway node 🇬🇧 Redundant power & multiple uplinks for reliability',
      picture: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=128&h=128&fit=crop&crop=center',
      location: 'London, UK',
      node_type: 'Server',
      os: 'CentOS 8'
    },
    type: 'Server',
    location: 'London, UK',
    geoHash: 'gcpuvpk5c',
    status: 'online',
    uptime: '98.7%',
    lastSeen: '5 minutes ago',
    ip: '192.168.1.15',
    os: 'CentOS 8',
    osImage: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=128&h=128&fit=crop&crop=center',
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
    },
    stats: {
      totalChecks: 892,
      successRate: '97.3%',
      avgResponseTime: '178ms'
    },
    bio: 'European gateway node 🇬🇧 Redundant power & multiple uplinks for reliability',
    created_at: Date.now() - 86400000 * 45
  }
];

const mockRecentChecks = [
  {
    id: 1,
    type: 'HTTP Check',
    url: 'https://example.com',
    status: 'success',
    duration: '245ms',
    timestamp: '2 minutes ago'
  },
  {
    id: 2,
    type: 'DNS Lookup',
    url: 'google.com',
    status: 'success',
    duration: '18ms',
    timestamp: '5 minutes ago'
  },
  {
    id: 3,
    type: 'Port Scan',
    url: '192.168.1.1:80',
    status: 'failed',
    duration: '5000ms',
    timestamp: '12 minutes ago'
  },
  {
    id: 4,
    type: 'SSL Check',
    url: 'https://secure.example.com',
    status: 'pending',
    duration: '-',
    timestamp: '15 minutes ago'
  }
];
