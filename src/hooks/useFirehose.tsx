
import { useState, useEffect } from 'react';
import { Check } from '@/types/check';
import { checkService } from '@/services/checkService';

export const useFirehose = () => {
  // Load live stream state from localStorage or default to false (paused)
  const [isLivePlaying, setIsLivePlaying] = useState(() => {
    const savedLiveState = localStorage.getItem('checks-live-playing');
    return savedLiveState === 'true';
  });
  const [liveChecks, setLiveChecks] = useState<Check[]>([]);

  useEffect(() => {
    if (isLivePlaying) {
      const interval = setInterval(() => {
        const newCheck = checkService.generateLiveCheck();
        setLiveChecks(prev => [newCheck, ...prev.slice(0, 199)]);
      }, Math.random() * 3000 + 1000);

      return () => clearInterval(interval);
    }
  }, [isLivePlaying]);

  const toggleLiveStream = () => {
    const newState = !isLivePlaying;
    setIsLivePlaying(newState);
    localStorage.setItem('checks-live-playing', String(newState));
  };

  const clearLiveChecks = () => {
    setLiveChecks([]);
  };

  return {
    isLivePlaying,
    liveChecks,
    toggleLiveStream,
    clearLiveChecks,
    setIsLivePlaying
  };
};
