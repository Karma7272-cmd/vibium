
// Nostr event structure types for nodes
export interface NostrEvent {
  id: string;
  pubkey: string;
  created_at: number;
  kind: number;
  tags: string[][];
  content: string;
  sig: string;
}

// Node profile/metadata content
export interface NodeProfile {
  name?: string;
  display_name?: string;
  about?: string;
  picture?: string;
  banner?: string;
  website?: string;
  nip05?: string;
  location?: string;
  node_type?: string;
  os?: string;
}

// Hardware specifications
export interface NodeSpecs {
  cpu: string;
  memory: string;
  storage: string;
  network: string;
}

// Performance metrics
export interface NodeMetrics {
  cpuUsage: string;
  memoryUsage: string;
  diskUsage: string;
  networkIn: string;
  networkOut: string;
}

// Node statistics
export interface NodeStats {
  totalChecks: number;
  successRate: string;
  avgResponseTime: string;
}

// Extended node data with Nostr fields
export interface NodeData {
  id: number;
  npub: string;
  pubkey: string;
  operatorNpub: string; // New field for the operator who manages this node
  profile: NodeProfile;
  type: string;
  location: string;
  geoHash?: string;
  status: 'online' | 'offline' | 'maintenance';
  uptime: string;
  lastSeen: string;
  ip: string;
  os: string;
  osImage: string;
  specs: NodeSpecs;
  metrics: NodeMetrics;
  stats?: NodeStats; // New optional stats field
  bio?: string;
  created_at: number;
}

// Simplified node for lists - now includes profileImage for component compatibility
export interface NodeListItem {
  id: number;
  name: string;
  type: string;
  location: string;
  status: 'online' | 'offline' | 'maintenance';
  uptime: string;
  lastSeen: string;
  ip: string;
  os: string;
  osImage: string;
  profileImage: string;
  npub: string;
  operatorNpub: string; // New field for the operator who manages this node
  operatorName: string; // New field for the resolved operator name
  bio?: string;
}

// API response types
export interface NodeProfileResponse {
  node: NodeData;
  recentChecks: any[];
}
