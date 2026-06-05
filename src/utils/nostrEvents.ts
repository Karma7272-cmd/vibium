
// Simple implementation of Nostr nevent-style IDs
// Format: nevent1{encoded_data}

export const generateNeventId = (): string => {
  // Generate a random 32-byte hex string (similar to Nostr event IDs)
  const eventId = Array.from({ length: 64 }, () => 
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
  
  // Simple encoding: convert hex to base32-like string
  const encoded = btoa(eventId)
    .replace(/\+/g, '0')
    .replace(/\//g, '1')
    .replace(/=/g, '')
    .toLowerCase();
  
  return `nevent1${encoded}`;
};

export const parseNeventId = (neventId: string): string | null => {
  if (!neventId.startsWith('nevent1')) {
    return null;
  }
  
  try {
    const encoded = neventId.substring(7); // Remove 'nevent1' prefix
    const decoded = atob(encoded.replace(/0/g, '+').replace(/1/g, '/'));
    return decoded;
  } catch (error) {
    return null;
  }
};

export const isValidNeventId = (id: string): boolean => {
  return id.startsWith('nevent1') && parseNeventId(id) !== null;
};
