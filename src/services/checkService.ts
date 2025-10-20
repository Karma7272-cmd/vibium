import { Check } from '@/types/check';
import { generateNeventId } from '@/utils/nostrEvents';
import { NostrService } from './nostrService';

// Check if we should use Nostr relays or mock data
const getDataSource = (): 'mock' | 'nostr' => {
  const saved = localStorage.getItem('valet-data-source');
  return (saved as 'mock' | 'nostr') || 'mock';
};

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

const operators = [
  { npub: 'npub1abc123def456789abcdef0123456789abcdef0123456789abcdef012345', name: 'Alice' },
  { npub: 'npub1def456ghi789012def456789012def456789012def456789012def345678', name: 'Bob' },
  { npub: 'npub1ghi789jkl012345ghi789012345ghi789012345ghi789012345ghi678901', name: 'Charlie' },
  { npub: 'npub1jkl012mno345678jkl012345678jkl012345678jkl012345678jkl901234', name: 'Diana' },
  { npub: 'npub1mno345pqr678901mno345678901mno345678901mno345678901mno234567', name: 'Eve' },
];

const locations = ['New York, USA', 'London, UK', 'Tokyo, Japan', 'Sydney, Australia', 'Berlin, Germany'];

const screenshots = [
  'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=300&fit=crop&auto=format',
  'https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7?w=400&h=300&fit=crop&auto=format',
  'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=400&h=300&fit=crop&auto=format',
  'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400&h=300&fit=crop&auto=format',
  'https://images.unsplash.com/photo-1605810230434-7631ac76ec81?w=400&h=300&fit=crop&auto=format',
];

// Simulated database of checks
let mockChecksCache: Check[] | null = null;

