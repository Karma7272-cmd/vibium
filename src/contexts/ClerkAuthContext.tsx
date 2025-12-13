import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';

interface ClerkAuthContextType {
  isSignedIn: boolean;
  userId: string | null;
  loading: boolean;
  signOut: () => Promise<void>;
  getGitHubToken: () => Promise<string | null>;
}

const ClerkAuthContext = createContext<ClerkAuthContextType>({
  isSignedIn: false,
  userId: null,
  loading: true,
  signOut: async () => {},
  getGitHubToken: async () => null,
});

export const useClerkAuth = () => useContext(ClerkAuthContext);

export const ClerkAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isLoaded, isSignedIn, signOut, getToken } = useAuth();
  const { user } = useUser();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isLoaded) {
      setLoading(false);
    }
  }, [isLoaded]);

  const handleSignOut = async () => {
    await signOut();
  };

  const getGitHubToken = async (): Promise<string | null> => {
    try {
      const token = await getToken({ template: 'github' });
      return token;
    } catch (error) {
      console.error('Error getting GitHub token:', error);
      return null;
    }
  };

  return (
    <ClerkAuthContext.Provider 
      value={{ 
        isSignedIn: isSignedIn ?? false, 
        userId: user?.id ?? null, 
        loading, 
        signOut: handleSignOut,
        getGitHubToken 
      }}
    >
      {children}
    </ClerkAuthContext.Provider>
  );
};
