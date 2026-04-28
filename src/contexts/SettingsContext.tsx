import React, { createContext, useContext, useState, useEffect } from 'react';

export interface EnvVar {
  id: string;
  key: string;
  value: string;
}

export interface SettingsContextType {
  dataSource: 'mock' | 'nostr';
  setDataSource: (source: 'mock' | 'nostr') => void;
  relayUrls: string[];
  setRelayUrls: (urls: string[]) => void;
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error';
  setConnectionStatus: (status: 'disconnected' | 'connecting' | 'connected' | 'error') => void;
  envVars: EnvVar[];
  addEnvVar: (key: string, value: string) => void;
  removeEnvVar: (id: string) => void;
  updateEnvVar: (id: string, key: string, value: string) => void;
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

  const [envVars, setEnvVarsState] = useState<EnvVar[]>(() => {
    const saved = localStorage.getItem('valet-env-vars');
    return saved ? JSON.parse(saved) : [];
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

  const addEnvVar = (key: string, value: string) => {
    const newVars = [...envVars, { id: crypto.randomUUID(), key, value }];
    setEnvVarsState(newVars);
    localStorage.setItem('valet-env-vars', JSON.stringify(newVars));
  };

  const removeEnvVar = (id: string) => {
    const newVars = envVars.filter(v => v.id !== id);
    setEnvVarsState(newVars);
    localStorage.setItem('valet-env-vars', JSON.stringify(newVars));
  };

  const updateEnvVar = (id: string, key: string, value: string) => {
    const newVars = envVars.map(v => v.id === id ? { ...v, key, value } : v);
    setEnvVarsState(newVars);
    localStorage.setItem('valet-env-vars', JSON.stringify(newVars));
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
      setConnectionStatus,
      envVars,
      addEnvVar,
      removeEnvVar,
      updateEnvVar,
    }}>
      {children}
    </SettingsContext.Provider>
  );
};