export const checkService = {
  // Get all checks (static data)
  getChecks: async (): Promise<Check[]> => {
    const dataSource = getDataSource();
    
    if (dataSource === 'nostr') {
      try {
        const nostrChecks = await NostrService.fetchChecksList();
        if (nostrChecks.length > 0) {
          return nostrChecks;
        }
        console.log('No checks found in Nostr relays, falling back to mock data');
      } catch (error) {
        console.error('Error fetching checks from Nostr relays:', error);
        console.log('Falling back to mock data');
      }
    }

    if (mockChecksCache) {
      return mockChecksCache;
    }

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100));

    const checks = Array.from({ length: 247 }, (_, i) => {
      const operator = operators[i % operators.length];
      
      // Add some running checks (about 20 of them)
      if (i < 20) {
        return {
          id: generateNeventId(),
          url: urls[i % urls.length],
          operatorNpub: operator.npub,
          operatorName: operator.name,
          nodeId: `node-${(i % 15) + 1}`,
          nodeName: `Node ${(i % 15) + 1}`,
          timestamp: new Date(Date.now() - Math.random() * 5 * 60 * 1000).toISOString(),
          duration: 0,
          statusCode: 0,
          status: 'running' as const,
          location: locations[i % locations.length],
          screenshot: screenshots[i % screenshots.length],
          responseTime: 0,
          responseSize: 0,
          userAgent: 'Valet-Network-Bot/1.0',
        };
      }
      
      const statusCodes = [200, 200, 200, 200, 404, 500, 301, 302];
      const statusCode = statusCodes[i % statusCodes.length];
      
      let status: 'success' | 'failed' | 'warning';
      if (statusCode === 200) {
        status = 'success';
      } else if (statusCode >= 400) {
        status = 'failed';
      } else {
        status = 'warning';
      }
      
      return {
        id: generateNeventId(),
        url: urls[i % urls.length],
        operatorNpub: operator.npub,
        operatorName: operator.name,
        nodeId: `node-${(i % 15) + 1}`,
        nodeName: `Node ${(i % 15) + 1}`,
        timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        duration: Math.floor(Math.random() * 5000) + 100,
        statusCode,
        status,
        location: locations[i % locations.length],
        screenshot: screenshots[i % screenshots.length],
        responseTime: Math.floor(Math.random() * 2000) + 50,
        responseSize: Math.floor(Math.random() * 1000000) + 10000,
        userAgent: 'Valet-Network-Bot/1.0',
      };
    }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    mockChecksCache = checks;
    return checks;
  },

  // Get a specific check by ID
  getCheckById: async (checkId: string): Promise<Check | null> => {
    const dataSource = getDataSource();
    
    if (dataSource === 'nostr') {
      try {
        const nostrCheck = await NostrService.fetchCheckById(checkId);
        if (nostrCheck) {
          return nostrCheck;
        }
        console.log('Check not found in Nostr relays, falling back to mock data');
      } catch (error) {
        console.error('Error fetching check from Nostr relays:', error);
        console.log('Falling back to mock data');
      }
    }

    // Handle demo check for healthcare.gov
    if (checkId === 'demo_healthcare_gov_ipad_dc') {
      return {
        id: checkId,
        url: 'healthcare.gov',
        operatorNpub: 'npub1abc123def456789abcdef0123456789abcdef0123456789abcdef012345',
        operatorName: 'Alice',
        nodeId: 'node-8',
        nodeName: 'Node 8',
        timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(), // 2 minutes ago
        duration: 3247,
        statusCode: 200,
        status: 'success' as const,
        location: 'Washington, DC',
        screenshot: '/healthcare-gov-ipad-screenshot.jpg',
        responseTime: 1823,
        responseSize: 2847593,
        userAgent: 'Mozilla/5.0 (iPad; CPU OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
      };
    }

    // For now, generate consistent data based on the ID
    // In the future, this will query Nostr relays for the actual event
    
    if (!checkId || checkId === 'nevent1invalid') {
      return null;
    }

    // Generate consistent data based on checkId
    const seed = checkId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const operator = operators[seed % operators.length];
    
    const isRunning = (seed % 5) === 0;
    
    let statusCode, status;
    if (isRunning) {
      statusCode = 0;
      status = 'running';
    } else {
      const statusCodes = [200, 200, 200, 200, 404, 500, 301, 302];
      statusCode = statusCodes[seed % statusCodes.length];
      status = statusCode === 200 ? 'success' : statusCode >= 400 ? 'failed' : 'warning';
    }
    
    return {
      id: checkId,
      url: urls[seed % urls.length],
      operatorNpub: operator.npub,
      operatorName: operator.name,
      nodeId: `node-${(seed % 15) + 1}`,
      nodeName: `Node ${(seed % 15) + 1}`,
      timestamp: isRunning 
        ? new Date(Date.now() - Math.random() * 5 * 60 * 1000).toISOString()
        : new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      duration: isRunning ? 0 : Math.floor(Math.random() * 5000) + 100,
      statusCode,
      status: status as 'success' | 'failed' | 'warning' | 'running',
      location: locations[seed % locations.length],
      screenshot: `/placeholder.svg?height=400&width=600&text=Screenshot+${seed}`,
      responseTime: isRunning ? 0 : Math.floor(Math.random() * 2000) + 50,
      responseSize: isRunning ? 0 : Math.floor(Math.random() * 1000000) + 10000,
      userAgent: 'Valet-Network-Bot/1.0',
    };
  },

  // Generate a new live check
  generateLiveCheck: (): Check => {
    const operator = operators[Math.floor(Math.random() * operators.length)];
    
    // 20% chance of generating a running check
    if (Math.random() < 0.2) {
      return {
        id: generateNeventId(),
        url: urls[Math.floor(Math.random() * urls.length)],
        operatorNpub: operator.npub,
        operatorName: operator.name,
        nodeId: `node-${Math.floor(Math.random() * 15) + 1}`,
        nodeName: `Node ${Math.floor(Math.random() * 15) + 1}`,
        timestamp: new Date().toISOString(),
        duration: 0,
        statusCode: 0,
        status: 'running' as const,
        location: locations[Math.floor(Math.random() * locations.length)],
        screenshot: screenshots[Math.floor(Math.random() * screenshots.length)],
        responseTime: 0,
        responseSize: 0,
        userAgent: 'Valet-Network-Bot/1.0',
      };
    }
    
    const statusCodes = [200, 200, 200, 200, 404, 500, 301, 302];
    const statusCode = statusCodes[Math.floor(Math.random() * statusCodes.length)];
    
    let status: 'success' | 'failed' | 'warning';
    if (statusCode === 200) {
      status = 'success';
    } else if (statusCode >= 400) {
      status = 'failed';
    } else {
      status = 'warning';
    }
    
    return {
      id: generateNeventId(),
      url: urls[Math.floor(Math.random() * urls.length)],
      operatorNpub: operator.npub,
      operatorName: operator.name,
      nodeId: `node-${Math.floor(Math.random() * 15) + 1}`,
      nodeName: `Node ${Math.floor(Math.random() * 15) + 1}`,
      timestamp: new Date().toISOString(),
      duration: Math.floor(Math.random() * 5000) + 100,
      statusCode,
      status,
      location: locations[Math.floor(Math.random() * locations.length)],
      screenshot: screenshots[Math.floor(Math.random() * screenshots.length)],
      responseTime: Math.floor(Math.random() * 2000) + 50,
      responseSize: Math.floor(Math.random() * 1000000) + 10000,
      userAgent: 'Valet-Network-Bot/1.0',
    };
  },

  // Future method for subscribing to live checks from Nostr relays
  subscribeToLiveChecks: (callback: (check: Check) => void) => {
    // This will be implemented when we integrate with Nostr relays
    // For now, return a no-op unsubscribe function
    return () => {};
  },

  // Clear cache (useful for development)
  clearCache: () => {
    mockChecksCache = null;
  }
};
