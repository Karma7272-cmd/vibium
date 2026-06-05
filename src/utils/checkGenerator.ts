
import { Check } from '@/types/check';
import { generateNeventId } from './nostrEvents';

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
  'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=300&fit=crop&auto=format',
  'https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7?w=400&h=300&fit=crop&auto=format',
  'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=400&h=300&fit=crop&auto=format',
  'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400&h=300&fit=crop&auto=format',
  'https://images.unsplash.com/photo-1605810230434-7631ac76ec81?w=400&h=300&fit=crop&auto=format'
];

export const generateChecks = (): Check[] => {
  return Array.from({ length: 247 }, (_, i) => {
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
        timestamp: new Date(Date.now() - Math.random() * 5 * 60 * 1000).toISOString(), // Within last 5 minutes
        duration: 0, // Still running
        statusCode: 0, // No status code yet
        status: 'running' as const,
        location: locations[i % locations.length],
        screenshot: screenshots[i % screenshots.length],
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
    };
  }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

export const generateNewCheck = (): Check => {
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
  };
};
