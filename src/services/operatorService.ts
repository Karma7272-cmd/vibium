
import { OperatorData, NostrPost, Node, OperatorProfileResponse } from '@/types/operator';
import { generateMockOperatorData, generateMockPosts, generateMockNodes } from '@/data/mockOperatorData';
import { NostrService } from './nostrService';

export interface OperatorListItem {
  npub: string;
  name: string;
  displayName: string;
  picture: string;
  about: string;
  location: string;
  nodesCount: number;
  status: string;
  uptime: string;
}

// Check if we should use Nostr relays or mock data
const getDataSource = (): 'mock' | 'nostr' => {
  const saved = localStorage.getItem('valet-data-source');
  return (saved as 'mock' | 'nostr') || 'mock';
};

// Service functions that will eventually connect to Nostr relays and Blossom servers
export class OperatorService {
  // TODO: Replace with actual Nostr relay connection for operators list
  static async fetchOperatorsList(): Promise<OperatorListItem[]> {
    const dataSource = getDataSource();
    
    if (dataSource === 'nostr') {
      try {
        const nostrOperators = await NostrService.fetchOperatorsList();
        if (nostrOperators.length > 0) {
          return nostrOperators;
        }
        console.log('No operators found in Nostr relays, falling back to mock data');
      } catch (error) {
        console.error('Error fetching operators from Nostr relays:', error);
        console.log('Falling back to mock data');
      }
    }

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // For now, return mock data
    // In the future: Connect to Nostr relays and fetch multiple operator profiles
    const mockNpubs = [
      'npub1xyz123abc456def789012345678901234567890abcdef1234567890abcdef',
      'npub1abc789def012345678901234567890123456789abcdef0123456789012345',
      'npub1def456ghi789012345678901234567890123456789abcdef0123456789abc',
      'npub1ghi012jkl345678901234567890123456789012345678901234567890abcdef',
      'npub1jkl567mno890123456789012345678901234567890abcdef0123456789def',
      'npub1mno234pqr56789012345678901234567890abcdef0123456789',
      'npub1pqr678stu901234567890123456789012345678901234567890abcdef0123',
      'npub1stu345vwx678901234567890123456789012345678901234567890abcdef01',
      'npub1vwx012yza345678901234567890123456789012345678901234567890abcd',
      'npub1yza678bcd901234567890123456789012345678901234567890abcdef0123',
      'npub1bcd345efg678901234567890123456789012345678901234567890abcd',
      'npub1efg012hij345678901234567890123456789012345678901234567890abcd',
      'npub1hij567klm890123456789012345678901234567890123456789abcdef0123',
      'npub1klm234nop567890123456789012345678901234567890123456789abcdef01',
      'npub1nop678qrs901234567890123456789012345678901234567890abcdef0123'
    ];

    const statusOptions = ['online', 'offline', 'maintenance'];
    
    return mockNpubs.map((npub, index) => {
      const operatorData = generateMockOperatorData(npub);
      const hash = npub.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      
      return {
        npub: operatorData.npub,
        name: operatorData.profile.name || 'Unknown',
        displayName: operatorData.profile.display_name || 'unknown',
        picture: operatorData.profile.picture || '',
        about: operatorData.profile.about || '',
        location: operatorData.profile.location || '',
        nodesCount: 2 + (hash % 6), // 2-7 nodes
        status: statusOptions[hash % statusOptions.length],
        uptime: `${(95 + (hash % 5)).toFixed(1)}%`
      };
    });
  }

  // TODO: Replace with actual Nostr relay connection
  static async fetchOperatorProfile(npub: string): Promise<OperatorData> {
    const dataSource = getDataSource();
    
    if (dataSource === 'nostr') {
      try {
        const nostrProfile = await NostrService.fetchOperatorProfile(npub);
        if (nostrProfile) {
          return nostrProfile;
        }
        console.log('Operator profile not found in Nostr relays, falling back to mock data');
      } catch (error) {
        console.error('Error fetching operator profile from Nostr relays:', error);
        console.log('Falling back to mock data');
      }
    }

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // For now, return mock data
    // In the future: Connect to Nostr relays and fetch kind 0 events
    return generateMockOperatorData(npub);
  }

  // TODO: Replace with actual Nostr kind 1 event fetching
  static async fetchOperatorPosts(npub: string, operatorName: string): Promise<NostrPost[]> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // For now, return mock data
    // In the future: Connect to Nostr relays and fetch kind 1 events for this npub
    return generateMockPosts(npub, operatorName);
  }

  // TODO: Replace with actual custom Nostr event fetching for nodes
  static async fetchOperatorNodes(npub: string): Promise<Node[]> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // For now, return mock data
    // In the future: Connect to Nostr relays and fetch custom node announcement events
    return generateMockNodes(npub);
  }

  // TODO: Replace with actual Blossom protocol image fetching
  static async fetchProfileImage(npub: string): Promise<string | null> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // For now, return mock image URL
    // In the future: Use Blossom protocol to fetch profile images
    const operator = generateMockOperatorData(npub);
    return operator.profile.picture || null;
  }

  // Convenience method to fetch all operator data at once
  static async fetchFullOperatorProfile(npub: string): Promise<OperatorProfileResponse> {
    try {
      const operator = await this.fetchOperatorProfile(npub);
      const [posts, nodes] = await Promise.all([
        this.fetchOperatorPosts(npub, operator.profile.name || ''),
        this.fetchOperatorNodes(npub)
      ]);

      return {
        operator,
        posts,
        nodes
      };
    } catch (error) {
      console.error('Error fetching operator profile:', error);
      throw error;
    }
  }
}
