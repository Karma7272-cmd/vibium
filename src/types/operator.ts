
// Nostr event structure types
export interface NostrEvent {
  id: string;
  pubkey: string;
  created_at: number;
  kind: number;
  tags: string[][];
  content: string;
  sig: string;
}

// Kind 0 (profile/metadata) event content
export interface NostrProfile {
  name?: string;
  display_name?: string;
  about?: string;
  picture?: string;
  banner?: string;
  website?: string;
  nip05?: string;
  lud16?: string;
  location?: string;
}

// Extended operator data with Nostr fields
export interface OperatorData {
  npub: string;
  pubkey: string;
  profile: NostrProfile;
  followers: number;
  following: number;
  isVerified: boolean;
  yearsActive: number;
  completedChecks: number;
  geoHash: string;
  created_at: number;
}

// Kind 1 (text note) event for posts
export interface NostrPost {
  id: string;
  content: string;
  created_at: number;
  npub: string;
  likes: number;
  reposts: number;
  replies: number;
  timestamp: string; // Human readable
}

// Node information (custom event kind)
export interface Node {
  id: number;
  name: string;
  type: string;
  location: string;
  status: 'online' | 'offline' | 'maintenance';
  uptime: string;
  npub: string;
}

// API response types
export interface OperatorProfileResponse {
  operator: OperatorData;
  posts: NostrPost[];
  nodes: Node[];
}
