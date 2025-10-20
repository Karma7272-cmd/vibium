
import React, { createContext, useContext, useState, useEffect } from 'react';

export interface SettingsContextType {
  dataSource: 'mock' | 'nostr';
  setDataSource: (source: 'mock' | 'nostr') => void;
  relayUrls: string[];
  setRelayUrls: (urls: string[]) => void;
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error';
  setConnectionStatus: (status: 'disconnected' | 'connecting' | 'connected' | 'error') => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

const DEFAULT_RELAYS = [
  'wss://relay.damus.io',
  'wss://nos.lol',
  'wss://relay.snort.social',
  'wss://relay.nostr.band'
];

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [dataSource, setDataSourceState] = useState<'mock' | 'nostr'>(() => {
    const saved = localStorage.getItem('valet-data-source');
    return (saved as 'mock' | 'nostr') || 'mock';
  });

  const [relayUrls, setRelayUrlsState] = useState<string[]>(() => {
    const saved = localStorage.getItem('valet-relay-urls');
    return saved ? JSON.parse(saved) : DEFAULT_RELAYS;
  });

  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');

  const setDataSource = (source: 'mock' | 'nostr') => {
    setDataSourceState(source);
    localStorage.setItem('valet-data-source', source);
  };

  const setRelayUrls = (urls: string[]) => {
    setRelayUrlsState(urls);
    localStorage.setItem('valet-relay-urls', JSON.stringify(urls));
  };

  useEffect(() => {
    if (dataSource === 'nostr') {
      setConnectionStatus('connecting');
      // TODO: Implement actual Nostr relay connection
      setTimeout(() => {
        setConnectionStatus('connected'); // Simulate connection for now
      }, 1000);
    } else {
      setConnectionStatus('disconnected');
    }
  }, [dataSource, relayUrls]);

  return (
    <SettingsContext.Provider value={{
      dataSource,
      setDataSource,
      relayUrls,
      setRelayUrls,
      connectionStatus,
      setConnectionStatus
    }}>
      {children}
    </SettingsContext.Provider>
  );
};
