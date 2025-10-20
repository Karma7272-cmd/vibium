
export interface Check {
  id: string;
  url: string;
  operatorNpub: string;
  operatorName: string;
  nodeId: string;
  nodeName: string;
  timestamp: string;
  duration: number;
  statusCode: number;
  status: 'success' | 'failed' | 'warning' | 'running';
  location: string;
  screenshot: string;
  
  // Nostr-specific fields (for future integration)
  nostrEventId?: string;
  relay?: string;
  signature?: string;
  pubkey?: string;
  created_at?: number;
  
  // Blossom file server fields (for future integration)
  screenshotBlob?: string;
  screenshotUrl?: string;
  blobHash?: string;
  
  // Additional response data (for future integration)
  responseTime?: number;
  responseSize?: number;
  responseHeaders?: Record<string, string>;
  responseBody?: string;
  userAgent?: string;
  timings?: {
    dns: number;
    connect: number;
    tls: number;
    request: number;
    response: number;
  };
}

export interface Filters {
  status: string;
  url: string;
  operator: string;
  location: string;
  statusCode: string;
  node: string;
}

export type ViewMode = 'list' | 'grid';
